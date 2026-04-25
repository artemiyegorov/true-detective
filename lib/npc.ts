import { readFile } from "node:fs/promises";
import path from "node:path";

const HEADER = "## System Prompt";

export type NpcId =
  | "tom" | "sarah" | "david" | "daniel"
  | "martin" | "tyler" | "kevin" | "eleanor";

export const NPCS: NpcId[] = [
  "tom", "sarah", "david", "daniel", "martin", "tyler", "kevin", "eleanor",
];

export async function loadNpcSystemPrompt(npcId: NpcId): Promise<string> {
  const file = path.join(process.cwd(), "docs", `${npcId}-prompt.md`);
  const md = await readFile(file, "utf8");
  const idx = md.indexOf(HEADER);
  if (idx === -1) throw new Error(`NPC '${npcId}': no '${HEADER}' section in ${file}`);
  const afterHeader = md.slice(idx + HEADER.length);
  const nlIdx = afterHeader.indexOf("\n");
  const body = afterHeader.slice(nlIdx + 1).trim();
  return body.replace(/^---\s*/m, "").trim();
}

const NPC_VOICE_ENV: Record<NpcId, string> = {
  tom: "ELEVENLABS_VOICE_ID_TOM",
  sarah: "ELEVENLABS_VOICE_ID_SARAH",
  david: "ELEVENLABS_VOICE_ID_DAVID",
  daniel: "ELEVENLABS_VOICE_ID_DANIEL",
  martin: "ELEVENLABS_VOICE_ID_MARTIN",
  tyler: "ELEVENLABS_VOICE_ID_TYLER",
  kevin: "ELEVENLABS_VOICE_ID_KEVIN",
  eleanor: "ELEVENLABS_VOICE_ID_ELEANOR",
};

export function voiceIdFor(npcId: NpcId): string {
  const id = process.env[NPC_VOICE_ENV[npcId]];
  if (!id) throw new Error(`${NPC_VOICE_ENV[npcId]} not set in .env.local`);
  return id;
}

export function npcDisplayName(npcId: NpcId): string {
  const map: Record<NpcId, string> = {
    tom: "Tom Brennan",
    sarah: "Sarah Kim",
    david: "David Cole",
    daniel: "Daniel Kim",
    martin: "Martin Reyes",
    tyler: "Tyler Cole",
    kevin: "Kevin Pratt",
    eleanor: "Mrs. Eleanor Carrington",
  };
  return map[npcId];
}

export function isNpcId(s: string): s is NpcId {
  return (NPCS as string[]).includes(s);
}
