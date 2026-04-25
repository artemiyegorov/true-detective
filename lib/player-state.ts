"use client";

const KEY = "td.player.state.v1";

export type PlayerState = {
  /** location ids that are visible/clickable on the board */
  unlockedLocations: string[];
  /** location ids the player has actually opened (location page mounted) */
  visitedLocations: string[];
  unlockedHotspots: string[];
  discoveredEvidence: string[];
  discoveredFacts: string[];
  /** npc ids the player has actually chatted with */
  metNpcs: string[];
  /** flags set once for one-shot UI triggers (e.g. briefing seen) */
  flags: string[];
  /** evidence ids the player has pinned as important */
  importantClues: string[];
  /** facts that NPCs revealed during interviews, keyed by npc id */
  revealedByNpc: Record<string, string[]>;
};

const DEFAULT_STATE: PlayerState = {
  // Game starts at the crime scene only. Everything else unlocks by event.
  unlockedLocations: ["loc_backroom"],
  visitedLocations: [],
  unlockedHotspots: [],
  discoveredEvidence: [],
  discoveredFacts: [],
  metNpcs: [],
  flags: [],
  importantClues: [],
  revealedByNpc: {},
};

function read(): PlayerState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PlayerState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

function write(state: PlayerState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("td-state-change"));
}

function addUnique(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr : [...arr, id];
}

export function getState(): PlayerState {
  return read();
}

export function unlockLocation(locId: string) {
  const s = read();
  write({ ...s, unlockedLocations: addUnique(s.unlockedLocations, locId) });
}

export function unlockHotspot(hsId: string) {
  const s = read();
  write({ ...s, unlockedHotspots: addUnique(s.unlockedHotspots, hsId) });
}

export function discoverEvidence(evId: string) {
  const s = read();
  write({ ...s, discoveredEvidence: addUnique(s.discoveredEvidence, evId) });
}

export function discoverFact(factId: string) {
  const s = read();
  write({ ...s, discoveredFacts: addUnique(s.discoveredFacts, factId) });
}

export function meetNpc(npcId: string) {
  const s = read();
  write({ ...s, metNpcs: addUnique(s.metNpcs, npcId) });
}

export function visitLocation(locId: string) {
  const s = read();
  write({
    ...s,
    visitedLocations: addUnique(s.visitedLocations, locId),
    unlockedLocations: addUnique(s.unlockedLocations, locId),
  });
}

export function setFlag(flag: string) {
  const s = read();
  write({ ...s, flags: addUnique(s.flags, flag) });
}

export function hasFlag(flag: string): boolean {
  return read().flags.includes(flag);
}

export function pinImportant(evidenceId: string) {
  const s = read();
  write({ ...s, importantClues: addUnique(s.importantClues, evidenceId) });
}

export function unpinImportant(evidenceId: string) {
  const s = read();
  write({ ...s, importantClues: s.importantClues.filter(id => id !== evidenceId) });
}

export function recordNpcReveal(npcId: string, info: string[]) {
  if (!info.length) return;
  const s = read();
  const prev = s.revealedByNpc[npcId] ?? [];
  const merged = [...prev];
  for (const f of info) if (!merged.includes(f)) merged.push(f);
  write({ ...s, revealedByNpc: { ...s.revealedByNpc, [npcId]: merged } });
}

export function resetPlayerState() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("td-state-change"));
}
