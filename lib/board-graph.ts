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

const ALWAYS = (_s: PlayerState) => true;

const has = <T>(arr: T[], v: T) => arr.includes(v);

// === People ===
//
// Stricter progression per gameplay design:
//   • initial board: only the crime scene (loc_backroom) is visible
//   • visiting backroom triggers the briefing → unlocks Margaret, David,
//     Martin and the bakery front
//   • talking to Martin unlocks Sarah
//   • talking to David unlocks Tyler, Eleanor and the Cole house
//   • everything else gates on later discoveries

const VISITED_BACKROOM = (s: PlayerState) => has(s.visitedLocations, "loc_backroom");
const MET = (npc: string) => (s: PlayerState) => has(s.metNpcs, npc);

const people: BoardNode[] = [
  {
    id: "p:margaret",
    kind: "person",
    label: "Margaret Cole",
    x: 50, y: 35,
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
    visible: VISITED_BACKROOM,
    role: "Husband · 58 · Co-owner of the bakery",
    hint: "Grieving. At the scene Monday morning.",
  },
  {
    id: "p:martin",
    kind: "person",
    label: "Martin Reyes",
    x: 50, y: 60,
    refId: "martin",
    href: "/chat/martin",
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
    // Tom isn't on the board on day one — he comes in once a person
    // mentions him or evidence ties him to the case (the cell log is the
    // natural anchor since it traces a number to his name).
    visible: s =>
      MET("david")(s) ||
      MET("martin")(s) ||
      has(s.discoveredEvidence, "ev_margaret_cell_log_tom") ||
      has(s.discoveredEvidence, "ev_partial_footprint_size_11"),
    role: "Family friend · 52 · Real estate broker",
    hint: "Brought coffee and condolences Monday morning.",
  },
  {
    id: "p:sarah",
    kind: "person",
    label: "Sarah Kim",
    x: 78, y: 50,
    refId: "sarah",
    href: "/chat/sarah",
    image: "/portraits/sarah-calm.jpg",
    visible: s =>
      MET("martin")(s) ||
      MET("david")(s) ||
      has(s.discoveredEvidence, "ev_margaret_note"),
    role: "Business partner · 41 · 3 years at the bakery",
    hint: "Margaret's partner. Mentioned by Martin / David / her own note.",
  },
  {
    id: "p:tyler",
    kind: "person",
    label: "Tyler Cole",
    x: 14, y: 35,
    refId: "tyler",
    href: "/chat/tyler",
    role: "Son · 16 · At a sleepover Sunday night",
    visible: s => MET("david")(s) || has(s.visitedLocations, "loc_cole_house"),
    hint: "Was at Jake Morrison's. Ironclad alibi.",
  },
  {
    id: "p:eleanor",
    kind: "person",
    label: "Mrs. Eleanor Carrington",
    x: 8, y: 62,
    refId: "eleanor",
    href: "/chat/eleanor",
    role: "Neighbor · ~80 · Watches the street from her porch",
    visible: s => MET("david")(s) || has(s.visitedLocations, "loc_cole_house"),
    hint: "Unreliable witness — real and confused memories mixed.",
  },
  {
    id: "p:daniel",
    kind: "person",
    label: "Daniel Kim",
    x: 92, y: 62,
    refId: "daniel",
    href: "/chat/daniel",
    role: "Sarah's brother · gambling debts",
    visible: s => MET("sarah")(s) || MET("eleanor")(s),
    hint: "Was nearby Sunday night per Mrs. Carrington's testimony.",
  },
  {
    id: "p:kevin",
    kind: "person",
    label: "Kevin Pratt",
    x: 92, y: 38,
    refId: "kevin",
    href: "/chat/kevin",
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
    role: "Crime scene · access via the bakery front",
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
    role: "The Coles' house · upstairs is Tyler's room",
    visible: s => MET("david")(s),
    hint: "Where David and Tyler live.",
  },
  {
    id: "l:olive_bar",
    kind: "location",
    label: "'Olive' Bar",
    x: 86, y: 80,
    refId: "loc_olive_bar",
    href: "/location/loc_olive_bar",
    role: "Bar on Olive Street · Kevin tends",
    visible: s => has(s.unlockedLocations, "loc_olive_bar"),
    hint: "Sarah was here Sunday night.",
  },
  {
    id: "l:brennan_office",
    kind: "location",
    label: "Brennan Real Estate",
    x: 92, y: 92,
    refId: "loc_brennan_office",
    href: "/location/loc_brennan_office",
    role: "Tom's office · Mill Creek runs behind",
    visible: s => has(s.unlockedLocations, "loc_brennan_office"),
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
  { id: "c:weapon_creek", evId: "ev_paperweight_in_creek", label: "Paperweight in creek", x: 96, y: 86 },
  { id: "c:dna_weapon", evId: "ev_dna_paperweight", label: "DNA on paperweight", x: 96, y: 78 },
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

  // clue → person / location it implicates or originates from
  { from: "c:margaret_note", to: "p:sarah" },
  { from: "c:footprint_44", to: "p:sarah" },
  { from: "c:bar_receipt", to: "p:sarah" },
  { from: "c:bank", to: "p:sarah" },
  { from: "c:partial_11", to: "p:tom" },
  { from: "c:cell_log_tom", to: "p:tom" },
  { from: "c:tom_affair", to: "p:tom" },
  { from: "c:linda_divorce", to: "p:tom" },
  { from: "c:tom_key", to: "p:tom" },
  { from: "c:cam_glimpse", to: "p:tom" },
  { from: "c:weapon_creek", to: "p:tom" },
  { from: "c:dna_weapon", to: "p:tom" },
  { from: "c:phone_log", to: "p:david" },
  { from: "c:dna_door", to: "p:daniel" },
  { from: "c:eleanor_daniel", to: "p:daniel" },
  { from: "c:eleanor_car", to: "p:tom" },
  { from: "c:eleanor_helen", to: "p:david" },
  { from: "c:weapon_creek", to: "l:brennan_office" },
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
