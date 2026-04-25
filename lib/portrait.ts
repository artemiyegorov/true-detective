import type { NpcId } from "./npc";
import type { Mood } from "./elevenlabs";

export type PortraitVariant = "warm" | "guarded" | "cracking" | "broken"
  | "calm" | "nervous" | "panicked" | "default";

const TOM_VARIANTS: Record<string, PortraitVariant> = {
  warm: "warm", calm: "warm", helpful: "warm", cooperative: "warm", curious: "warm",
  guarded: "guarded", tense: "guarded", defensive: "guarded", nervous: "guarded",
  cracking: "cracking", panicked: "cracking", indignant: "cracking", angry: "cracking",
  broken: "broken", hollow: "broken", stonewalling: "broken", hysterical: "broken",
};

const SARAH_VARIANTS: Record<string, PortraitVariant> = {
  calm: "calm", warm: "calm", cooperative: "calm", helpful: "calm",
  guarded: "guarded", thoughtful: "guarded", grieving: "guarded",
  nervous: "nervous", defensive: "nervous", tense: "nervous",
  panicked: "panicked", scared: "panicked", angry: "panicked",
  broken: "broken", hysterical: "broken", hollow: "broken", sad: "broken",
};

export function portraitVariantFor(npcId: NpcId, mood: Mood | string): PortraitVariant {
  if (npcId === "tom") return TOM_VARIANTS[mood] ?? "warm";
  if (npcId === "sarah") return SARAH_VARIANTS[mood] ?? "calm";
  return "default";
}

export function portraitPath(npcId: NpcId, variant: PortraitVariant): string {
  return `/portraits/${npcId}-${variant}.jpg`;
}
