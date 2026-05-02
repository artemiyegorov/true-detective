// Build a 1080×1080 social-share PNG for the verdict screen, then either
// fire the Web Share API (mobile) or fall back to clipboard + image
// download (desktop). NO spoilers: never include the accused name or any
// case-specific evidence — the goal is to drive curiosity, not give it
// away.

type ShareArgs = {
  outcomeHeadline: string;   // e.g. "CASE CLOSED — TRUTH FOUND"
  outcomeRating: string;     // e.g. "Justice served."
  stars: 1 | 2 | 3 | 5;
  caseTitle: string;         // e.g. "The Bakery Murder — Margaret Cole"
  gameUrl: string;           // e.g. "blackfile.app"
};

export async function buildShareImage(args: ShareArgs): Promise<Blob> {
  const SIZE = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");

  // Base — near-black with a vertical gradient + subtle noise.
  const grad = ctx.createLinearGradient(0, 0, 0, SIZE);
  grad.addColorStop(0, "#0e0c0a");
  grad.addColorStop(1, "#0a0806");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Subtle off-white noise — randomised per pixel block, not full noise
  // so file stays compressible.
  const imgData = ctx.getImageData(0, 0, SIZE, SIZE);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 6;
    imgData.data[i] = Math.max(0, Math.min(255, imgData.data[i] + n));
    imgData.data[i + 1] = Math.max(0, Math.min(255, imgData.data[i + 1] + n));
    imgData.data[i + 2] = Math.max(0, Math.min(255, imgData.data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  // Oxblood accent line (top)
  ctx.fillStyle = "#a8392e";
  ctx.fillRect(SIZE / 2 - 30, 80, 60, 2);

  // Logo slot at top — simple uppercase "BLACKFILE" wordmark in Cinzel-
  // like serif. We don't have the actual font in canvas without a load
  // step, so use a high-quality serif fallback.
  ctx.fillStyle = "rgba(232,225,211,0.85)";
  ctx.font = "700 48px 'Cinzel', 'Times New Roman', Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BLACKFILE", SIZE / 2, 140);

  ctx.fillStyle = "rgba(232,225,211,0.45)";
  ctx.font = "500 16px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText("CASE FILE 247", SIZE / 2, 188);

  // Headline (the tier outcome — e.g. "CASE CLOSED — TRUTH FOUND")
  ctx.fillStyle = "#e8e1d3";
  ctx.font = "700 60px 'Cinzel', 'Times New Roman', Georgia, serif";
  wrapAndFill(ctx, args.outcomeHeadline.toUpperCase(), SIZE / 2, 360, SIZE - 160, 78);

  // Stars
  ctx.fillStyle = "#a8392e";
  ctx.font = "700 96px serif";
  ctx.fillText("★".repeat(args.stars) + "☆".repeat(5 - args.stars), SIZE / 2, 600);

  // Subhead
  ctx.fillStyle = "rgba(232,225,211,0.65)";
  ctx.font = "italic 28px 'Cinzel', 'Times New Roman', Georgia, serif";
  ctx.fillText(args.outcomeRating, SIZE / 2, 700);

  // Divider
  ctx.fillStyle = "rgba(168,57,46,0.55)";
  ctx.fillRect(SIZE / 2 - 60, 740, 120, 1);

  // Case title (no spoilers — only the public case label)
  ctx.fillStyle = "rgba(232,225,211,0.75)";
  ctx.font = "500 26px 'Cinzel', 'Times New Roman', Georgia, serif";
  wrapAndFill(ctx, args.caseTitle, SIZE / 2, 800, SIZE - 200, 36);

  // Bottom CTA
  ctx.fillStyle = "rgba(232,225,211,0.55)";
  ctx.font = "500 20px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText("CAN YOU SOLVE IT?", SIZE / 2, SIZE - 130);

  ctx.fillStyle = "rgba(232,225,211,0.85)";
  ctx.font = "700 26px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(args.gameUrl, SIZE / 2, SIZE - 90);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error("toBlob returned null"))),
      "image/png",
    );
  });
}

function wrapAndFill(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const candidate = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(candidate).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = candidate;
    }
  }
  if (cur) lines.push(cur);
  lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * lineHeight));
}

export async function shareOrCopy(
  blob: Blob,
  payload: { title: string; text: string; url: string },
): Promise<"shared" | "copied" | "downloaded"> {
  const file = new File([blob], "blackfile-verdict.png", { type: "image/png" });
  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean;
    share?: (data: { title?: string; text?: string; url?: string; files?: File[] }) => Promise<void>;
  };
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ ...payload, files: [file] });
      return "shared";
    } catch {
      // user cancelled — fall through to copy
    }
  }
  // Desktop fallback: copy share text to clipboard, also offer download.
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${payload.text} ${payload.url}`);
    }
  } catch {
    /* clipboard may be blocked */
  }
  // Trigger a save so the user can post manually.
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "blackfile-verdict.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
  return "downloaded";
}
