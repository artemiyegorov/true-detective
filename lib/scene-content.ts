// Hand-curated scene content per location.
//
// The case ground_truth defines hotspots and what they reveal. This file
// adds the *atmospheric* layer the gameplay UX needs:
//
//   • scene  — prose paragraph the detective notices on entry
//   • ambient — facts auto-discovered on entry (no click needed)
//   • labels — per-hotspot label overrides so generic objects don't
//              leak the underlying mechanic (e.g. "Boot print by back
//              door" → "Floor near the back door")

export type SceneContent = {
  scene: string;
  ambient: string[];
  labels?: Record<string, string>;
};

export const SCENE: Record<string, SceneContent> = {
  loc_backroom: {
    scene:
      "Backroom of the bakery. The smell of flour and something else — metallic, wrong. Morning light through a single high window. The space is cramped, cluttered with steel shelving and prep tables. Forensic markers everywhere.",
    ambient: [
      "A body outline marked with tape on the floor.",
      "The back door is ajar.",
    ],
    labels: {
      hs_footprint: "Floor near the back door",
      hs_partial_print: "A second smudge on the floor",
      hs_desk: "Margaret's desk",
      hs_paperweight_outline: "Outline in the desk dust",
      hs_back_door: "Back door",
      hs_door_handle_dna: "Door handle",
      hs_body_outline: "Tape outline on the floor",
      hs_phone: "Landline phone",
    },
  },

  loc_bakery_main: {
    scene:
      "Front of the bakery, before opening. Pendant lights cast warm pools on empty cafe tables. Display cases half-full of yesterday's stock. Olive Street outside is starting to wake up.",
    ambient: [
      "The cash drawer hangs open. The bills are still there.",
      "A chalkboard in Margaret's neat hand lists Sunday's specials.",
    ],
    labels: {
      hs_register: "Cash register",
      hs_chalkboard: "Chalkboard",
      hs_door_to_back: "Door to the backroom",
    },
  },

  loc_cole_house: {
    scene:
      "The Coles' house. A craftsman bungalow on a quiet street, lived-in but tired. The front door is unlocked. David is somewhere inside.",
    ambient: [
      "A pair of women's coats by the door — Margaret's, untouched.",
    ],
    labels: {
      hs_home_phone: "Phone in the hallway",
      hs_living_room: "Living room",
      hs_tyler_room: "Tyler's bedroom",
    },
  },

  loc_olive_bar: {
    scene:
      "'Olive', a small wood-panelled bar a five-minute walk from the bakery. Dim sconces, a long polished counter. Sunday-night quiet still hangs in the air on Monday morning.",
    ambient: [
      "A signed photo of Margaret hangs behind the bar — the bakery and the bar opened the same year.",
    ],
    labels: {
      hs_kevin: "Kevin behind the bar",
      hs_receipts: "Receipts spike on the back counter",
    },
  },

  loc_brennan_office: {
    scene:
      "Brennan Real Estate. Glass-front storefront on Main Street. Inside: a couple of empty desks, a wall of framed deeds. The lights are off — Tom's not in.",
    ambient: [
      "A row of family photos on the desk closest to the door — all of them at least a year old.",
    ],
    labels: {
      hs_creek_behind: "Mill Creek behind the building",
      hs_office_desk: "Tom's office desk",
    },
  },
};

export function sceneFor(locId: string): SceneContent | null {
  return SCENE[locId] ?? null;
}
