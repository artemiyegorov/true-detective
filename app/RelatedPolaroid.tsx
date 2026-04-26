"use client";

import Link from "next/link";
import type { BoardNode } from "@/lib/board-graph";

// Mini polaroid card used everywhere we surface a related person /
// location: the board canvas, dossier related-rows, location-page
// people / adjacent-locations sections. Visual rhyme = "this thing
// belongs on the same wall as the main board".
//
// • person → 3:4 portrait card, cream frame
// • location → 4:5 photo card, cream frame
// • victim (person without href) → black memorial frame, grayscale photo
//   with a small ✝ tag

export default function RelatedPolaroid({
  node,
  onClick,
  width = 110,
}: {
  node: BoardNode;
  onClick?: () => void;
  /** width in px — defaults to 110, dossier can pass a larger value */
  width?: number;
}) {
  const initials = (node.label.split(/\s+/).map(p => p[0]).slice(0, 2).join("") || "?").toUpperCase();
  const isVictim = node.kind === "person" && !node.href;
  const frameBg = isVictim ? "bg-[#0a0a0a]" : "bg-[#f3ede0]";
  const captionColor = isVictim ? "text-neutral-200" : "text-[#1a1a1a]";
  const aspect = node.kind === "location" ? "aspect-[4/5]" : "aspect-[3/4]";

  return (
    <Link
      href={node.href ?? "#"}
      onClick={onClick}
      style={{ width, boxShadow: "0 8px 18px -4px rgba(0,0,0,0.7), 0 2px 3px rgba(0,0,0,0.5)" }}
      className={`${frameBg} p-1.5 pb-2 ring-1 ring-black/30 transition hover:scale-[1.04] block shrink-0`}
    >
      <div className={`relative ${aspect} bg-[#1f1d1a] overflow-hidden`}>
        {node.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={node.image}
            alt={node.label}
            className={`w-full h-full object-cover ${isVictim ? "grayscale brightness-75 contrast-110" : ""}`}
            draggable={false}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center font-fell text-2xl ${isVictim ? "text-neutral-500" : "text-[#f3ede0]/70"}`}>
            {initials}
          </div>
        )}
        <div
          className="absolute inset-0 mix-blend-multiply opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.5) 100%)" }}
        />
        {isVictim && (
          <span className="absolute top-1 right-1 font-elite text-[8px] uppercase tracking-[0.25em] text-[var(--accent)]/80 bg-black/60 px-1 py-0.5 rounded-sm">
            ✝
          </span>
        )}
      </div>
      <p className={`font-fell text-[11px] text-center ${captionColor} mt-1.5 leading-tight truncate`}>
        {node.label}
      </p>
    </Link>
  );
}
