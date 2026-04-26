import { fal } from "@fal-ai/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

if (!process.env.FAL_KEY) {
  console.error("FAL_KEY missing");
  process.exit(1);
}

fal.config({ credentials: process.env.FAL_KEY });

// A "from a few years before her death" portrait — Margaret as a real
// person, used in the dossier so the player remembers WHO they're
// avenging. Different framing from the suspect headshots: this looks
// like a family-album / community-photo capture.

const PROMPT = `
Subject: Margaret Cole, a 54-year-old white American woman, ash-blonde hair worn in a loose bun with a few escaped strands, soft smile lines around blue-grey eyes, mid-fifties skin texture with fine wrinkles around the eyes and mouth. Wearing a clean white baker's apron over a soft cream cotton blouse, a thin gold chain with a small pendant at her collarbone, no makeup, hands marked with the small calluses of someone who actually bakes. Standing behind the wooden counter of a small-town bakery in late afternoon — wedding-ring on her left hand resting on the counter.

Expression: warm, attentive, slight closed-mouth smile, eyes meeting the camera kindly. The kind of person you'd recognise on Main Street.

Setting: warm interior of a bakery, copper pendant lights overhead casting a soft tungsten glow, cherry-wood display cases visible behind her with sourdough loaves and croissants, slightly out of focus. Late afternoon light filtering in from the right. Cinematic framing, head and shoulders to mid-chest.

Style: photorealistic editorial portrait, grounded realism, "Mare of Easttown" / "Sharp Objects" prestige TV drama aesthetic, muted warm palette with golden highlights, subtle Kodak Portra 400 film grain, deep focus. NOT a polished corporate headshot, NOT glossy. Looks like a real photograph of a real woman in her own shop a year before she died.
`.trim();

const OUT = path.join(process.cwd(), "public", "portraits", "margaret-default.jpg");
await mkdir(path.dirname(OUT), { recursive: true });

console.log("→ generating Margaret's portrait via gpt-image-2…");
const result = await fal.subscribe("openai/gpt-image-2", {
  input: { prompt: PROMPT, image_size: "portrait_4_3", quality: "high", num_images: 1 },
  logs: false,
});
const url = result.data?.images?.[0]?.url;
if (!url) {
  console.error("no url", JSON.stringify(result, null, 2));
  process.exit(1);
}
const r = await fetch(url);
const buf = Buffer.from(await r.arrayBuffer());
await writeFile(OUT, buf);
console.log(`  ✓ ${OUT} (${(buf.length / 1024).toFixed(1)} KB)`);
