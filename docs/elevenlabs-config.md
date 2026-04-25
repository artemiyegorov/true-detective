# ElevenLabs Voice Configuration — Case #001 (Open Investigation v1.0)

**Platform:** https://elevenlabs.io  
**Model:** `eleven_turbo_v2_5` (supports emotion tags, ~1s latency)  
**Pricing:** ~$0.30 per 1000 characters on Turbo v2.5 (verify current rates)  
**API docs:** https://elevenlabs.io/docs/api-reference

---

## Voice Mapping

Voice IDs below are SUGGESTIONS from ElevenLabs' public voice library. **Audition each voice in the ElevenLabs voice library before finalizing** — voice IDs and library contents update over time. Replace these names with actual voice_id strings before implementation.

| Character | Voice Name (suggested) | Voice Profile | Notes |
|---|---|---|---|
| Narrator (briefing) | Adam or Brian | Mid-40s American male, calm, measured | Authoritative voiceover style |
| Tom Brennan | Brian or Adam | Mid-50s American male, warm, salesman-confident | THE MURDERER — must sound trustworthy at first |
| Sarah Kim | Matilda or Rachel | Warm alto female, composed | Slight Chicago trace |
| David Cole | Daniel or Clyde | Older male, tired tone | Low-register, weary |
| Daniel Kim | Ethan or Sam | Mid-range male, edgy | Should sound shaky/strung-out |
| Martin Reyes | Antoni | Younger male, warm | Spanish-accented English ideally |
| Tyler Cole | Josh or Freya | Young male, soft | Vocal fry, mumble-prone |
| Kevin Pratt | Sam or Ethan | Mid-range friendly male | Chatty, neutral American |
| Mrs. Carrington | Lily or Charlotte | Older female (70s+), warm, slightly tremulous | Warm but slightly fragile |

**Important:** Tom Brennan's voice is the most critical casting decision. He must sound like a respectable family friend in his "warm" mood and like a man cracking under pressure in his "broken" mood. Audition multiple male voices in their 50s before locking in.

**Action item before coding:**
1. Browse https://elevenlabs.io/app/voice-library
2. For each character, audition 2-3 candidate voices
3. Generate a sample line in their character voice
4. Lock in voice_id for each character
5. Store voice_ids in environment variables: `VOICE_ID_TOM`, `VOICE_ID_SARAH`, etc.

---

## Mood-to-Voice-Settings Mapping

The NPC prompt returns a `state.mood` value. Backend selects voice settings based on mood. Lower stability = more emotional expression.

| Mood | Stability | Similarity Boost | Style |
|---|---|---|---|
| calm | 0.70 | 0.80 | 0.20 |
| warm | 0.65 | 0.78 | 0.30 |
| guarded | 0.60 | 0.78 | 0.30 |
| nervous | 0.45 | 0.75 | 0.45 |
| tense | 0.50 | 0.75 | 0.40 |
| defensive | 0.50 | 0.75 | 0.50 |
| panicked | 0.30 | 0.72 | 0.60 |
| broken | 0.25 | 0.70 | 0.70 |
| angry | 0.35 | 0.75 | 0.65 |
| hostile | 0.40 | 0.75 | 0.55 |
| indignant | 0.55 | 0.78 | 0.55 |
| stonewalling | 0.75 | 0.80 | 0.15 |
| numb | 0.75 | 0.80 | 0.10 |
| withdrawn | 0.70 | 0.80 | 0.15 |
| sad | 0.50 | 0.75 | 0.45 |
| scared | 0.40 | 0.73 | 0.50 |
| cooperative | 0.65 | 0.78 | 0.30 |
| confused | 0.55 | 0.75 | 0.35 |
| curious | 0.65 | 0.78 | 0.40 |
| helpful | 0.65 | 0.78 | 0.30 |
| thoughtful | 0.70 | 0.78 | 0.25 |
| surprised | 0.40 | 0.73 | 0.55 |
| annoyed | 0.55 | 0.75 | 0.45 |
| grieving | 0.55 | 0.77 | 0.40 |
| edgy | 0.45 | 0.74 | 0.50 |
| desperate | 0.30 | 0.72 | 0.65 |
| engaged | 0.65 | 0.78 | 0.35 |
| unsure | 0.55 | 0.76 | 0.30 |
| tangential | 0.65 | 0.78 | 0.30 |
| overwhelmed | 0.40 | 0.74 | 0.55 |
| cracking | 0.45 | 0.74 | 0.55 |

