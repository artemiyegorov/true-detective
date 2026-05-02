import { fal } from "@fal-ai/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

if (!process.env.FAL_KEY) {
  console.error("FAL_KEY missing — run: node --env-file=.env.local scripts/generate-onboarding.mjs");
  process.exit(1);
}

fal.config({ credentials: process.env.FAL_KEY });

// Global style block appended to every slide. Keeps the 6 illustrations
// visually coherent — same noir, grounded, "Mare of Easttown / True
// Detective S1" tone, no cartoon/bright palette.
const STYLE = `Vertical 9:16 portrait composition, cinematic illustration style, grounded realism, muted cinematic color palette with desaturated blues, warm tungsten highlights, deep shadows. Inspired by "Mare of Easttown", "True Detective season 1", "Sharp Objects". Soft directional lighting, photorealistic illustration but not pure photograph. Atmospheric, contemplative, serious tone. The bottom third of the frame should be quieter — darker, less detail, with room for text overlay (no critical visual content in the lower 30% of the image). NO cartoon style, NO bright colors, NO action poses.`;

const SLIDES = [
  {
    id: "onboarding_00_title",
    prompt: `Vertical 9:16 cinematic frame with a near-black background. A single dramatic key light from upper-right illuminates a small object on a wooden surface in the upper-middle of the frame: a red marker pen resting on a manila evidence card. The card has black handwritten text on it, partially obscured by shadow — drawing the eye but not fully readable. Deep shadow fills the lower two-thirds of the frame, leaving room for a title overlay. Atmosphere: noir intro card, the moment before a story begins.`,
  },
  {
    id: "onboarding_01_detective",
    prompt: `Vertical 9:16 cinematic frame, over-the-shoulder perspective from behind a detective. The corkboard wall fills the upper two-thirds of the frame: crime-scene photographs, suspect headshots pinned with red string connecting them, handwritten index cards, a printed map. One photograph in the center of the board is circled in red marker. Below the board, the back of the detective's head and shoulders are visible at the bottom of the frame (face NOT shown — this is the player's POV) wearing a dark wool coat. Warm tungsten light from a desk lamp on the right side, deep blue shadow elsewhere. Atmosphere: contemplative, quiet weight of responsibility.`,
  },
  {
    id: "onboarding_02_everyone_lies",
    prompt: `Vertical 9:16 cinematic frame of an interrogation-room scene. The viewer's perspective is the detective's — the back of the detective's head and one shoulder occupy the bottom-left foreground (out of focus). The frame is dominated, in the upper two-thirds, by a SUSPECT seated across a metal table — a 40-something woman in a tailored dark blouse, hands clasped on the table, expression composed but tense, eyes cast slightly down and to the side, NOT meeting the detective's gaze. A subtle micro-expression of tension at the corner of her mouth. Cold gray-green walls. A glass of water on the table. Cold overhead fluorescent light casting hard shadows under her brow. Atmosphere: a held breath, the moment before someone gets caught in a lie.`,
  },
  {
    id: "onboarding_03_build_case",
    prompt: `Vertical 9:16 cinematic top-down view of a wooden detective's desk covered in evidence and case materials, framed so the desk fills the frame. Visible: black-and-white printed photographs of suspects (faces partially shown, partially shadowed), handwritten note cards with names and questions, red string connecting some photos to others, polaroids, a small evidence bag containing a key, a phone log printout with one entry circled in red, a coffee-stained legal pad with handwritten note "Tom — alley 23:38?", a desk lamp casting warm light from the upper-right corner. A masculine hand (mid-40s, slightly worn) enters the frame from the right edge holding a red marker mid-gesture about to underline something on a card. Atmosphere: focused work, the puzzle coming together.`,
  },
  {
    id: "onboarding_04_consequence",
    prompt: `Vertical 9:16 cinematic frame of an empty courtroom. The viewer stands at the back of the room looking forward — wooden benches stretch toward the upper part of the frame, all empty. A wooden defendant's table with a single empty chair pushed back as if someone just stood up; on the table, a closed manila case folder. A judge's bench in the upper portion of the frame holds a single gavel. The American flag hangs heavy and still in one corner. Late afternoon light filters through tall windows on the right, cutting through dust motes; outside, the silhouette of a tree and a darkening sky. The light is golden but the mood is cold. No people visible. Atmosphere: the silence after consequence, finality.`,
  },
  {
    id: "onboarding_05_ready",
    prompt: `Vertical 9:16 cinematic frame of a wooden detective's desk seen from a slight angle. The upper part of the frame holds the focal element: a manila case-file folder, closed, with "CASE #247 — COLE, MARGARET" typed on a corner label. A black-and-white photograph of a small-town bakery storefront partially sticks out of the folder. Beside the folder: a steaming coffee cup, a worn leather-bound notebook, a pen resting on top, a brass key on a small evidence card. A desk lamp in the upper-right corner casts warm tungsten light on the folder. Through a blurred window in the background, early morning light. Atmosphere: the calm before, anticipation, a story about to begin.`,
  },
];

const OUT_DIR = path.join(process.cwd(), "public", "onboarding");
await mkdir(OUT_DIR, { recursive: true });

async function gptImage2(prompt) {
  const result = await fal.subscribe("openai/gpt-image-2", {
    input: {
      prompt,
      // 9:16 portrait. fal's gpt-image-2 enum for that orientation is
      // `portrait_16_9` (the 16:9 here means the source aspect, applied
      // in portrait orientation — i.e. taller than wide).
      image_size: "portrait_16_9",
      quality: "high",
      num_images: 1,
    },
    logs: false,
  });
  const url = result.data?.images?.[0]?.url;
  if (!url) throw new Error("gpt-image-2: no url\n" + JSON.stringify(result, null, 2));
  return url;
}

async function downloadTo(url, file) {
  const r = await fetch(url);
  const buf = Buffer.from(await r.arrayBuffer());
  await writeFile(file, buf);
  return buf.length;
}

const arg = process.argv[2];
const todo = arg ? SLIDES.filter(s => s.id === arg) : SLIDES;
console.log(`→ generating ${todo.length} onboarding slides…`);
const t0 = Date.now();

await Promise.all(todo.map(async slide => {
  try {
    const url = await gptImage2(`${slide.prompt}\n\n${STYLE}`);
    const out = path.join(OUT_DIR, `${slide.id}.png`);
    const bytes = await downloadTo(url, out);
    console.log(`  ✓ ${slide.id} (${(bytes / 1024).toFixed(1)} KB)`);
  } catch (e) {
    console.error(`  ✗ ${slide.id}: ${(e instanceof Error ? e.message : String(e)).slice(0, 200)}`);
  }
}));

console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
