import { NextResponse } from "next/server";

// Server-side STT for browsers without Web Speech API (Firefox).
// Backends, in priority order:
//   1) Groq — free tier, whisper-large-v3-turbo, ~5–10× real-time.
//      Get a free key at https://console.groq.com — set GROQ_API_KEY.
//   2) ElevenLabs Scribe — paid, uses the same key as TTS.
// Whichever key is present at runtime wins.

export const runtime = "nodejs";

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const ELEVEN_URL = "https://api.elevenlabs.io/v1/speech-to-text";

export async function POST(req: Request) {
  const groqKey = process.env.GROQ_API_KEY;
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (!groqKey && !elevenKey) {
    return NextResponse.json(
      {
        error:
          "No STT backend configured. Add GROQ_API_KEY (free at console.groq.com) or ELEVENLABS_API_KEY.",
      },
      { status: 500 },
    );
  }

  const incoming = await req.formData();
  const audio = incoming.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "audio blob missing" }, { status: 400 });
  }
  // Tap-and-don't-speak guard so we don't spend a whole API call on
  // ~50ms of silence.
  if (audio.size < 800) {
    return NextResponse.json({ text: "" });
  }

  // Both providers happen to follow OpenAI's transcription multipart shape.
  const fd = new FormData();
  if (groqKey) {
    fd.append("file", audio, "speech.webm");
    fd.append("model", "whisper-large-v3-turbo");
    fd.append("response_format", "json");
    fd.append("language", "en");
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}` },
      body: fd,
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `groq ${res.status}: ${text.slice(0, 240)}` },
        { status: res.status },
      );
    }
    const data = (await res.json()) as { text?: string };
    return NextResponse.json({ text: (data.text ?? "").trim() });
  }

  // ElevenLabs Scribe fallback.
  fd.append("file", audio, "speech.webm");
  fd.append("model_id", "scribe_v1");
  fd.append("language_code", "eng");
  const res = await fetch(ELEVEN_URL, {
    method: "POST",
    headers: { "xi-api-key": elevenKey! },
    body: fd,
  });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `elevenlabs ${res.status}: ${text.slice(0, 240)}` },
      { status: res.status },
    );
  }
  const data = (await res.json()) as { text?: string };
  return NextResponse.json({ text: (data.text ?? "").trim() });
}