**Narrator settings (briefing only):**
| Context | Stability | Similarity | Style |
|---|---|---|---|
| Briefing opening | 0.75 | 0.80 | 0.15 |
| Verdict reconstruction | 0.70 | 0.80 | 0.25 |
| Ending narration | 0.70 | 0.80 | 0.30 |

---

## Text Preprocessing

### For TTS (preserve all tags)

The `voice_text` field from the LLM includes emotion tags and formatting that ElevenLabs parses. Send AS-IS to TTS API.

**Supported ElevenLabs inline tags:**
- `[nervous]`, `[quiet]`, `[angry]`, `[sad]`
- `[whispers]`, `[sighs]`, `[laughs]`, `[chuckles]`, `[chuckles softly]`, `[cries]`
- `[voice breaking]`
- `[thoughtful]`

**Supported formatting:**
- `...` → natural pauses
- `—` → broken/interrupted speech
- `CAPS` → emphasis/stress
- Avoid asterisks `*italic*` — ElevenLabs doesn't parse these.

### For UI display (strip tags)

Remove bracket tags before displaying in chat:

```javascript
function cleanForDisplay(voiceText) {
  return voiceText
    .replace(/\[[^\]]+\]/g, '')  // Remove [tag] markers
    .trim();
}
```

Keep `...`, `—`, and CAPS in display text — they're natural punctuation and add reading texture.

---

## API Request Template

