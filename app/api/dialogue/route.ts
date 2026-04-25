import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { anthropic, MODEL_DIALOGUE } from "@/lib/anthropic";
import { loadNpcSystemPrompt, npcDisplayName, isNpcId, type NpcId } from "@/lib/npc";
import { evidenceById, loadCase } from "@/lib/case";
import { cleanForDisplay } from "@/lib/elevenlabs";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  npcId: z.string(),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })),
  evidencePresented: z.array(z.string()).default([]),
  newEvidenceId: z.string().optional(),
});

const StateSchema = z.object({
  mood: z.string(),
  physical_action: z.string().default(""),
  voice_stability: z.number().optional(),
  revealed_info: z.array(z.string()).default([]),
  alibi_status: z.enum(["intact", "partially_cracked", "broken"]).default("intact"),
  triggers_unlock: z.string().nullable().optional(),
});

const NpcReply = z.object({
  voice_text: z.string(),
  state: StateSchema,
});

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object in model output");
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "bad request", detail: String(e) }, { status: 400 });
  }
  const { npcId, messages, evidencePresented, newEvidenceId } = parsed;

  if (!isNpcId(npcId)) {
    return NextResponse.json({ error: `unknown npc: ${npcId}` }, { status: 400 });
  }

  const systemPrompt = await loadNpcSystemPrompt(npcId as NpcId);

  const evidenceSummary = evidencePresented.length
    ? evidencePresented.join(", ")
    : "(none yet)";
  const systemSuffix =
    `\n\n=== EVIDENCE PHYSICALLY PRESENTED IN THIS INTERROGATION ===\n${evidenceSummary}\n`;

  const apiMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const m of messages) apiMessages.push(m);

  if (newEvidenceId) {
    const ev = await evidenceById(newEvidenceId);
    const name = ev?.name ?? newEvidenceId;
    const sig = ev?.significance ?? "";
    const prefix = `[SYSTEM: You show ${npcDisplayName(npcId as NpcId)} the ${name} (${newEvidenceId}). ${sig}]\n\n`;
    if (apiMessages.length && apiMessages[apiMessages.length - 1].role === "user") {
      apiMessages[apiMessages.length - 1] = {
        role: "user",
        content: prefix + apiMessages[apiMessages.length - 1].content,
      };
    } else {
      apiMessages.push({ role: "user", content: prefix.trim() });
    }
  }

  if (apiMessages.length === 0) {
    apiMessages.push({ role: "user", content: "(The detective enters the room.)" });
  }

  let resp;
  try {
    resp = await anthropic.messages.create({
      model: MODEL_DIALOGUE,
      max_tokens: 600,
      system: systemPrompt + systemSuffix,
      messages: apiMessages,
    });
  } catch (e) {
    return NextResponse.json({ error: "llm_error", detail: String(e) }, { status: 502 });
  }

  const text = resp.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("");

  let json;
  try {
    json = NpcReply.parse(extractJson(text));
  } catch (e) {
    return NextResponse.json(
      { error: "parse_error", raw: text, detail: String(e) },
      { status: 502 },
    );
  }

  // Keyword-driven location unlocks: scan player message + NPC reply for
  // unlock_triggers configured in the case JSON.
  const lastPlayerMsg = [...apiMessages].reverse().find(m => m.role === "user")?.content ?? "";
  const unlockedLocations = await detectLocationUnlocks(
    npcId as NpcId,
    lastPlayerMsg,
    json.voice_text,
  );

  return NextResponse.json({
    voice_text: json.voice_text,
    voice_text_clean: cleanForDisplay(json.voice_text),
    state: json.state,
    unlocked_locations: unlockedLocations,
  });
}

type UnlockTrigger =
  | { type: "npc_mentions"; npc_id: string; keywords?: string[]; unlockable_action_id?: string }
  | { type: "player_mentions"; keywords: string[] }
  | { type: string; [k: string]: unknown };

async function detectLocationUnlocks(
  npcId: NpcId,
  playerText: string,
  npcText: string,
): Promise<string[]> {
  const ground = await loadCase();
  const playerLower = playerText.toLowerCase();
  const npcLower = npcText.toLowerCase();
  const charId = `char_${npcId}`;
  const unlocked: string[] = [];

  for (const loc of ground.locations) {
    if (loc.available_from_start) continue;
    const triggers = (loc.unlock_triggers as UnlockTrigger[] | undefined) ?? [];
    for (const t of triggers) {
      if (t.type === "player_mentions" && Array.isArray(t.keywords)) {
        if (t.keywords.some(k => playerLower.includes(k.toLowerCase()))) {
          unlocked.push(loc.id as string);
          break;
        }
      } else if (
        t.type === "npc_mentions" &&
        t.npc_id === charId &&
        Array.isArray(t.keywords)
      ) {
        if (t.keywords.some(k => npcLower.includes(k.toLowerCase()))) {
          unlocked.push(loc.id as string);
          break;
        }
      }
    }
  }
  return unlocked;
}
