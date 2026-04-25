"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  discoverEvidence,
  discoverFact,
  getState,
  type PlayerState,
} from "@/lib/player-state";

type Hotspot = {
  id: string;
  label: string;
  available_from_start: boolean;
  on_click_text?: string;
  reveals?: { type: "evidence" | "fact"; id: string } | null;
  leads_to_location?: string;
  leads_to_npc?: string;
};

type RevealedItem =
  | { kind: "evidence"; id: string; name: string; significance: string }
  | { kind: "fact"; id: string; text: string }
  | { kind: "lead-npc"; id: string; npcId: string }
  | { kind: "lead-location"; id: string; locId: string }
  | { kind: "info"; id: string; text: string };

export default function LocationView({
  locId,
  locName,
  hotspots,
  evidenceMap,
  factsMap,
}: {
  locId: string;
  locName: string;
  hotspots: Hotspot[];
  evidenceMap: Record<string, { id: string; name: string; significance: string }>;
  factsMap: Record<string, string>;
}) {
  const [state, setState] = useState<PlayerState | null>(null);
  const [reveal, setReveal] = useState<RevealedItem | null>(null);

  useEffect(() => {
    setState(getState());
    const handler = () => setState(getState());
    window.addEventListener("td-state-change", handler);
    return () => window.removeEventListener("td-state-change", handler);
  }, []);

  function clickHotspot(hs: Hotspot) {
    if (hs.reveals?.type === "evidence") {
      const ev = evidenceMap[hs.reveals.id];
      if (ev) {
        discoverEvidence(ev.id);
        setReveal({ kind: "evidence", id: ev.id, name: ev.name, significance: ev.significance });
        return;
      }
    }
    if (hs.reveals?.type === "fact") {
      const text = factsMap[hs.reveals.id];
      if (text) {
        discoverFact(hs.reveals.id);
        setReveal({ kind: "fact", id: hs.reveals.id, text });
        return;
      }
    }
    if (hs.leads_to_npc) {
      setReveal({ kind: "lead-npc", id: hs.id, npcId: hs.leads_to_npc.replace("char_", "") });
      return;
    }
    if (hs.leads_to_location) {
      setReveal({ kind: "lead-location", id: hs.id, locId: hs.leads_to_location });
      return;
    }
    setReveal({ kind: "info", id: hs.id, text: hs.on_click_text ?? "Nothing of note here." });
  }

  if (!state) return <div className="p-8 text-neutral-500 text-sm">loading…</div>;

  const isUnlocked = state.unlockedLocations.includes(locId);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <header className="flex items-baseline justify-between pb-4 mb-6 border-b border-neutral-800">
        <div>
          <Link href="/map" className="text-xs text-neutral-500 hover:text-neutral-300">← map</Link>
          <h1 className="text-2xl font-serif mt-1">{locName}</h1>
          <p className="text-xs text-neutral-500 mt-1">{locId}</p>
        </div>
        <div className="text-right text-sm text-neutral-400">
          <p>{state.discoveredEvidence.length} evidence · {state.discoveredFacts.length} facts</p>
        </div>
      </header>

      {!isUnlocked && (
        <p className="rounded-md bg-amber-950/40 ring-1 ring-amber-900 px-3 py-2 text-sm text-amber-200 mb-4">
          This location is locked. You shouldn't be here yet — go back to the map.
        </p>
      )}

      <p className="text-sm text-neutral-500 mb-3">Hotspots — click to investigate.</p>

      <ul className="space-y-2">
        {hotspots.map(hs => {
          const alreadyDiscovered =
            (hs.reveals?.type === "evidence" && state.discoveredEvidence.includes(hs.reveals.id)) ||
            (hs.reveals?.type === "fact" && state.discoveredFacts.includes(hs.reveals.id));
          return (
            <li key={hs.id}>
              <button
                onClick={() => clickHotspot(hs)}
                className="w-full text-left rounded-md bg-neutral-900 ring-1 ring-neutral-800 hover:bg-neutral-800 hover:ring-neutral-700 px-4 py-3 transition"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{hs.label}</span>
                  {alreadyDiscovered && (
                    <span className="text-xs text-emerald-500">✓ discovered</span>
                  )}
                  {hs.leads_to_npc && (
                    <span className="text-xs text-blue-400">→ NPC</span>
                  )}
                  {hs.leads_to_location && (
                    <span className="text-xs text-blue-400">→ location</span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-1">{hs.id}</p>
              </button>
            </li>
          );
        })}
      </ul>

      {reveal && <RevealModal reveal={reveal} onClose={() => setReveal(null)} />}
    </div>
  );
}

function RevealModal({ reveal, onClose }: { reveal: RevealedItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 ring-1 ring-neutral-700 rounded-lg max-w-lg w-full p-5 space-y-3"
        onClick={e => e.stopPropagation()}
      >
        {reveal.kind === "evidence" && (
          <>
            <p className="text-xs uppercase tracking-wider text-emerald-500">Evidence found</p>
            <h2 className="text-lg font-medium">{reveal.name}</h2>
            <p className="text-sm text-neutral-400">{reveal.significance}</p>
            <p className="text-xs text-neutral-600">{reveal.id}</p>
          </>
        )}
        {reveal.kind === "fact" && (
          <>
            <p className="text-xs uppercase tracking-wider text-blue-400">Fact noted</p>
            <p className="text-sm text-neutral-200">{reveal.text}</p>
          </>
        )}
        {reveal.kind === "lead-npc" && (
          <>
            <p className="text-xs uppercase tracking-wider text-blue-400">Lead</p>
            <p className="text-sm text-neutral-200">Talk to <span className="font-medium">{reveal.npcId}</span></p>
            <Link
              href={`/chat/${reveal.npcId}`}
              className="inline-block mt-2 text-sm rounded-md bg-neutral-100 text-neutral-900 px-3 py-1.5 hover:bg-white"
              onClick={onClose}
            >
              Open chat →
            </Link>
          </>
        )}
        {reveal.kind === "lead-location" && (
          <>
            <p className="text-xs uppercase tracking-wider text-blue-400">Lead</p>
            <p className="text-sm text-neutral-200">Investigate <span className="font-medium">{reveal.locId}</span></p>
            <Link
              href={`/location/${reveal.locId}`}
              className="inline-block mt-2 text-sm rounded-md bg-neutral-100 text-neutral-900 px-3 py-1.5 hover:bg-white"
              onClick={onClose}
            >
              Go there →
            </Link>
          </>
        )}
        {reveal.kind === "info" && (
          <>
            <p className="text-xs uppercase tracking-wider text-neutral-500">Observation</p>
            <p className="text-sm text-neutral-200">{reveal.text}</p>
          </>
        )}
        <div className="pt-2 flex justify-end">
          <button onClick={onClose} className="text-xs text-neutral-500 hover:text-neutral-300">
            close
          </button>
        </div>
      </div>
    </div>
  );
}
