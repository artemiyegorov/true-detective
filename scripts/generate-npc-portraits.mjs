import { fal } from "@fal-ai/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

if (!process.env.FAL_KEY) {
  console.error("FAL_KEY missing — run: node --env-file=.env.local scripts/generate-npc-portraits.mjs");
  process.exit(1);
}

fal.config({ credentials: process.env.FAL_KEY });

// === Shared visual setting ===
//
// All portraits land in the same "interrogation interview" frame as the
// Tom Brennan reference: dark concrete textured wall behind, dark polished
// wood table edge in the foreground, warm tungsten key light from
// upper-left at ~45°, head-and-shoulders to mid-chest framing.

const SHARED_SETTING = `
Setting: dark concrete textured wall directly behind the subject, deep shadows in the corners; dark polished wooden table visible across the bottom of the frame; warm tungsten key light from upper-left at 45°; slight vignette toward the edges. Same setting as the canonical "Tom Brennan" hero portrait — same room, same lighting, same camera height, same depth of field.

Composition: head-and-shoulders to mid-chest portrait, eye-level frontal angle, subject centered, comfortable headroom — clear space between the top of the hair and the top of the frame, head NOT cropped at the top. Hands resting on the table where natural.

Style: photorealistic editorial portrait, grounded realism, muted cinematic colour palette with desaturated blues and warm tungsten highlights. Visual references: "Mare of Easttown", "Sharp Objects", "True Detective" season 1. Soft directional lighting, natural skin imperfections, visible pores and stubble — NOT a polished corporate headshot. Subtle photographic film grain like Kodak Portra 400, deep focus across the entire subject.
`.trim();

// === Per-character subject + expression ===

const NPCS = [
  {
    id: "david",
    subject: `David Cole, a 58-year-old white American man, 5'11", thin build with a slight stoop. Graying brown hair receding at the temples and thinning on top. Clean-shaven but with three days of silver-grey stubble. Tired hazel eyes, deep lines around the eyes and mouth, age spots on the temples. Wearing a worn brown cardigan over a faded light-blue button-down shirt, reading glasses hanging from his collar on a black cord.`,
    expression: `Grieving and exhausted. Hollow-eyed. Gaze slightly downward toward the table. Mouth neutral but tired, jaw soft. Hands resting on the wooden table, one absently turning the glasses cord. The face of a man who has not slept in 30 hours.`,
  },
  {
    id: "martin",
    subject: `Martin Reyes, a 24-year-old Guatemalan-American man, 5'7", lean build, short black hair neatly combed, clean-shaven, dark brown eyes with thick lashes. A kind face that today reads anxious. Wearing a white cotton baker's apron over a plain dark grey t-shirt, with a small smudge of flour still on the apron, a small silver chain necklace at the collar.`,
    expression: `Nervous and respectful. Eyes slightly downcast and red-rimmed (he has been crying). Lips pressed in a small sad line. Brows drawn together in worry. Body language: holding his own left wrist with his right hand on the table — a self-comforting gesture. Slight under-eye darkness from a sleepless night.`,
  },
  {
    id: "daniel",
    subject: `Daniel Kim, a 33-year-old Korean-American man, 5'10", thin build, looks closer to 40 than 33 — dark circles under bloodshot eyes, unshaven 2-3 day stubble, messy short black hair he has not combed, cracked dry lips. Wearing a worn grey hoodie (zipper half-down) over a faded t-shirt — the same hoodie he has worn three days running.`,
    expression: `Edgy and defensive. Eyes flicking sideways toward an exit. Mouth in a tight line. Hands visible on the table, fingers slightly twitching. The harsh edge of the warm light is unflattering on his pallor — he looks worse than he is.`,
  },
  {
    id: "tyler",
    subject: `Tyler Cole, a 16-year-old white American teenage boy, 5'9", tall and skinny, messy medium-length light-brown hair falling over his forehead and partly covering his eyes, faint acne on his forehead and chin, clean-shaven with the first traces of facial hair on the upper lip. Wearing a worn grey hoodie pulled partially up around his neck over a plain t-shirt.`,
    expression: `Numb, hollowed-out. Eyes unfocused, staring at a point past the camera at nothing in particular. Mouth slightly open but not speaking, jaw slack. One hand on the table picking absently at the hoodie cuff of the other arm. Shoulders forward. The look of a kid who lost his mother yesterday and hasn't processed it.`,
  },
  {
    id: "kevin",
    subject: `Kevin Pratt, a 35-year-old white American man, 5'10", average build, completely shaved head (embracing baldness), clean-shaven, friendly hazel eyes with the beginnings of laugh lines, slight stubble on the scalp. Wearing a crisp navy-blue button-down shirt with the top button undone.`,
    expression: `Open, helpful, mildly curious — ready to be useful. Eyebrows raised slightly in attentive interest. A small helpful smile at the corners of the mouth, NOT a wide grin. Hands resting easily on the table, palms partly down. The eyes are kind and the laugh lines are soft.`,
  },
  {
    id: "eleanor",
    subject: `Mrs. Eleanor Carrington, a 79-year-old white American woman, 5'2", small-framed. Soft white-grey hair pulled back in a low bun. Soft wrinkled face with kind pale-blue eyes behind silver-rimmed reading glasses on a thin chain. Healthy age-blush on the cheeks. Wearing a soft pink floral cardigan over a cream blouse with a small pearl brooch at the collar.`,
    expression: `Warm and attentive, genuinely interested in the conversation. Slight smile at the corners of the mouth. Looking directly at the camera. Hands clasped together on the table over a delicate handkerchief. Looks like someone's beloved grandmother — but with a lifetime of paying attention to her street.`,
  },
];

const OUT_DIR = path.join(process.cwd(), "public", "portraits");
await mkdir(OUT_DIR, { recursive: true });

async function gptImage2(prompt) {
  const result = await fal.subscribe("openai/gpt-image-2", {
    input: {
      prompt,
      image_size: "portrait_4_3",
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

function buildPrompt({ subject, expression }) {
  return `Subject: ${subject}\n\nExpression: ${expression}\n\n${SHARED_SETTING}`;
}

const t0 = Date.now();
console.log(`→ generating ${NPCS.length} NPC portraits in parallel via gpt-image-2 (high quality)…`);

await Promise.all(NPCS.map(async npc => {
  const out = path.join(OUT_DIR, `${npc.id}-default.jpg`);
  const url = await gptImage2(buildPrompt(npc));
  const bytes = await downloadTo(url, out);
  console.log(`  ✓ ${out} (${(bytes / 1024).toFixed(1)} KB)`);
}));

console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
