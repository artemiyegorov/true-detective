# ElevenLabs Voice Configuration — Case #001

**Platform:** https://elevenlabs.io  
**Model:** `eleven_turbo_v2_5` (supports emotion tags, fast inference <1s)  
**API docs:** https://elevenlabs.io/docs/api-reference

---

## Voice Mapping

Voice IDs below are SUGGESTIONS from ElevenLabs' public voice library. Audition each in the ElevenLabs voice library before finalizing — voice IDs may change. Alternative names provided where voice selection is flexible.

| Character | Voice Name | Voice Profile | Notes |
|---|---|---|---|
| Narrator (briefing) | Adam or Brian | Mid-40s American male, calm, measured | Authoritative voiceover style |
| Sarah Kim | Matilda or Rachel | Warm alto female, composed | Slight emotional range |
| David Cole | Daniel or Clyde | Older male, tired tone | Low-register, weary |
| Martin Reyes | Antoni or Nicole (custom) | Young male, warm | Ideally Spanish-accented English — may need custom voice clone in v1.1 |
| Tyler Cole | Josh or Freya | Young male, soft | Slight vocal fry, mumble-prone |
| Kevin Pratt | Sam or Ethan | Mid-range friendly male | Chatty, neutral American |

**Action item:** Before implementation, browse the ElevenLabs voice library at https://elevenlabs.io/app/voice-library and listen to sample clips. Replace the above names with actual voice_id strings from the library. Store them in environment variables or a config file.

---

## Mood-to-Voice-Settings Mapping

When the NPC prompt returns a `state.mood` value, the backend should select the corresponding voice settings for the ElevenLabs API call.

| Mood | Stability | Similarity Boost | Style | Notes |
|---|---|---|---|---|
| calm | 0.70 | 0.80 | 0.20 | Baseline, measured delivery |
| guarded | 0.60 | 0.78 | 0.30 | Slightly tighter, less natural flow |
| nervous | 0.45 | 0.75 | 0.45 | More emotional variation, breathier |
| defensive | 0.50 | 0.75 | 0.50 | Firmer, edge of anger |
| panicked | 0.30 | 0.72 | 0.60 | Unstable, rushed, emotional |
| broken | 0.25 | 0.70 | 0.70 | Cracked, wavering, tearful |
| angry | 0.35 | 0.75 | 0.65 | Harder edges, emphasis spikes |
| indignant | 0.55 | 0.78 | 0.55 | Controlled anger, projection |
| numb | 0.75 | 0.80 | 0.10 | Flat, emotionless (Tyler) |
| withdrawn | 0.70 | 0.80 | 0.15 | Quiet, distant |
| sad | 0.50 | 0.75 | 0.45 | Soft, muted grief |
| scared | 0.40 | 0.73 | 0.50 | Tight, quiet, shaky |
| cooperative | 0.65 | 0.78 | 0.30 | Open, relaxed but respectful |
| confused | 0.55 | 0.75 | 0.35 | Uncertain, rising pitch |
| curious | 0.65 | 0.78 | 0.40 | Engaged, slight inflection |
| helpful | 0.65 | 0.78 | 0.30 | Warm, clear |
| thoughtful | 0.70 | 0.78 | 0.25 | Paced, reflective |
| surprised | 0.40 | 0.73 | 0.55 | Quick pitch rise |
| annoyed | 0.55 | 0.75 | 0.45 | Short, clipped |
| grieving | 0.55 | 0.77 | 0.40 | Heavy, slow |

**Narrator settings (briefing only):**
| Context | Stability | Similarity | Style |
|---|---|---|---|
| Briefing opening | 0.75 | 0.80 | 0.15 |
| Verdict reconstruction | 0.70 | 0.80 | 0.25 |

---

## Text Preprocessing

### For TTS (preserve all tags)

The `voice_text` field from the LLM includes emotion tags and formatting that ElevenLabs parses. Send it AS-IS to the TTS API.

Supported ElevenLabs inline tags:
- `[nervous]`, `[quiet]`, `[angry]`, `[sad]`
- `[whispers]`, `[sighs]`, `[laughs]`, `[cries]`
- `[voice breaking]`

