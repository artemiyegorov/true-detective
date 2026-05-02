"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getState, type PlayerState } from "@/lib/player-state";

// Bottom slot of the home-page case card. On first launch (no progress
// recorded), shows just a "Start Case" CTA — clean, no progress bar. Once
// the player has touched the case (visited the scene, met someone, picked
// up evidence) we surface the progress bar + percent + "Resume
// Investigation". Re-renders on td-state-change so the home page reflects
// current progress when the player navigates back to it.

export default function CaseProgressActions({
  totalEvidence,
}: {
  totalEvidence: number;
}) {
  const [state, setState] = useState<PlayerState | null>(null);

  useEffect(() => {
    setState(getState());
    const sync = () => setState(getState());
    window.addEventListener("td-state-change", sync);
    return () => window.removeEventListener("td-state-change", sync);
  }, []);

  // Server render + first paint show the unstarted ("Start Case") state.
  // The state hydrates immediately on mount.
  const started = !!(
    state &&
    (state.visitedLocations.length > 0 ||
      state.metNpcs.length > 0 ||
      state.discoveredEvidence.length > 0)
  );

  const evCount = state?.discoveredEvidence.length ?? 0;
  const progress = totalEvidence > 0
    ? Math.min(100, Math.round((evCount / totalEvidence) * 100))
    : 0;

  return (
    <>
      {started && (
        <div className="mt-[14px] flex items-center gap-[10px]">
          <div
            className="flex-1 overflow-hidden"
            style={{ height: 2, background: "rgba(232,225,211,0.1)" }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "var(--accent)",
                transition: "width 280ms ease",
              }}
            />
          </div>
          <div
            className="font-elite uppercase text-right"
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "var(--accent)",
              minWidth: 40,
            }}
          >
            {progress}%
          </div>
        </div>
      )}

      <Link
        href="/board"
        className="block text-center mt-4 w-full font-elite uppercase"
        style={{
          padding: "12px 14px",
          background: started ? "transparent" : "var(--accent)",
          border: `1px solid ${started ? "rgba(232,225,211,0.35)" : "var(--accent)"}`,
          color: started ? "var(--fg)" : "#fff",
          fontSize: 11,
          letterSpacing: "0.32em",
          fontWeight: started ? 500 : 700,
        }}
      >
        {started ? "Resume Investigation" : "Start Case"}
      </Link>
    </>
  );
}