```javascript
const MOOD_TO_SETTINGS = {
  calm: { stability: 0.70, similarity_boost: 0.80, style: 0.20 },
  warm: { stability: 0.65, similarity_boost: 0.78, style: 0.30 },
  guarded: { stability: 0.60, similarity_boost: 0.78, style: 0.30 },
  nervous: { stability: 0.45, similarity_boost: 0.75, style: 0.45 },
  tense: { stability: 0.50, similarity_boost: 0.75, style: 0.40 },
  defensive: { stability: 0.50, similarity_boost: 0.75, style: 0.50 },
  panicked: { stability: 0.30, similarity_boost: 0.72, style: 0.60 },
  broken: { stability: 0.25, similarity_boost: 0.70, style: 0.70 },
  angry: { stability: 0.35, similarity_boost: 0.75, style: 0.65 },
  hostile: { stability: 0.40, similarity_boost: 0.75, style: 0.55 },
  indignant: { stability: 0.55, similarity_boost: 0.78, style: 0.55 },
  stonewalling: { stability: 0.75, similarity_boost: 0.80, style: 0.15 },
  numb: { stability: 0.75, similarity_boost: 0.80, style: 0.10 },
  withdrawn: { stability: 0.70, similarity_boost: 0.80, style: 0.15 },
  sad: { stability: 0.50, similarity_boost: 0.75, style: 0.45 },
  scared: { stability: 0.40, similarity_boost: 0.73, style: 0.50 },
  cooperative: { stability: 0.65, similarity_boost: 0.78, style: 0.30 },
  confused: { stability: 0.55, similarity_boost: 0.75, style: 0.35 },
  curious: { stability: 0.65, similarity_boost: 0.78, style: 0.40 },
  helpful: { stability: 0.65, similarity_boost: 0.78, style: 0.30 },
  thoughtful: { stability: 0.70, similarity_boost: 0.78, style: 0.25 },
  surprised: { stability: 0.40, similarity_boost: 0.73, style: 0.55 },
  annoyed: { stability: 0.55, similarity_boost: 0.75, style: 0.45 },
  grieving: { stability: 0.55, similarity_boost: 0.77, style: 0.40 },
  edgy: { stability: 0.45, similarity_boost: 0.74, style: 0.50 },
  desperate: { stability: 0.30, similarity_boost: 0.72, style: 0.65 },
  engaged: { stability: 0.65, similarity_boost: 0.78, style: 0.35 },
  unsure: { stability: 0.55, similarity_boost: 0.76, style: 0.30 },
  tangential: { stability: 0.65, similarity_boost: 0.78, style: 0.30 },
  overwhelmed: { stability: 0.40, similarity_boost: 0.74, style: 0.55 },
  cracking: { stability: 0.45, similarity_boost: 0.74, style: 0.55 }
};

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
        text: voiceText, // Keep tags intact
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: settings.stability,
          similarity_boost: settings.similarity_boost,
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

1. **Cache by hash.** Hash `voice_text + voiceId + settings` combo. Identical request → return cached audio.
2. **Store audio in Supabase Storage.** One file per unique response. Reference URL in message record.
3. **Pre-generate briefing audio.** Narrator script per case is static — generate once at case creation.
4. **Don't pre-generate NPC dialogue.** It's dynamic and unique per conversation.

### Cost Estimates per Playthrough (Open Investigation)

Open investigation has more dialogue than closed whodunit:

- Briefing: ~50 words narrator → pre-generated, free per user
- NPC interrogations: 8 NPCs × ~30 messages each × ~25 words = ~6,000 words per playthrough
- Total: ~6,000 words ≈ 30,000 characters
- ElevenLabs Turbo v2.5 at $0.30/1k chars = **~$9 per playthrough if all voiced**

This is **expensive at scale**:
- 100 players/day × 30 days = 3,000 playthroughs/month
- $9 × 3,000 = $27,000/month just for voice if all NPC dialogue is voiced

**Recommendation for MVP and early beta:**

**Tier 1 (MVP — May 2026):**
- Voice ONLY for narrator (briefing + verdict cinematics) — pre-generated, ~free per user
- NPC dialogue is TEXT-ONLY
- ElevenLabs cost per playthrough: <$0.10

**Tier 2 (post-Speedrun, paid feature):**
- NPC voice as Premium feature ($14.99/mo tier vs $9.99 base)
- Premium users get all NPC voiced
- Caching per dialogue session reduces redundant generation

**Tier 3 (later, mainstream):**
- Streaming TTS for real-time feel
- All users voice-enabled

**For Speedrun demo video specifically:**
- Generate Tom's voice for 2-3 key reveal moments manually via ElevenLabs playground
- Generate Sarah's breakdown moment voiced
- Show in video as "this is what NPCs sound like" — implies capability without building production pipeline yet
- Costs ~$2 in playground

---

## Streaming vs Non-Streaming

ElevenLabs supports streaming TTS, reducing time-to-first-audio from ~1s to ~300ms.

**For MVP:** Use non-streaming. Generate full audio, return blob URL, play in browser when ready.

**For v1.1:** Implement streaming for NPCs to feel more "alive" — audio begins playing as the first sentence completes.

---

## Voice Cloning Notes (Future)

If Martin's Guatemalan-accented English isn't achievable from base voices, options:

1. **Instant Voice Cloning** ($5/mo Creator tier) — upload 30-second reference clip of voice actor with right accent.
2. **Professional Voice Cloning** ($99/mo Pro tier) — higher quality, requires consent documentation.

For MVP: use a "young and warm" standard voice even if not perfectly accented. Authenticity comes in v1.1.

---

## Sample Lines for Voice Auditioning

Use these to test candidate voices against character expectations:

**Tom (warm mood):**
> "Detective. Tom Brennan. I'm a family friend of the Coles. I just came to see if David needed anything. What can I do to help?"

**Tom (broken mood, voice breaking):**
> "[voice breaking] She broke everything. Linda. The contracts. I just... I don't even remember picking it up. It was just there. In my hand."

**Sarah (calm):**
> "Three years as partners. We were like sisters. I don't understand who would do this."

**Sarah (broken):**
> "[cries] Yes! Yes, I went there. We argued. She gave me 24 hours. I LEFT HER ALIVE."

**David (grieving):**
> "We were married 25 years. I... I don't know what to tell you, detective. She was my wife."

**Daniel (hostile):**
> "Nah, that old lady's blind. Could've been anyone. Stop accusing me, man."

**Daniel (broken):**
> "[cries] Okay, FINE. Yeah, I went there. I was hammered. She wouldn't open the door. I never even SAW her. I swear on my mother."

**Martin (nervous, polite):**
> "Sí, Detective. I found her at six forty-seven. I called nine-one-one immediately. I didn't touch anything, I promise."

**Tyler (numb):**
> "Yeah. I was at Jake's. I dunno. Whatever."

**Kevin (chatty):**
> "Yeah, Sarah was here, regular as ever. Came in at ten, left at three minutes past eleven. I cleared her table for the bachelor party. She didn't argue, just paid and left."

**Mrs. Carrington (warm, tangential):**
> "Oh, dear, do come in. Would you like some tea? Now let me think — yes, I do believe I saw something Sunday night. There was a young man walking down the street..."

Generate each in 2-3 candidate voices, pick the best fit.

---

## Testing Checklist

Before locking voice configuration:

- [ ] All 9 voices auditioned (8 NPCs + narrator) in their character mood
- [ ] Verify emotion tags produce audible differences (test [nervous], [quiet], [voice breaking], [cries])
- [ ] Test mood-to-settings: same line generated with mood=calm and mood=panicked, audible difference clear
- [ ] Test Spanish words in Martin's lines ("Dios mío") — voice handles naturally
- [ ] Test Tom's "warm" mood specifically — does he sound trustworthy? (Critical for game design)
- [ ] Test Tom's "broken" mood — does the cracking come through?
- [ ] Test Mrs. Carrington's voice with longer tangential lines
- [ ] Verify audio caching reduces duplicate API calls
- [ ] Measure per-playthrough cost with NPC voice enabled vs disabled
- [ ] Set up `voice_id` environment variables for production
- [ ] Pre-generate narrator audio for case briefing (one-time, store in Supabase)

---

## Special Notes for Tom Brennan

Tom is the highest-stakes voice casting in the game. Player's first impression of Tom must be:
- Trustworthy
- Warm
- Concerned
- Genuinely sympathetic

If Tom sounds even slightly off in his "warm" mood, players will suspect him too early and the game's reveal is broken. Spend extra time on his voice. Generate 5+ candidates and have plaintetsters listen blind, asking "do you trust this person?"

When Tom's voice transitions through the moods (warm → guarded → cracking → broken), the same voice must carry all of them convincingly. This is why a professionally-trained mid-50s salesman-type voice works better than a more characterful voice — neutral charm becomes neutral cracking more believably.

---

## Final Note on Cost Management

For the 21-day MVP push, here's the leanest voice approach that still delivers impact:

**Day-by-day voice strategy:**

- Days 1-13: NO ElevenLabs integration. Text-only NPC dialogue. Focus on getting game mechanics working.
- Day 14-15: Pre-generate narrator briefing audio (one-time, free per user thereafter).
- Day 16-18: For demo video only — use ElevenLabs playground manually to generate 4-5 voiced moments (Tom warm intro, Tom broken confession, Sarah breakdown, narrator cliffhanger). Stitch into demo video. Cost: ~$3 total.
- Day 19-21: Final polish, no production voice infrastructure.

**Post-MVP (v1.1):**
- Add NPC voice as Premium tier
- Implement caching layer
- Implement streaming TTS

This keeps voice costs at <$10 total for the MVP push while still creating impressive demo material.
