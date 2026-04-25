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

export function cleanForDisplay(voiceText: string): string {
  return voiceText.replace(/\[[^\]]+\]/g, "").trim();
}

export async function generateVoice(params: {
  voiceText: string;
  voiceId: string;
  mood: Mood | string;
}): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY");

  const settings = voiceSettingsFor(params.mood);

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
        text: params.voiceText,
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
