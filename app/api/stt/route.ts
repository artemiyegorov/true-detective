import { NextResponse } from "next/server";

// Server-side STT for browsers without Web Speech API (Firefox / iOS).
//
// Provider chain — tried in order until one returns text. Each call has a
// hard timeout so a slow / dead provider can't stall the whole request.
//
//   1) Groq — free tier (whisper-large-v3-turbo, ~5–10× real-time). Set
//      GROQ_API_KEY (https://console.groq.com).
//   2) OpenAI Whisper — paid (~$0.006/min), most reliable industry
//      standard. Set OPENAI_API_KEY.
//   3) ElevenLabs Scribe v1 — paid, same key as TTS. Set
//      ELEVENLABS_API_KEY.
//
// Configure as many as you like; the first one that succeeds wins.

export const runtime = "nodejs";
export const maxDuration = 30;

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const OPENAI_URL = "https://api.openai.com/v1/audio/transcriptions";
const ELEVEN_URL = "https://api.elevenlabs.io/v1/speech-to-text";

const PROVIDER_TIMEOUT_MS = 8_000;

type Attempt = {
  name: string;
  build: (audio: Blob) => { url: string; init: RequestInit };
};

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
    p.then(v => {
      clearTimeout(t);
      resolve(v);
    }).catch(e => {
      clearTimeout(t);
      reject(e);
    });
  });
}

async function transcribeWith(
  attempt: Attempt,
  audio: Blob,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const { url, init } = attempt.build(audio);
  try {
    const res = await withTimeout(fetch(url, init), PROVIDER_TIMEOUT_MS, attempt.name);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `${attempt.name} ${res.status}: ${text.slice(0, 200)}` };
    }
    const data = (await res.json()) as { text?: string };
    const text = (data.text ?? "").trim();
    if (!text) return { ok: false, error: `${attempt.name}: empty transcript` };
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: `${attempt.name}: ${(e as Error).message}` };
  }
}

export async function POST(req: Request) {
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const elevenKey = process.env.ELEVENLABS_API_KEY;

  const attempts: Attempt[] = [];

  if (groqKey) {
    attempts.push({
      name: "groq",
      build: a => {
        const fd = new FormData();
        fd.append("file", a, "speech.webm");
        fd.append("model", "whisper-large-v3-turbo");
        fd.append("response_format", "json");
        fd.append("language", "en");
        return {
          url: GROQ_URL,
          init: {
            method: "POST",
            headers: { Authorization: `Bearer ${groqKey}` },
            body: fd,
          },
        };
      },
    });
  }

  if (openaiKey) {
    attempts.push({
      name: "openai",
      build: a => {
        const fd = new FormData();
        fd.append("file", a, "speech.webm");
        // gpt-4o-transcribe is the new flagship; whisper-1 is the legacy
        // model. We use whisper-1 for broadest compatibility / lower
        // cost. Bump to "gpt-4o-transcribe" if you want top accuracy.
        fd.append("model", "whisper-1");
        fd.append("language", "en");
        return {
          url: OPENAI_URL,
          init: {
            method: "POST",
            headers: { Authorization: `Bearer ${openaiKey}` },
            body: fd,
          },
        };
      },
    });
  }

  if (elevenKey) {
    attempts.push({
      name: "elevenlabs",
      build: a => {
        const fd = new FormData();
        fd.append("file", a, "speech.webm");
        fd.append("model_id", "scribe_v1");
        fd.append("language_code", "eng");
        return {
          url: ELEVEN_URL,
          init: {
            method: "POST",
            headers: { "xi-api-key": elevenKey },
            body: fd,
          },
        };
      },
    });
  }

  if (!attempts.length) {
    return NextResponse.json(
      {
        error:
          "No STT backend configured. Set one of GROQ_API_KEY (free), OPENAI_API_KEY, or ELEVENLABS_API_KEY.",
      },
      { status: 500 },
    );
  }

  const incoming = await req.formData();
  const audio = incoming.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "audio blob missing" }, { status: 400 });
  }
  // Tap-and-don't-speak guard so we don't spend an API call on silence.
  if (audio.size < 800) {
    return NextResponse.json({ text: "" });
  }

  const failures: string[] = [];
  for (const attempt of attempts) {
    const result = await transcribeWith(attempt, audio);
    if (result.ok) {
      // eslint-disable-next-line no-console
      console.log(`[stt] ${attempt.name} OK (${result.text.length} chars)`);
      return NextResponse.json({ text: result.text, provider: attempt.name });
    }
    // eslint-disable-next-line no-console
    console.warn(`[stt] ${attempt.name} failed: ${result.error}`);
    failures.push(result.error);
  }

  return NextResponse.json(
    { error: `all STT providers failed: ${failures.join(" | ")}` },
    { status: 502 },
  );
}
