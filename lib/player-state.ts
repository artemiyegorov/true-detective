"use client";

const KEY = "td.player.state.v1";

export type PlayerState = {
  unlockedLocations: string[];
  unlockedHotspots: string[];
  discoveredEvidence: string[];
  discoveredFacts: string[];
  metNpcs: string[];
};

const DEFAULT_STATE: PlayerState = {
  unlockedLocations: ["loc_bakery_main", "loc_backroom", "loc_cole_house"],
  unlockedHotspots: [],
  discoveredEvidence: [],
  discoveredFacts: [],
  metNpcs: [],
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

export function resetPlayerState() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("td-state-change"));
}
