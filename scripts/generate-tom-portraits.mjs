import { fal } from "@fal-ai/client";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

if (!process.env.FAL_KEY) {
  console.error("FAL_KEY missing — run: node --env-file=.env.local scripts/generate-tom-portraits.mjs [verify|all]");
  process.exit(1);
}

fal.config({ credentials: process.env.FAL_KEY });

// Source of truth for prompts: docs/image-prompts.md.
// We use OpenAI gpt-image-2 edit (via fal.ai) which expects the two-column
// "Change only: ... / Preserve: ..." pattern. The .md file holds:
//   - one shared "preserve list" (repeated verbatim every iteration)
//   - one "change only" block per variant
// The script combines them into the two-column prompt sent to gpt-image-2.

const PROMPT_FILE = path.join(process.cwd(), "docs", "image-prompts.md");

async function loadPrompts() {
  const md = await readFile(PROMPT_FILE, "utf8");

  function extract(heading) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      `####\\s+${escaped}[^\\n]*\\n(?:(?!####)[\\s\\S])*?\`{3}\\n([\\s\\S]*?)\\n\`{3}`,
    );
    const m = md.match(re);
    if (!m) throw new Error(`prompt section not found: ${heading}`);
    return m[1].trim();
  }

  return {
    preserve: extract("Tom — preserve list"),
    guarded: extract("Tom — variant: guarded"),
    cracking: extract("Tom — variant: cracking"),
    broken: extract("Tom — variant: broken"),
  };
}

function buildEditPrompt(changeOnly, preserve) {
  return `Change only:\n${changeOnly}\n\nPreserve (must remain pixel-identical to the reference):\n${preserve}`;
}

const OUT_DIR = path.join(process.cwd(), "public", "portraits");
const WARM_PATH = path.join(OUT_DIR, "tom-warm.jpg");

async function gptImage2Edit(prompt, refUrl) {
  const result = await fal.subscribe("openai/gpt-image-2/edit", {
    input: {
      prompt,
      image_urls: [refUrl],
      image_size: "portrait_4_3",
      quality: "high",
      num_images: 1,
      output_format: "png",
    },
    logs: false,
  });
  const url = result.data?.images?.[0]?.url;
  if (!url) throw new Error("gpt-image-2/edit: no url\n" + JSON.stringify(result, null, 2));
  return url;
}

async function downloadTo(url, file) {
  const r = await fetch(url);
  const buf = Buffer.from(await r.arrayBuffer());
  await writeFile(file, buf);
  return buf.length;
}

async function uploadLocal(file) {
  const buf = await readFile(file);
  const blob = new Blob([buf], { type: "image/jpeg" });
  return await fal.storage.upload(blob);
}

await mkdir(OUT_DIR, { recursive: true });

const prompts = await loadPrompts();
console.log(`✓ loaded prompts from ${PROMPT_FILE}`);

console.log(`→ uploading ${WARM_PATH} as edit reference…`);
const refUrl = await uploadLocal(WARM_PATH);
console.log(`  ref: ${refUrl}`);

const mode = process.argv[2] ?? "verify";
const variantsToGenerate = mode === "all"
  ? ["guarded", "cracking", "broken"]
  : ["broken"];

// Variants are independent (all use the same WARM ref) — fan out in parallel.
const t0 = Date.now();
console.log(`→ generating ${variantsToGenerate.length} variant(s) in parallel via gpt-image-2/edit (quality=high)…`);

await Promise.all(variantsToGenerate.map(async key => {
  const fullPrompt = buildEditPrompt(prompts[key], prompts.preserve);
  const url = await gptImage2Edit(fullPrompt, refUrl);
  const out = path.join(OUT_DIR, `tom-${key}.jpg`);
  const bytes = await downloadTo(url, out);
  console.log(`  ✓ ${out} (${(bytes / 1024).toFixed(1)} KB)`);
}));

console.log(`  total: ${((Date.now() - t0) / 1000).toFixed(1)}s`);

console.log(`done. mode=${mode}`);
