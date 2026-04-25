import { fal } from "@fal-ai/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

if (!process.env.FAL_KEY) {
  console.error("FAL_KEY missing — run with: node --env-file=.env.local scripts/generate-tom-portraits.mjs");
  process.exit(1);
}

fal.config({ credentials: process.env.FAL_KEY });

const STYLE = `Cinematic illustration style, grounded realism, muted cinematic color palette with desaturated blues and warm tungsten highlights, film noir meets contemporary small-town drama. Visual references: "Mare of Easttown", "Sharp Objects", "True Detective season 1". Soft directional lighting, natural imperfections, no glossy stylization. Photorealistic illustration, not pure photograph.`;

const TOM_BASE = `Portrait of Tom Brennan, a 52-year-old white American man, 5'11" with broad shoulders, grayish-brown receding hair neatly combed, clean-shaven with a faint shadow, warm hazel eyes with the beginnings of laugh lines. Wearing a tailored navy blazer over a crisp light-blue button-down shirt (top button undone, no tie), khaki dress pants. A wedding ring on his left hand. A subtle wristwatch.`;

const VARIANTS = [
  {
    key: "warm",
    prompt: `${TOM_BASE} Expression: warm, sympathetic, slightly somber — the look of a family friend offering condolences. Standing in the bakery's front area, soft morning light from the window, slightly blurred crime scene tape visible in the background. Natural skin texture, age-appropriate lines, healthy color but a hint of fatigue around the eyes. ${STYLE}`,
  },
  {
    key: "guarded",
    prompt: `${TOM_BASE} Expression: composed but tense, jaw slightly tightened, eyes fixed forward, mouth in a controlled neutral line. Body language: seated at an interrogation table, hands clasped on the surface, shoulders squared, posture upright. Cold fluorescent overhead lighting. Subtle sheen of sweat at the temple. ${STYLE}`,
  },
  {
    key: "cracking",
    prompt: `${TOM_BASE} Expression: visible vulnerability, brow furrowed, eyes slightly unfocused looking down and to the side, lips parted as if holding back words, jaw less controlled. Body language: one hand running through his hair, the other gripping the edge of the table. Cold interrogation lighting. The salesman polish is gone — beneath it is exhaustion. ${STYLE}`,
  },
  {
    key: "broken",
    prompt: `${TOM_BASE} Expression: hollow, defeated, eyes wet but not crying, mouth slack, looking at nothing. Body language: shoulders collapsed forward, arms loose at sides, head bowed slightly. The mask is completely off. Cold interrogation lighting. The look of a man whose life is over and who knows it. ${STYLE}`,
  },
];

const OUT_DIR = path.join(process.cwd(), "public", "portraits");
await mkdir(OUT_DIR, { recursive: true });

for (const v of VARIANTS) {
  console.log(`generating tom-${v.key}…`);
  const result = await fal.subscribe("fal-ai/flux-pro/v1.1", {
    input: {
      prompt: v.prompt,
      image_size: { width: 832, height: 1248 },
      num_images: 1,
      seed: 42101,
      enable_safety_checker: true,
    },
    logs: false,
  });
  const url = result.data?.images?.[0]?.url;
  if (!url) {
    console.error(`no image url for ${v.key}`, JSON.stringify(result, null, 2));
    process.exit(1);
  }
  const r = await fetch(url);
  const buf = Buffer.from(await r.arrayBuffer());
  const out = path.join(OUT_DIR, `tom-${v.key}.jpg`);
  await writeFile(out, buf);
  console.log(`  → ${out} (${(buf.length / 1024).toFixed(1)} KB)`);
}

console.log("done.");
