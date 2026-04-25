import { readFile } from "node:fs/promises";
import path from "node:path";

const HEADER = "## System Prompt";

export async function loadNpcSystemPrompt(npcId: string): Promise<string> {
  const file = path.join(process.cwd(), "docs", `${npcId}.md`);
  const md = await readFile(file, "utf8");
  const idx = md.indexOf(HEADER);
  if (idx === -1) throw new Error(`NPC '${npcId}': no '${HEADER}' section in ${file}`);
  const afterHeader = md.slice(idx + HEADER.length);
  const nlIdx = afterHeader.indexOf("\n");
  const body = afterHeader.slice(nlIdx + 1).trim();
  return body.replace(/^---\s*/m, "").trim();
}

export const NPC_VOICE_ENV: Record<string, string> = {
  sarah: "ELEVENLABS_VOICE_ID_SARAH",
};

export function voiceIdFor(npcId: string): string {
  const envKey = NPC_VOICE_ENV[npcId];
  if (!envKey) throw new Error(`No voice mapping for NPC '${npcId}'`);
  const id = process.env[envKey];
  if (!id) throw new Error(`${envKey} not set in .env.local`);
  return id;
}
