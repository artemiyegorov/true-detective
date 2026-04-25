import { readFile } from "node:fs/promises";
import path from "node:path";

export type Evidence = {
  id: string;
  name: string;
  discovery: string;
  /** "loc_id:hotspot_id" or "loc_id" */
  found_at?: string;
  significance: string;
  /** optional path to a clue image asset */
  image?: string;
};

export type GroundTruth = {
  case_id: string;
  format: "open_investigation";
  meta: { title: string; subtitle: string; tagline: string; difficulty: string;
    estimated_minutes: number; theme: string; setting_description: string; tone: string };
  briefing: { opening_scene: string; key_facts: string[]; your_task: string;
    open_investigation_note: string; narrator_voice_style: string;
    narrator_script: string; duration_seconds: number };
  victim: Record<string, unknown>;
  murder: Record<string, unknown>;
  timeline: Array<{ time: string; event: string; visible_via: string[] }>;
  characters: Array<{
    id: string;
    name: string;
    is_murderer: boolean;
    breakable_evidence?: Array<{ evidence_id: string; reaction: string;
      is_final_breakdown: boolean; new_info_revealed?: string }>;
    unlockable_actions?: Record<string, {
      trigger_conditions: string[];
      response: string;
      unlocks_evidence?: string;
      unlocks_lead?: string;
      unlocks_hotspot?: string;
      system_delay_seconds?: number;
    }>;
    [key: string]: unknown;
  }>;
  locations: Array<Record<string, unknown>>;
  evidence: Evidence[];
  facts: Array<{ id: string; text: string }>;
  endings: Record<string, { name: string; rating: string; trigger: string; outcome_text: string }>;
};

// Caching the case JSON in memory was a small perf win but it broke
// hot-reload in dev: editing the JSON didn't show until a server
// restart. Keep it simple — re-read on every request. The file is small.
export async function loadCase(): Promise<GroundTruth> {
  const file = path.join(process.cwd(), "docs", "case_001_bakery_open.json");
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw) as GroundTruth;
}

export async function evidenceById(id: string): Promise<Evidence | undefined> {
  const c = await loadCase();
  return c.evidence.find(e => e.id === id);
}

export async function npcCharId(npcId: string): Promise<string> {
  return `char_${npcId}`;
}
