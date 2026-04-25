import { fal } from "@fal-ai/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

if (!process.env.FAL_KEY) {
  console.error("FAL_KEY missing — run: node --env-file=.env.local scripts/generate-board-bg.mjs");
  process.exit(1);
}

fal.config({ credentials: process.env.FAL_KEY });

// One-shot: generate a moody detective corkboard texture for the board
// background. Documentary photography aesthetic, dark and worn — not the
// generic-bright cork stock look.

const PROMPT = `Photograph of a worn weathered cork pinboard hanging on a dark wall in a detective's office at night. Dim warm tungsten light from upper-left, deep shadows, dark vignette around the edges. The cork surface is aged and discolored, with small marks, faded pin holes, slight tears at the corners, fine dust, and subtle moisture stains. Visible cork grain and granular texture. NO papers, NO photos, NO push pins, NO writing — just the empty cork surface. Top-down flat view, frame fills the whole image. Cinematic, photorealistic, "True Detective" season 1 atmosphere, muted dark amber and brown palette, deep contrast, film grain.`;

async function fluxProUltra(prompt, seed) {
  const result = await fal.subscribe("fal-ai/flux-pro/v1.1-ultra", {
    input: {
      prompt,
      aspect_ratio: "16:9",
      num_images: 1,
      seed,
      raw: true,
      enable_safety_checker: true,
      output_format: "jpeg",
    },
    logs: false,
  });
  const url = result.data?.images?.[0]?.url;
  if (!url) throw new Error("flux-pro-ultra: no url\n" + JSON.stringify(result, null, 2));
  return url;
}

const out = path.join(process.cwd(), "public", "board-bg.jpg");
await mkdir(path.dirname(out), { recursive: true });

console.log("→ generating noir corkboard background…");
const url = await fluxProUltra(PROMPT, 51001);
const r = await fetch(url);
const buf = Buffer.from(await r.arrayBuffer());
await writeFile(out, buf);
console.log(`  ✓ ${out} (${(buf.length / 1024).toFixed(1)} KB)`);
