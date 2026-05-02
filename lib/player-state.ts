"use client";

const KEY = "td.player.state.v1";

export type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  voiceText?: string;
  mood?: string;
  evidenceId?: string;
  t?: string;
};

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
  /** custom card positions on the board, in % of canvas (0..100) */
  boardLayout: Record<string, { x: number; y: number; rot?: number }>;
  /** persisted interrogation transcript per NPC. Survives navigation,
      cleared by resetPlayerState. The dialogue route sees the full prior
      history each turn, so the NPC genuinely remembers prior questions
      and the detective's tone. */
  chatHistoryByNpc: Record<string, ChatMsg[]>;
  /** forensic-lab requests the detective has filed. Key is the test id
      (scoped per-evidence, e.g. "ev_dna_door_handle:match_unknown_dna").
      `triedNpcs` lists every suspect compared so far; `matchedNpcs` is
      the subset that came back as positive matches (a single test can
      have multiple matches — e.g. two unknown DNA profiles). */
  labResultsByTest: Record<string, { triedNpcs: string[]; matchedNpcs: string[] }>;
  /** Once filed, the case is CLOSED — irreversible until Reset. */
  accusation?: AccusationRecord;
};

export type VerdictTier =
  | "truth"            // correct suspect AND solid case
  | "thin_truth"       // correct suspect but the case was thin
  | "defensible_wrong" // wrong suspect, but a plausible-looking case
  | "reckless";        // wrong suspect AND weak case → DA dismisses

export type VerdictResult = {
  tier: VerdictTier;
  stars: 1 | 2 | 3 | 5;
  narration: string;
  outcomeHeadline: string;
  outcomeRating: string;
  correctSuspect: boolean;
  motiveScore: number;
  evidenceScore: number;
};

export type AccusationRecord = {
  accusedNpcId: string;
  accusedName: string;
  caseText: string;
  submittedAt: number;
  result: VerdictResult;
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
  boardLayout: {},
  chatHistoryByNpc: {},
  labResultsByTest: {},
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

export function setNodePosition(nodeId: string, x: number, y: number, rot?: number) {
  const s = read();
  write({
    ...s,
    boardLayout: {
      ...s.boardLayout,
      [nodeId]: { x, y, ...(rot !== undefined ? { rot } : {}) },
    },
  });
}

export function resetBoardLayout() {
  const s = read();
  write({ ...s, boardLayout: {} });
}

export function hasCompletedOnboarding(): boolean {
  return read().flags.includes("onboarding-complete");
}

export function markOnboardingComplete() {
  setFlag("onboarding-complete");
}

export function getAccusation(): AccusationRecord | undefined {
  return read().accusation;
}

export function hasAccused(): boolean {
  return !!read().accusation;
}

export function submitAccusation(record: AccusationRecord) {
  const s = read();
  // Irreversible — only Reset clears this.
  if (s.accusation) return;
  write({ ...s, accusation: record });
}

export function getLabResult(testId: string): { triedNpcs: string[]; matchedNpcs: string[] } {
  // Migrate legacy single-match shape (matchedNpc) on the fly.
  const raw = read().labResultsByTest[testId] as
    | { triedNpcs: string[]; matchedNpcs?: string[]; matchedNpc?: string }
    | undefined;
  if (!raw) return { triedNpcs: [], matchedNpcs: [] };
  if (Array.isArray(raw.matchedNpcs)) {
    return { triedNpcs: raw.triedNpcs, matchedNpcs: raw.matchedNpcs };
  }
  return {
    triedNpcs: raw.triedNpcs,
    matchedNpcs: raw.matchedNpc ? [raw.matchedNpc] : [],
  };
}

export function recordLabAttempt(testId: string, npcId: string, matched: boolean) {
  const s = read();
  const prev = getLabResult(testId);
  const triedNpcs = prev.triedNpcs.includes(npcId)
    ? prev.triedNpcs
    : [...prev.triedNpcs, npcId];
  const matchedNpcs = matched && !prev.matchedNpcs.includes(npcId)
    ? [...prev.matchedNpcs, npcId]
    : prev.matchedNpcs;
  write({
    ...s,
    labResultsByTest: { ...s.labResultsByTest, [testId]: { triedNpcs, matchedNpcs } },
  });
}

export function getChatHistory(npcId: string): ChatMsg[] {
  return read().chatHistoryByNpc[npcId] ?? [];
}

export function saveChatHistory(npcId: string, history: ChatMsg[]) {
  const s = read();
  write({
    ...s,
    chatHistoryByNpc: { ...s.chatHistoryByNpc, [npcId]: history },
  });
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
