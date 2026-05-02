"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { hasCompletedOnboarding, markOnboardingComplete } from "@/lib/player-state";

// First-launch onboarding sequence — 6 cinematic slides shown ONCE per
// player (gated by an "onboarding-complete" flag in player-state, which
// is wiped by Reset). Crossfade between slides, no flashy transitions.
//
// Layout:
//   • 9:16 portrait illustration fills the slide (full-bleed)
//   • Title + body float on a frosted, semi-transparent dark backdrop
//     pinned to the bottom — always readable regardless of the underlying
//     image. The bottom-control row (dots + Next) shares the same panel.
//
// Mobile: full-bleed slide with horizontal swipe. Desktop: ~420px-wide
// portrait sheet, click-only (matches modal sheets across the app).

type Slide = {
  id: string;
  image: string;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    id: "title",
    image: "/onboarding/onboarding_00_title.png",
    title: "Blackfile",
    body: "An open-investigation detective game. Talk, look, think. The truth is hiding in plain sight.",
  },
  {
    id: "detective",
    image: "/onboarding/onboarding_01_detective.png",
    title: "You are the detective",
    body: "You take a case. You read the briefing. You start investigating.",
  },
  {
    id: "everyone-lies",
    image: "/onboarding/onboarding_02_everyone_lies.png",
    title: "Everyone lies",
    body: "Talk to people. Suspects, witnesses, anyone who knew the victim. They'll tell you stories. Most of those stories aren't true.",
  },
  {
    id: "find-evidence",
    image: "/onboarding/onboarding_03_build_case.png",
    title: "Find evidence. Build your board.",
    body: "Examine locations. Some places open only when you learn to look. Some evidence comes from conversations — when you ask the right question to the right person. Pin suspects. Connect their stories. Find the pattern.",
  },
  {
    id: "consequence",
    image: "/onboarding/onboarding_04_consequence.png",
    title: "Accuse with care",
    body: "You have 2 chances. The wrong accusation sends an innocent person to prison — and the real killer walks. Everyone lies. The killer could be anyone.",
  },
  {
    id: "ready",
    image: "/onboarding/onboarding_05_ready.png",
    title: "Ready, detective?",
    body: "Your first case is waiting.",
  },
];

export default function Onboarding() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  // Track touch coords for swipe detection on mobile.
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // First-launch detection. Run after mount so server render stays clean.
  useEffect(() => {
    if (!hasCompletedOnboarding()) setOpen(true);
  }, []);

  if (!open) return null;
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  function next() {
    if (isLast) finish();
    else setIndex(i => Math.min(SLIDES.length - 1, i + 1));
  }
  function prev() {
    setIndex(i => Math.max(0, i - 1));
  }
  function finish() {
    markOnboardingComplete();
    setOpen(false);
  }

  function onTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX);
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    setTouchStartX(null);
    if (Math.abs(dx) < 60) return;
    if (dx < 0) next();
    else prev();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.94)" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slide sheet. Mobile: full-bleed. Desktop: ~420px wide portrait
          card matching the 9:16 aspect of the illustrations. */}
      <div
        className="relative w-full h-full sm:w-auto sm:h-[90vh] sm:max-h-[860px] sm:rounded-sm sm:overflow-hidden sm:border sm:border-[rgba(232,225,211,0.18)] sm:shadow-[0_30px_80px_-10px_rgba(0,0,0,0.8)]"
        style={{ background: "var(--bg)", color: "var(--fg)", aspectRatio: "9 / 16" }}
      >
        {/* Crossfade illustration */}
        <AnimatePresence mode="wait">
          <motion.img
            key={slide.id}
            src={slide.image}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        </AnimatePresence>

        {/* Permanent gradient veil under the text band — even when the
            backdrop blur isn't supported the text stays legible. */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: "55%",
            background:
              "linear-gradient(180deg, rgba(8,6,4,0) 0%, rgba(8,6,4,0.55) 38%, rgba(8,6,4,0.92) 78%, rgba(8,6,4,0.96) 100%)",
          }}
        />

        {/* Skip — top-right, persistent across slides */}
        <button
          type="button"
          onClick={finish}
          className="absolute font-elite uppercase z-[3]"
          style={{
            top: 18,
            right: 18,
            fontSize: 10,
            letterSpacing: "0.32em",
            color: "rgba(232,225,211,0.7)",
            background: "rgba(8,6,4,0.55)",
            border: "1px solid rgba(232,225,211,0.18)",
            padding: "8px 14px",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          Skip
        </button>

        {/* Text + controls panel — frosted, semi-transparent, anchored to
            the bottom. Crossfades with the slide via AnimatePresence. */}
        <div
          className="absolute inset-x-0 bottom-0 z-[2] flex flex-col"
          style={{
            padding: "22px 22px 22px",
            background: "rgba(8,6,4,0.55)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderTop: "1px solid rgba(232,225,211,0.12)",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
            >
              <h1
                className="font-fell"
                style={{
                  fontSize: 26,
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  lineHeight: 1.15,
                  color: "var(--fg)",
                  margin: 0,
                }}
              >
                {slide.title}
              </h1>
              <div
                style={{
                  width: 22,
                  height: 1,
                  background: "var(--accent)",
                  margin: "12px 0 14px",
                }}
              />
              <p
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.5,
                  color: "rgba(232,225,211,0.92)",
                  margin: 0,
                }}
              >
                {slide.body}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Bottom row: dot indicator + Next/Begin */}
          <div className="flex items-center justify-between gap-4" style={{ marginTop: 22 }}>
            <div className="flex items-center" style={{ gap: 6 }}>
              {SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  style={{
                    width: i === index ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === index ? "var(--accent)" : "rgba(232,225,211,0.3)",
                    border: "none",
                    padding: 0,
                    transition: "width 180ms ease, background 180ms ease",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              className="font-elite uppercase"
              style={{
                fontSize: 11,
                letterSpacing: "0.32em",
                padding: "12px 20px",
                background: isLast ? "var(--fg)" : "transparent",
                color: isLast ? "var(--bg)" : "var(--fg)",
                border: `1px solid ${isLast ? "var(--fg)" : "rgba(232,225,211,0.55)"}`,
                cursor: "pointer",
              }}
            >
              {isLast ? "Begin Case →" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
