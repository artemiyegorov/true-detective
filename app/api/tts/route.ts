import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateVoice } from "@/lib/elevenlabs";
import { isNpcId, voiceIdFor, type NpcId } from "@/lib/npc";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  npcId: z.string(),
  voiceText: z.string().min(1).max(2000),
  mood: z.string().default("calm"),
});

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "bad request", detail: String(e) }, { status: 400 });
  }
  const { npcId, voiceText, mood } = parsed;
  if (!isNpcId(npcId)) {
    return NextResponse.json({ error: `unknown npc: ${npcId}` }, { status: 400 });
  }

  let voiceId: string;
  try {
    voiceId = voiceIdFor(npcId as NpcId);
  } catch (e) {
    return NextResponse.json({ error: "voice_not_configured", detail: String(e) }, { status: 500 });
  }

  let audio: ArrayBuffer;
  try {
    audio = await generateVoice({ voiceText, voiceId, mood });
  } catch (e) {
    return NextResponse.json({ error: "tts_error", detail: String(e) }, { status: 502 });
  }

  return new NextResponse(audio, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
