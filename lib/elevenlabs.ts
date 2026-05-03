export type Mood =
  | "calm" | "guarded" | "nervous" | "defensive" | "panicked"
  | "broken" | "angry" | "indignant" | "numb" | "withdrawn"
  | "sad" | "scared" | "cooperative" | "confused" | "curious"
  | "helpful" | "thoughtful" | "surprised" | "annoyed" | "grieving"
  | "warm" | "tense" | "stonewalling" | "hysterical" | "hollow";

type VoiceSettings = {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
};

const MOOD_TO_SETTINGS: Record<Mood, Omit<VoiceSettings, "use_speaker_boost">> = {
  calm: { stability: 0.70, similarity_boost: 0.80, style: 0.20 },
  guarded: { stability: 0.60, similarity_boost: 0.78, style: 0.30 },
  nervous: { stability: 0.45, similarity_boost: 0.75, style: 0.45 },
  defensive: { stability: 0.50, similarity_boost: 0.75, style: 0.50 },
  panicked: { stability: 0.30, similarity_boost: 0.72, style: 0.60 },
  broken: { stability: 0.25, similarity_boost: 0.70, style: 0.70 },
  angry: { stability: 0.35, similarity_boost: 0.75, style: 0.65 },
  indignant: { stability: 0.55, similarity_boost: 0.78, style: 0.55 },
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
  warm: { stability: 0.70, similarity_boost: 0.80, style: 0.25 },
  tense: { stability: 0.50, similarity_boost: 0.76, style: 0.40 },
  stonewalling: { stability: 0.80, similarity_boost: 0.78, style: 0.05 },
  hysterical: { stability: 0.20, similarity_boost: 0.70, style: 0.75 },
  hollow: { stability: 0.75, similarity_boost: 0.75, style: 0.10 },
};

export function voiceSettingsFor(mood: Mood | string): VoiceSettings {
  const base = MOOD_TO_SETTINGS[mood as Mood] ?? MOOD_TO_SETTINGS.calm;
  return { ...base, use_speaker_boost: true };
}

// Strip leading stage-direction prose ("Long pause.", "Sighs, ...",
// "Shifts in chair, voice quieter.") that NPCs sometimes leak into
// voice_text despite the system rule telling them not to. We chip them
// off iteratively so a stack like "Long pause. Sighs deeply. ..." gets
// fully removed. Patterns are constrained to a known vocab so we don't
// accidentally truncate real spoken sentences.
// Adjectives commonly bolted onto pause/silence/exhale/breath/inhale.
// Generic enough that we accept any of them in front of those nouns
// (e.g. "Nervous pause.", "Tense silence.", "Heavy exhale.", "Sad
// laugh.", "Awkward beat.").
const PAUSE_ADJ =
  "(?:long|short|brief|nervous|tense|awkward|heavy|deep|quiet|silent|sad|uneasy|uncomfortable|stunned|cold|sharp|slow|small|tight)";
const PAUSE_NOUN = "(?:pause|silence|beat|breath|exhale|inhale|sigh|moment)";

const STAGE_DIRECTION_PREFIX = new RegExp(
  "^\\s*(?:" +
    [
      // Pause / silence beats — `Pause.`, `Long pause,`, `Nervous pause —`
      `${PAUSE_ADJ}\\s+${PAUSE_NOUN}`,
      PAUSE_NOUN,
      // Vocal beats — `Sighs.`, `Sighs deeply,`
      "(?:sigh|sighs)(?:\\s+(?:deeply|softly|heavily|quietly))?",
      "(?:exhale|exhales)(?:\\s+(?:slowly|sharply))?",
      "(?:inhale|inhales)(?:\\s+sharply)?",
      "whispers?",
      "murmurs?",
      "stammers?",
      "swallows?(?:\\s+hard)?",
      "clears\\s+(?:his|her|their)?\\s*throat",
      "hesitates?",
      "quietly",
      "softly",
      // Body beats — `Shifts in chair,`
      "shifts(?:\\s+in\\s+(?:chair|seat))?",
      "leans?\\s+(?:back|forward)",
      "looks?\\s+(?:up|down|away|at\\s+\\w+(?:\\s+\\w+)?(?:\\s+slowly)?)",
      "picks?\\s+at(?:\\s+\\w+)?",
      "rubs?\\s+(?:eyes|temple|forehead)",
      "fidgets?",
      // Voice / face descriptors — `Voice quieter,`
      "voice\\s+(?:quieter|tightens|cracks|softer|hardens|breaks|drops|trails\\s+off)",
      "(?:eyes|jaw|hands?)\\s+(?:tighten|harden|clench|drop|lower)",
      // Affect descriptors — `Nervous laugh.` `Sad smile.`
      `${PAUSE_ADJ}\\s+(?:laugh|chuckle|smile|nod|shake|shrug)`,
    ].join("|") +
    ")\\s*[.,—–\\-:]\\s*",
  "i",
);

function stripStageDirections(text: string): string {
  let prev: string;
  let out = text;
  do {
    prev = out;
    out = out.replace(STAGE_DIRECTION_PREFIX, "");
  } while (out !== prev);
  return out;
}

export function cleanForDisplay(voiceText: string): string {
  // Order: drop bracketed ElevenLabs tags first, then chip prose stage
  // directions, then trim.
  return stripStageDirections(
    voiceText.replace(/\[[^\]]+\]/g, ""),
  ).trim();
}

export function stripTagsForTts(voiceText: string): string {
  // For TTS we also remove prose stage directions so they aren't read
  // out as literal text by the voice model.
  return stripStageDirections(
    voiceText
      .replace(/\[[^\]]+\]/g, " ")
      .replace(/\s+/g, " "),
  ).trim();
}

export async function generateVoice(params: {
  voiceText: string;
  voiceId: string;
  mood: Mood | string;
}): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY");

  const settings = voiceSettingsFor(params.mood);
  const text = stripTagsForTts(params.voiceText);

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${params.voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: settings,
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs ${res.status}: ${detail}`);
  }

  return await res.arrayBuffer();
}
