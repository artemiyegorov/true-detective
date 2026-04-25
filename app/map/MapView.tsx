"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getState, unlockLocation, type PlayerState } from "@/lib/player-state";

type Loc = {
  id: string;
  name: string;
  available_from_start: boolean;
  short_description: string | null;
  hotspot_count: number;
  unlock_hint: string | null;
};

export default function MapView({ locations }: { locations: Loc[] }) {
  const [state, setState] = useState<PlayerState | null>(null);

  useEffect(() => {
    setState(getState());
    const handler = () => setState(getState());
    window.addEventListener("td-state-change", handler);
    return () => window.removeEventListener("td-state-change", handler);
  }, []);

  if (!state) {
    return <div className="p-8 text-neutral-500 text-sm">loading…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex items-baseline justify-between pb-4 mb-6 border-b border-neutral-800">
        <div>
          <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-300">← home</Link>
          <h1 className="text-2xl font-serif mt-1">Millbrook</h1>
          <p className="text-sm text-neutral-500">Click a location to investigate.</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-neutral-400">
            <span className="text-neutral-100 font-medium">{state.discoveredEvidence.length}</span> evidence
            {" · "}
            <span className="text-neutral-100 font-medium">{state.discoveredFacts.length}</span> facts
          </p>
          <p className="text-xs text-neutral-600 mt-0.5">
            {state.unlockedLocations.length}/{locations.length} locations unlocked
          </p>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 gap-3">
        {locations.map(loc => {
          const unlocked = state.unlockedLocations.includes(loc.id);
          return (
            <LocationCard
              key={loc.id}
              loc={loc}
              unlocked={unlocked}
              onForceUnlock={() => unlockLocation(loc.id)}
            />
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/chat/tom" className="px-3 py-1.5 rounded-md bg-neutral-900 ring-1 ring-neutral-800 hover:bg-neutral-800">
          Talk to Tom
        </Link>
        <Link href="/chat/sarah" className="px-3 py-1.5 rounded-md bg-neutral-900 ring-1 ring-neutral-800 hover:bg-neutral-800">
          Talk to Sarah
        </Link>
      </div>
    </div>
  );
}

function LocationCard({
  loc,
  unlocked,
  onForceUnlock,
}: {
  loc: Loc;
  unlocked: boolean;
  onForceUnlock: () => void;
}) {
  const inner = (
    <div className={`relative rounded-lg p-4 ring-1 transition ${
      unlocked
        ? "bg-neutral-900 ring-neutral-800 hover:bg-neutral-800 hover:ring-neutral-700"
        : "bg-neutral-950 ring-neutral-900 opacity-60"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500">{loc.id}</p>
          <h2 className="text-lg font-medium mt-0.5">{loc.name}</h2>
        </div>
        {unlocked ? (
          <span className="text-xs text-emerald-500 mt-1.5">●</span>
        ) : (
          <span className="text-xs text-neutral-700 mt-1.5">🔒</span>
        )}
      </div>
      {loc.short_description && (
        <p className="text-sm text-neutral-400 mt-2">{loc.short_description}</p>
      )}
      <p className="text-xs text-neutral-600 mt-3">
        {loc.hotspot_count} hotspot{loc.hotspot_count !== 1 ? "s" : ""}
        {!unlocked && loc.unlock_hint && ` · ${loc.unlock_hint}`}
      </p>
    </div>
  );

  if (unlocked) {
    return (
      <Link href={`/location/${loc.id}`} className="block">
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onForceUnlock}
      className="text-left block w-full"
      title="Debug: force unlock"
    >
      {inner}
    </button>
  );
}
