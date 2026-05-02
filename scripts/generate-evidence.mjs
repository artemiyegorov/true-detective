import { fal } from "@fal-ai/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

if (!process.env.FAL_KEY) {
  console.error("FAL_KEY missing — run: node --env-file=.env.local scripts/generate-evidence.mjs");
  process.exit(1);
}

fal.config({ credentials: process.env.FAL_KEY });

const FORENSIC = `Forensic evidence photography style: harsh overhead lighting, neutral gray background or the surface where found, evidence marker and photographic ruler in frame where appropriate, documentary style, photorealistic, no artistic flourish, clinical detachment.`;

// 16 evidence prompts, one per evId. The prompt is the in-frame brief
// from docs/image-prompts.md; the script appends the FORENSIC style
// block (or a per-item style override).

const EVIDENCE = [
  {
    id: "ev_footprint_44",
    prompt: `Close-up forensic photograph of a size 12 US combat-style boot footprint on a dark kitchen tile floor, the print partially impressed in white flour dust, clearly showing a distinctive aggressive lug tread pattern (deep grooves, angular, tactical style), a forensic photographic ruler with centimeter markings placed next to the print, a small yellow evidence marker "3" visible in the top-right corner. Harsh overhead flash lighting.`,
  },
  {
    id: "ev_partial_footprint_size_11",
    prompt: `Close-up forensic photograph of a partial dress shoe footprint on a dark kitchen tile floor, smudged in light flour dust, smaller than a combat boot — approximately size 11 US, smooth leather sole pattern with a slight heel marking, partially overlapping with the chalk body outline edge. Forensic ruler placed next to it, evidence marker "5" in the corner. Harsh overhead flash.`,
  },
  {
    id: "ev_margaret_note",
    prompt: `Close-up forensic photograph of a handwritten note on slightly wrinkled white lined paper, the text reads exactly: "S — 47k, talk Sun eve, police Mon AM". The handwriting is neat cursive in blue ballpoint pen, legible, with a small date "Fri" written in the top-right corner. The note rests on a plain wooden desk surface. Evidence marker "7" visible. Harsh overhead lighting.`,
  },
  {
    id: "ev_missing_paperweight",
    prompt: `Close-up photograph of a small wooden desk surface, lit harshly from above, showing a clean square outline (approximately 4 inches by 4 inches) in a thin layer of dust, marking where a heavy object recently rested. The surrounding desk is dusty but the square is clean. Evidence marker "9" visible.`,
  },
  {
    id: "ev_paperweight_recovered",
    prompt: `Close-up forensic photograph of a bronze square paperweight (approximately 4 inches by 4 inches), engraved in raised letters "MILLBROOK CHAMBER OF COMMERCE 2019", lying on a forensic blue tarp. The weapon is wet — recently recovered from a creek — with mud streaks and a slightly tarnished surface. One corner has visible dark brown blood and hair traces on the bronze. Forensic ruler beside it, evidence marker "12" in the corner. Harsh overhead lighting.`,
  },
  {
    id: "ev_phone_log",
    prompt: `Close-up photograph of an old cordless home phone handset resting on its charging base, the small digital display showing call history: "LAST OUTGOING: 22:30 Sun, (555)-0137, Duration 14:03". The phone sits on a wooden side table. Evidence marker "4" in the corner. Natural indoor lighting (less harsh than other evidence — this was photographed in situ).`,
  },
  {
    id: "ev_margaret_cell_log_tom",
    prompt: `Close-up photograph of a printed phone bill page, lit by office lighting, showing a list of incoming calls to Margaret's bakery landline. One row highlighted in yellow marker: "INCOMING - Sun 22:15 - duration 9:04 - originating: 555-0182 (T. BRENNAN cell)". Evidence marker "8" in the corner.`,
  },
  {
    id: "ev_bar_receipt",
    prompt: `Close-up forensic photograph of a thermal printer bar receipt, slightly curled paper. Visible text: "OLIVE BAR" bold at the top, "Table 4 — Sarah K.", "Opened: Sun 22:03", itemized list showing "Pinot Noir x2" and "Blue Moon x1", "Closed: 23:04", "Total: $24.00". Resting on a neutral gray surface. Evidence marker "6" in the corner.`,
  },
  {
    id: "ev_bank_statements",
    prompt: `Close-up photograph of printed bank statement pages spread on a desk, standard American business account format, showing a list of transactions with visible outgoing wire transfers of varying amounts over 8 months — five transfers highlighted in yellow highlighter by an investigator. The top of the page shows "COLE & SONS LLC — BUSINESS ACCOUNT - JUNE 2023". Evidence marker "10" in the corner.`,
  },
  {
    id: "ev_dna_door_handle",
    prompt: `Close-up photograph of a steel back door handle, dusted with black fingerprint powder showing partial prints, a forensic swab in a plastic evidence bag laid next to it for scale. The door is industrial gray-painted steel. Evidence marker "11" in the corner.`,
  },
  {
    id: "ev_tom_old_key",
    prompt: `Close-up photograph of a single brass key with a worn paper tag attached by string, the tag reading in faded handwriting "Cole & Sons - back". The key is slightly tarnished, lying on a desk surface inside an office desk drawer (drawer visible at the edges of frame). Evidence marker "13" in the corner.`,
  },
  {
    id: "ev_security_camera_glimpse",
    prompt: `A still frame from a low-resolution street security camera, grainy and slightly pixelated, timestamp visible in the corner: "03/17 23:38:14". The image shows a man from behind, mid-step, walking into a dark alley between buildings. He is wearing a navy blazer and khaki pants. His face is not visible — only the back of his head and shoulders. Streetlight casting partial illumination. Low-fi security camera aesthetic, NOT cinematic — limited resolution and contrast.`,
    style: "STYLE OVERRIDE: low-fi street security camera, grainy, pixelated. NOT cinematic, NOT high-resolution.",
  },
  {
    id: "ev_dna_match_tom",
    prompt: `Close-up photograph of a forensic lab report sheet on white paper, neatly typed, showing test results. Visible text: "DNA ANALYSIS — SUSPECT COMPARISON". A list of analysis includes: "REFERENCE: back door handle, Exhibit B". "SUSPECT: Thomas Brennan". "RESULT: MATCH — secondary profile #2 — probability 99.98%". A magnified detail of the door handle surface is shown in inset. Evidence marker "14" in the corner. Clinical office lighting.`,
  },
  {
    id: "ev_dna_match_daniel",
    prompt: `Close-up photograph of a forensic lab report sheet on white paper, neatly typed, showing test results. Visible text: "DNA ANALYSIS — SUSPECT COMPARISON". A list of analysis includes: "REFERENCE: back door handle, Exhibit B". "SUSPECT: Daniel Kim". "RESULT: MATCH — secondary profile #1 — probability 99.97%". A magnified detail of the door handle surface is shown in inset. Evidence marker "15" in the corner. Clinical office lighting.`,
  },
  {
    id: "ev_eleanor_witness_daniel",
    prompt: `A simple investigator's notebook page, ruled lines, with a brief handwritten note in a detective's plain writing: "Witness E. Carrington reports seeing D. Kim on Olive St., 21:45 Sunday, walking unsteadily toward bakery." Black ink on pale paper.`,
    style: "STYLE OVERRIDE: detective's notebook aesthetic — pale ruled paper, handwritten ink, photographed flat from above with neutral light.",
  },
  {
    id: "ev_eleanor_witness_car",
    prompt: `Investigator's notebook page in the same hand. Note reads: "Witness E. Carrington reports dark-colored sedan, possibly BMW or Audi, parked one block from bakery, approx. 23:30 Sunday. Driver not seen." Black ink on pale ruled paper.`,
    style: "STYLE OVERRIDE: detective's notebook aesthetic — pale ruled paper, handwritten ink, photographed flat from above with neutral light.",
  },
  {
    id: "ev_eleanor_witness_helen",
    prompt: `Investigator's notebook page in the same hand. Note reads: "Witness E. Carrington reports unknown woman (yellow cardigan, brown hair) visiting Cole residence multiple afternoons over recent months while M. Cole at work." Black ink on pale ruled paper.`,
    style: "STYLE OVERRIDE: detective's notebook aesthetic — pale ruled paper, handwritten ink, photographed flat from above with neutral light.",
  },
];

const OUT_DIR = path.join(process.cwd(), "public", "clues");
await mkdir(OUT_DIR, { recursive: true });

async function gptImage2(prompt) {
  const result = await fal.subscribe("openai/gpt-image-2", {
    input: {
      prompt,
      image_size: "landscape_4_3",
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

function buildPrompt(item) {
  const styleBlock = item.style ?? FORENSIC;
  return `${item.prompt}\n\n${styleBlock}`;
}

const t0 = Date.now();
const arg = process.argv[2];
const todo = arg ? EVIDENCE.filter(e => e.id === arg) : EVIDENCE;
console.log(`→ generating ${todo.length} evidence images via gpt-image-2 (high quality)…`);

await Promise.all(todo.map(async item => {
  try {
    const url = await gptImage2(buildPrompt(item));
    const out = path.join(OUT_DIR, `${item.id}.jpg`);
    const bytes = await downloadTo(url, out);
    console.log(`  ✓ ${item.id} (${(bytes / 1024).toFixed(1)} KB)`);
  } catch (e) {
    console.error(`  ✗ ${item.id}: ${(e instanceof Error ? e.message : String(e)).slice(0, 200)}`);
  }
}));

console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
