import type { PlayerState } from "./player-state";

export type NodeKind = "location" | "person" | "clue";

export type BoardNode = {
  id: string;
  kind: NodeKind;
  label: string;
  /** percent of board area, 0..100 */
  x: number;
  y: number;
  /** locked nodes are completely hidden until visible(state) returns true */
  visible: (s: PlayerState) => boolean;
  /** for clue nodes — case evidence id; for person nodes — chat npc id; for locations — case loc id */
  refId?: string;
  /** click target — `/chat/<npc>` or `/location/<loc>`. Clue nodes open
      the in-board dossier instead of routing. */
  href?: string;
  /** image path for the card (people: portrait jpg; locations: optional bg) */
  image?: string;
  /** static role / one-line dossier line (people only) */
  role?: string;
  /** short hover text */
  hint?: string;
};

export type BoardEdge = {
  from: string;
  to: string;
  label?: string;
  /** edge appears once both endpoints are visible (default true) */
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ALWAYS = (_s: PlayerState) => true;
void ALWAYS; // referenced by some node defs below; kept around even when unused

const has = <T>(arr: T[], v: T) => arr.includes(v);

// === People ===
//
// Stricter progression per gameplay design: things appear ONLY when an
// NPC actually names them in dialogue. Each unlockable_action in a prompt
// emits a marker into state.revealed_info (e.g. "names_sarah",
// "names_tom", "mentions_cole_house"). We watch revealedByNpc for those
// markers — opening the chat page alone does NOT unlock anything.

const VISITED_BACKROOM = (s: PlayerState) => has(s.visitedLocations, "loc_backroom");
// MET / mentionedBy are kept as escape hatches for future visibility
// rules that need to gate on a specific NPC. Currently the global
// `mentioned()` covers every active rule.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MET = (npc: string) => (s: PlayerState) => has(s.metNpcs, npc);
// True if any NPC has emitted the given reveal marker. Use this for
// "in-conversation" gates: e.g. mentioned("names_sarah") flips when
// Martin or David actually says Sarah's name.
const mentioned = (marker: string) => (s: PlayerState) => {
  for (const list of Object.values(s.revealedByNpc)) {
    if (list && list.includes(marker)) return true;
  }
  return false;
};
// Same, but scoped to a specific NPC.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mentionedBy = (npc: string, marker: string) => (s: PlayerState) =>
  (s.revealedByNpc[npc] ?? []).includes(marker);

const people: BoardNode[] = [
  {
    id: "p:margaret",
    kind: "person",
    label: "Margaret Cole",
    x: 50, y: 35,
    image: "/portraits/margaret-default.jpg",
    visible: VISITED_BACKROOM,
    role: "Victim · 54 · Bakery owner",
    hint: "Found dead in the backroom Monday morning.",
  },
  {
    id: "p:david",
    kind: "person",
    label: "David Cole",
    x: 28, y: 22,
    refId: "david",
    href: "/chat/david",
    image: "/portraits/david-default.jpg",
    // David appears only after Martin or Sarah actually names him as the
    // husband — opening their chat page is not enough; the marker fires
    // from the NPC's `name_*` unlockable_action in dialogue.
    visible: mentioned("names_david"),
    role: "Husband · 58 · Co-owner of the bakery",
    hint: "Grieving. Mentioned by Martin or Sarah.",
  },
  {
    id: "p:martin",
    kind: "person",
    label: "Martin Reyes",
    x: 50, y: 60,
    refId: "martin",
    href: "/chat/martin",
    image: "/portraits/martin-default.jpg",
    visible: VISITED_BACKROOM,
    role: "Baker · 24 · Worked under Margaret",
    hint: "Found the body. Called 911 at 06:47.",
  },
  {
    id: "p:tom",
    kind: "person",
    label: "Tom Brennan",
    x: 72, y: 22,
    refId: "tom",
    href: "/chat/tom",
    image: "/portraits/tom-warm.jpg",
    // Tom only goes on the board once Sarah or David actually says "Tom
    // Brennan" in dialogue (their `names_tom` reveal marker fires).
    visible: mentioned("names_tom"),
    role: "Family friend · 52 · Real estate broker",
    hint: "Mentioned by Sarah or David.",
  },
  {
    id: "p:sarah",
    kind: "person",
    label: "Sarah Kim",
    x: 78, y: 50,
    refId: "sarah",
    href: "/chat/sarah",
    image: "/portraits/sarah-calm.jpg",
    // Sarah only shows up after Martin or David actually names her in
    // dialogue (their `names_sarah` marker fires).
    visible: mentioned("names_sarah"),
    role: "Business partner · 41 · 3 years at the bakery",
    hint: "Margaret's partner. Mentioned by Martin or David.",
  },
  {
    id: "p:tyler",
    kind: "person",
    label: "Tyler Cole",
    x: 14, y: 35,
    refId: "tyler",
    href: "/chat/tyler",
    image: "/portraits/tyler-default.jpg",
    role: "Son · 16 · At a sleepover Sunday night",
    visible: mentioned("names_tyler"),
    hint: "Was at Jake Morrison's. Mentioned by David.",
  },
  {
    id: "p:eleanor",
    kind: "person",
    label: "Mrs. Eleanor Carrington",
    x: 8, y: 62,
    refId: "eleanor",
    href: "/chat/eleanor",
    image: "/portraits/eleanor-default.jpg",
    role: "Neighbor · ~80 · Watches the street from her porch",
    visible: s => mentioned("names_eleanor")(s) || has(s.visitedLocations, "loc_cole_house"),
    hint: "Unreliable witness — real and confused memories mixed.",
  },
  {
    id: "p:daniel",
    kind: "person",
    label: "Daniel Kim",
    x: 92, y: 62,
    refId: "daniel",
    href: "/chat/daniel",
    image: "/portraits/daniel-default.jpg",
    role: "Sarah's brother · gambling debts",
    visible: mentioned("names_daniel"),
    hint: "Was nearby Sunday night. Mentioned by Sarah or Eleanor.",
  },
  {
    id: "p:kevin",
    kind: "person",
    label: "Kevin Pratt",
    x: 92, y: 38,
    refId: "kevin",
    href: "/chat/kevin",
    image: "/portraits/kevin-default.jpg",
    role: "Bartender at 'Olive' · friendly",
    visible: s => has(s.unlockedLocations, "loc_olive_bar"),
    hint: "Bartender at 'Olive'. Confirms Sarah's bar timing.",
  },
];

// === Locations ===

const locations: BoardNode[] = [
  {
    id: "l:backroom",
    kind: "location",
    label: "Bakery Backroom",
    x: 50, y: 78,
    refId: "loc_backroom",
    href: "/location/loc_backroom",
    image: "/backroom.png",
    role: "Crime scene",
    visible: ALWAYS,
    hint: "Crime scene. Margaret was found here.",
  },
  {
    id: "l:bakery_main",
    kind: "location",
    label: "Cole & Sons Bakery",
    x: 64, y: 86,
    refId: "loc_bakery_main",
    href: "/location/loc_bakery_main",
    image: "/bakery.png",
    role: "Front of the shop · public area",
    visible: VISITED_BACKROOM,
    hint: "Front of the shop. Crime scene tape on the back door.",
  },
  {
    id: "l:cole_house",
    kind: "location",
    label: "Cole Family Home",
    x: 16, y: 80,
    refId: "loc_cole_house",
    href: "/location/loc_cole_house",
    image: "/cole-house.png",
    role: "The Coles' house · upstairs is Tyler's room",
    visible: mentioned("mentions_cole_house"),
    hint: "Where David and Tyler live. Mentioned by David or Eleanor.",
  },
  {
    id: "l:olive_bar",
    kind: "location",
    label: "'Olive' Bar",
    x: 86, y: 80,
    refId: "loc_olive_bar",
    href: "/location/loc_olive_bar",
    image: "/olive-bar.png",
    role: "Bar on Olive Street · Kevin tends",
    visible: s => mentioned("mentions_olive_bar")(s) || has(s.unlockedLocations, "loc_olive_bar"),
    hint: "Sarah was here Sunday night.",
  },
  {
    id: "l:brennan_office",
    kind: "location",
    label: "Brennan Real Estate",
    x: 92, y: 92,
    refId: "loc_brennan_office",
    href: "/location/loc_brennan_office",
    image: "/toms-office.png",
    role: "Tom's office · Mill Creek runs behind",
    // Appears as soon as anyone (typically Tom himself) names his office
    // / Brennan Real Estate in dialogue. The legacy `unlockedLocations`
    // path is kept as a fallback for any dialogue-route keyword unlocks
    // configured in the case JSON.
    visible: s => mentioned("mentions_brennan_office")(s) || has(s.unlockedLocations, "loc_brennan_office"),
    hint: "Tom's office. Mill Creek runs behind it.",
  },
];

// === Clues ===
//
// Visibility = simply "discovered". Position floats near the related person
// or location. We use a small offset so multiple clues around one anchor
// don't overlap.

type ClueDef = {
  id: string;
  evId: string;
  label: string;
  x: number;
  y: number;
};

const clueDefs: ClueDef[] = [
  { id: "c:footprint_44", evId: "ev_footprint_44", label: "Size 12 print", x: 78, y: 60 },
  { id: "c:partial_11", evId: "ev_partial_footprint_size_11", label: "Size 11 print", x: 64, y: 32 },
  { id: "c:margaret_note", evId: "ev_margaret_note", label: "Margaret's note", x: 56, y: 42 },
  { id: "c:missing_paperweight", evId: "ev_missing_paperweight", label: "Missing paperweight", x: 50, y: 50 },
  { id: "c:cell_log_tom", evId: "ev_margaret_cell_log_tom", label: "Tom's 22:15 call", x: 70, y: 30 },
  { id: "c:dna_door", evId: "ev_dna_door_handle", label: "DNA on door handle", x: 36, y: 78 },
  { id: "c:bar_receipt", evId: "ev_bar_receipt", label: "Bar receipt 23:04", x: 84, y: 56 },
  { id: "c:bank", evId: "ev_bank_statements", label: "$47k bank statements", x: 80, y: 44 },
  { id: "c:phone_log", evId: "ev_phone_log", label: "David's call to Helen", x: 22, y: 28 },
  { id: "c:tom_affair", evId: "ev_tom_margaret_affair", label: "Tom-Margaret affair", x: 60, y: 28 },
  { id: "c:linda_divorce", evId: "ev_linda_divorce_filing", label: "Linda's divorce filing", x: 78, y: 14 },
  { id: "c:tom_key", evId: "ev_tom_old_key", label: "Tom's old bakery key", x: 88, y: 20 },
  { id: "c:cam_glimpse", evId: "ev_security_camera_glimpse", label: "Camera @ 23:38", x: 78, y: 72 },
  { id: "c:dna_match_tom", evId: "ev_dna_match_tom", label: "DNA match: Tom", x: 96, y: 78 },
  { id: "c:dna_match_daniel", evId: "ev_dna_match_daniel", label: "DNA match: Daniel", x: 30, y: 78 },
  { id: "c:weapon_recovered", evId: "ev_paperweight_recovered", label: "Weapon recovered", x: 96, y: 86 },
  { id: "c:eleanor_daniel", evId: "ev_eleanor_witness_daniel", label: "Daniel @ 21:45", x: 14, y: 70 },
  { id: "c:eleanor_car", evId: "ev_eleanor_witness_car", label: "Fancy car @ 23:30", x: 6, y: 50 },
  { id: "c:eleanor_helen", evId: "ev_eleanor_witness_helen", label: "Helen visiting David", x: 14, y: 50 },
];

const clues: BoardNode[] = clueDefs.map(c => ({
  id: c.id,
  kind: "clue",
  label: c.label,
  x: c.x,
  y: c.y,
  evidenceId: c.evId,
  visible: s => has(s.discoveredEvidence, c.evId),
  hint: undefined,
}));

export const BOARD_NODES: BoardNode[] = [...people, ...locations, ...clues];

// === Edges ===

export const BOARD_EDGES: BoardEdge[] = [
  // location ↔ location
  { from: "l:bakery_main", to: "l:backroom", label: "behind" },

  // person ↔ family / partnership
  { from: "p:margaret", to: "p:david", label: "married" },
  { from: "p:margaret", to: "p:sarah", label: "business partners" },
  { from: "p:margaret", to: "p:tom", label: "old friends" },
  { from: "p:margaret", to: "p:martin", label: "employer" },
  { from: "p:david", to: "p:tyler", label: "father" },
  { from: "p:sarah", to: "p:daniel", label: "siblings" },
  { from: "p:david", to: "p:eleanor", label: "neighbors" },

  // person ↔ location (regular presence)
  { from: "p:margaret", to: "l:bakery_main" },
  { from: "p:margaret", to: "l:backroom" },
  { from: "p:martin", to: "l:bakery_main" },
  { from: "p:david", to: "l:cole_house" },
  { from: "p:tyler", to: "l:cole_house" },
  { from: "p:eleanor", to: "l:cole_house" },
  { from: "p:kevin", to: "l:olive_bar" },
  { from: "p:tom", to: "l:brennan_office" },

  // clue → person / location it implicates or originates from. Margaret's
  // note ("S — 47k") is intentionally NOT linked to Sarah here — the
  // initial 'S' is ambiguous to the detective until someone names Sarah
  // for them (Martin during interview, etc).
  { from: "c:footprint_44", to: "p:sarah" },
  { from: "c:bar_receipt", to: "p:sarah" },
  { from: "c:bank", to: "p:sarah" },
  { from: "c:partial_11", to: "p:tom" },
  { from: "c:cell_log_tom", to: "p:tom" },
  { from: "c:tom_affair", to: "p:tom" },
  { from: "c:linda_divorce", to: "p:tom" },
  { from: "c:tom_key", to: "p:tom" },
  { from: "c:cam_glimpse", to: "p:tom" },
  { from: "c:dna_match_tom", to: "p:tom" },
  { from: "c:weapon_recovered", to: "p:tom" },
  { from: "c:phone_log", to: "p:david" },
  // The raw `ev_dna_door_handle` clue is NOT linked directly to any
  // suspect — the unknown profiles are anonymous until the lab does the
  // match. Daniel/Tom only get an edge once their per-suspect lab-match
  // evidence (ev_dna_match_*) is unlocked.
  { from: "c:dna_match_daniel", to: "p:daniel" },
  { from: "c:eleanor_daniel", to: "p:daniel" },
  { from: "c:eleanor_car", to: "p:tom" },
  { from: "c:eleanor_helen", to: "p:david" },
  { from: "c:weapon_recovered", to: "l:brennan_office" },
  { from: "c:tom_key", to: "l:brennan_office" },
];

export function visibleNodes(state: PlayerState): BoardNode[] {
  return BOARD_NODES.filter(n => n.visible(state));
}

export function visibleEdges(state: PlayerState, visibleIds: Set<string>): BoardEdge[] {
  return BOARD_EDGES.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to));
}

export function nodeById(id: string): BoardNode | undefined {
  return BOARD_NODES.find(n => n.id === id);
}