Supported formatting:
- `...` → natural pauses
- `—` → broken/interrupted speech
- `CAPS` → emphasis/stress
- `*italic*` → (not parsed by ElevenLabs, avoid)

### For UI display (strip tags)

Remove bracket tags before displaying in the chat feed:

```javascript
function cleanForDisplay(voiceText) {
  return voiceText
    .replace(/\[[^\]]+\]/g, '')  // Remove [tag] markers
    .trim();
}
```

Keep `...`, `—`, and CAPS in display text — they're natural punctuation.

---

## API Request Template

```javascript
async function generateVoice(voiceText, voiceId, mood) {
  const settings = MOOD_TO_SETTINGS[mood] || MOOD_TO_SETTINGS.calm;
  
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: voiceText,  // Keep tags intact
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: settings.stability,
          similarity_boost: settings.similarity,
          style: settings.style,
          use_speaker_boost: true
        }
      })
    }
  );
  
  if (!response.ok) {
    throw new Error(`ElevenLabs error: ${response.status}`);
  }
  
  const audioBlob = await response.blob();
  return audioBlob;
}
```

---

## Audio Caching Strategy

To reduce costs and latency:

1. **Cache by hash.** Hash the `voice_text + voiceId + settings` combo. If identical request arrives, return cached audio.
2. **Store audio in Supabase Storage.** One file per unique response. Reference URL in message record.
3. **Pre-generate briefing audio.** Narrator script for each case is static — generate once at case creation, not per playthrough.
4. **Don't pre-generate NPC dialogue.** It's dynamic and unique per conversation.

### Cost estimate per playthrough

- Briefing: ~50 words × narrator, pre-generated (free per user)
- NPC responses: ~40 per case × ~20 words each = 800 words
- ElevenLabs pricing (as of early 2026): $0.30 per 1000 characters on Turbo v2.5
- 800 words ≈ 4000 characters ≈ **$1.20 per playthrough** if all voiced

At scale (1000 players/day × 30 days = 30k playthroughs/mo), that's $36k/mo just for voice. **Not sustainable for free-tier.**

**Recommendation for MVP and early beta:**
- Voice ONLY for narrator (briefing) — very cheap, huge atmospheric impact
- NPC dialogue TEXT-ONLY in MVP
- Add NPC voice as Premium feature post-MVP ($9.99/mo tier)

For the Speedrun demo video specifically: generate Sarah's voice for the demo clip manually via ElevenLabs playground (no API needed for a 2-minute video). Show potential to investors without building the production pipeline yet.

---

## Streaming vs. Non-streaming

ElevenLabs supports streaming TTS, reducing time-to-first-audio from ~1s to ~300ms.

For MVP: use non-streaming (simpler). Generate full audio, return blob URL, play in browser when ready.

For v1.1: implement streaming for NPCs to feel more "alive" — audio begins playing as the first sentence completes.

---

## Voice Cloning Notes (Future)

If Martin's Guatemalan-accented English isn't achievable from the base voice library, consider:

1. **Instant Voice Cloning** ($5/mo Creator tier) — upload a 30-second reference clip of a voice actor with the right accent, get an instant clone.
2. **Professional Voice Cloning** ($99/mo Pro tier) — higher quality, longer training, requires explicit consent documentation.

For MVP: use a standard voice that "sounds young and warm" even if not perfectly accented. Authenticity can come in v1.1.

---

## Testing Checklist

Before production:

- [ ] Audition each character voice with a sample line from their character
- [ ] Verify emotion tags produce audible differences (test [nervous], [quiet], [voice breaking] explicitly)
- [ ] Test mood-to-settings mapping: generate same line with mood=calm and mood=panicked, verify clear audible difference
- [ ] Test non-English words in Martin's lines ("Dios mío") — does the voice handle it naturally?
- [ ] Test long responses (40+ words) for naturalness
- [ ] Test short responses (3-5 words) — sometimes Turbo v2.5 clips short lines
- [ ] Verify audio caching reduces duplicate API calls
- [ ] Measure per-playthrough cost with voice enabled vs disabled