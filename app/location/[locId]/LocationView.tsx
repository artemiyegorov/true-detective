"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  discoverEvidence,
  discoverFact,
  getState,
  hasFlag,
  pinImportant,
  setFlag,
  unpinImportant,
  visitLocation,
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
  locImage,
  hotspots,
  evidenceMap,
  factsMap,
  briefing,
}: {
  locId: string;
  locName: string;
  locImage: string | null;
  hotspots: Hotspot[];
  evidenceMap: Record<string, { id: string; name: string; significance: string }>;
  factsMap: Record<string, string>;
  briefing: { narrator_script: string; key_facts: string[]; your_task: string } | null;
}) {
  const [state, setState] = useState<PlayerState | null>(null);
  const [reveal, setReveal] = useState<RevealedItem | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);

  useEffect(() => {
    setState(getState());
    const handler = () => setState(getState());
    window.addEventListener("td-state-change", handler);
    return () => window.removeEventListener("td-state-change", handler);
  }, []);

  useEffect(() => {
    visitLocation(locId);
    if (briefing && !hasFlag("seen-briefing")) {
      setShowBriefing(true);
      setFlag("seen-briefing");
    }
  }, [locId, briefing]);

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

  // Group hotspots by interaction kind so the page reads as a place,
  // not a flat list of widgets.
  const peopleHotspots = hotspots.filter(h => h.leads_to_npc);
  const investigateHotspots = hotspots.filter(h => h.reveals);
  const exitHotspots = hotspots.filter(h => h.leads_to_location);
  const lookHotspots = hotspots.filter(
    h => !h.leads_to_npc && !h.reveals && !h.leads_to_location,
  );

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Photo header */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        {locImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={locImage} alt={locName} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[#0a0c12]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-950" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 to-transparent" />
        <div className="absolute top-0 left-0 right-0 px-6 py-4 flex justify-between items-start">
          <Link href="/board" className="font-elite text-xs uppercase tracking-[0.3em] text-neutral-300 hover:text-white">
            ← board
          </Link>
          <div className="font-elite text-xs uppercase tracking-[0.2em] text-neutral-300 text-right">
            {state.discoveredEvidence.length} evidence · {state.discoveredFacts.length} facts
          </div>
        </div>
        <div className="absolute bottom-4 left-6 right-6">
          <p className="font-elite text-xs uppercase tracking-[0.3em] text-neutral-400">Location</p>
          <h1 className="font-fell text-3xl sm:text-4xl text-neutral-50 mt-1">{locName}</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {peopleHotspots.length > 0 && (
          <Section title="People here" subtitle="Knock, ring, ask a question.">
            {peopleHotspots.map(hs => (
              <HotspotButton key={hs.id} hotspot={hs} state={state} onClick={() => clickHotspot(hs)} />
            ))}
          </Section>
        )}

        {investigateHotspots.length > 0 && (
          <Section title="Investigate" subtitle="Take a closer look.">
            {investigateHotspots.map(hs => (
              <HotspotButton key={hs.id} hotspot={hs} state={state} onClick={() => clickHotspot(hs)} />
            ))}
          </Section>
        )}

        {lookHotspots.length > 0 && (
          <Section title="Look around" subtitle="Background detail.">
            {lookHotspots.map(hs => (
              <HotspotButton key={hs.id} hotspot={hs} state={state} onClick={() => clickHotspot(hs)} />
            ))}
          </Section>
        )}

        {exitHotspots.length > 0 && (
          <Section title="Move to" subtitle="Adjacent areas.">
            {exitHotspots.map(hs => (
              <HotspotButton key={hs.id} hotspot={hs} state={state} onClick={() => clickHotspot(hs)} />
            ))}
          </Section>
        )}
      </div>

      {reveal && (
        <RevealModal
          reveal={reveal}
          isPinned={
            (reveal.kind === "evidence" && state.importantClues.includes(reveal.id)) ||
            (reveal.kind === "fact" && state.importantClues.includes(reveal.id))
          }
          onClose={() => setReveal(null)}
        />
      )}

      <AnimatePresence>
        {showBriefing && briefing && (
          <BriefingModal briefing={briefing} onClose={() => setShowBriefing(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-elite text-xs uppercase tracking-[0.3em] text-neutral-400">{title}</h2>
        {subtitle && <p className="font-fell italic text-xs text-neutral-600">{subtitle}</p>}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">{children}</div>
    </section>
  );
}

function HotspotButton({
  hotspot,
  state,
  onClick,
}: {
  hotspot: Hotspot;
  state: PlayerState;
  onClick: () => void;
}) {
  const alreadyDiscovered =
    (hotspot.reveals?.type === "evidence" && state.discoveredEvidence.includes(hotspot.reveals.id)) ||
    (hotspot.reveals?.type === "fact" && state.discoveredFacts.includes(hotspot.reveals.id));
  const tag = hotspot.leads_to_npc
    ? "NPC"
    : hotspot.leads_to_location
    ? "MOVE"
    : hotspot.reveals?.type === "evidence"
    ? "EVIDENCE"
    : hotspot.reveals?.type === "fact"
    ? "FACT"
    : "LOOK";
  return (
    <button
      onClick={onClick}
      className="text-left rounded-md bg-[#15161f] ring-1 ring-neutral-800 hover:bg-[#1a1c25] hover:ring-neutral-700 px-3 py-2 transition"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-fell text-sm text-neutral-100">{hotspot.label}</span>
        <span className="font-elite text-[9px] uppercase tracking-[0.3em] text-neutral-500">{tag}</span>
      </div>
      {alreadyDiscovered && (
        <p className="font-elite text-[10px] uppercase tracking-wider text-emerald-500 mt-1">✓ noted</p>
      )}
    </button>
  );
}

function RevealModal({
  reveal,
  isPinned,
  onClose,
}: {
  reveal: RevealedItem;
  isPinned: boolean;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#15161f] ring-1 ring-neutral-700 rounded-md max-w-lg w-full p-5 space-y-3"
        onClick={e => e.stopPropagation()}
      >
        {reveal.kind === "evidence" && (
          <>
            <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-rose-300">Evidence</p>
            <h2 className="font-fell text-xl text-neutral-100">{reveal.name}</h2>
            <p className="font-fell text-sm text-neutral-300">{reveal.significance}</p>
            <PinRow id={reveal.id} isPinned={isPinned} />
          </>
        )}
        {reveal.kind === "fact" && (
          <>
            <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-amber-300">Fact noted</p>
            <p className="font-fell text-base text-neutral-100">{reveal.text}</p>
            <PinRow id={reveal.id} isPinned={isPinned} />
          </>
        )}
        {reveal.kind === "lead-npc" && (
          <>
            <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-blue-300">Person</p>
            <p className="text-base text-neutral-200">Open the conversation.</p>
            <Link
              href={`/chat/${reveal.npcId}`}
              className="inline-block mt-2 font-elite text-xs uppercase tracking-wider rounded bg-neutral-100 text-neutral-900 px-3 py-1.5 hover:bg-white"
              onClick={onClose}
            >
              Open chat →
            </Link>
          </>
        )}
        {reveal.kind === "lead-location" && (
          <>
            <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-blue-300">Move</p>
            <p className="text-base text-neutral-200">Step into the next area.</p>
            <Link
              href={`/location/${reveal.locId}`}
              className="inline-block mt-2 font-elite text-xs uppercase tracking-wider rounded bg-neutral-100 text-neutral-900 px-3 py-1.5 hover:bg-white"
              onClick={onClose}
            >
              Go there →
            </Link>
          </>
        )}
        {reveal.kind === "info" && (
          <>
            <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-neutral-500">Observation</p>
            <p className="font-fell text-base text-neutral-200">{reveal.text}</p>
          </>
        )}
        <div className="pt-2 flex justify-end">
          <button onClick={onClose} className="font-elite text-[10px] uppercase tracking-wider text-neutral-500 hover:text-neutral-300">
            close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PinRow({ id, isPinned }: { id: string; isPinned: boolean }) {
  return (
    <div className="pt-1">
      <button
        onClick={() => (isPinned ? unpinImportant(id) : pinImportant(id))}
        className={`font-elite text-[10px] uppercase tracking-wider rounded px-3 py-1.5 ring-1 transition ${
          isPinned
            ? "bg-rose-900/50 ring-rose-700 text-rose-100"
            : "ring-neutral-700 hover:bg-neutral-800 text-neutral-300"
        }`}
      >
        {isPinned ? "★ pinned as important" : "☆ pin as important"}
      </button>
    </div>
  );
}

function BriefingModal({
  briefing,
  onClose,
}: {
  briefing: { narrator_script: string; key_facts: string[]; your_task: string };
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#15161f] ring-1 ring-amber-700/40 rounded-md max-w-xl w-full p-6 space-y-4"
        initial={{ scale: 0.92, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 12 }}
        onClick={e => e.stopPropagation()}
      >
        <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-amber-300">
          The duty officer briefs you
        </p>
        <p className="font-fell text-base text-neutral-200 leading-relaxed">
          {briefing.narrator_script}
        </p>
        <div>
          <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
            Key facts
          </p>
          <ul className="font-fell text-sm text-neutral-300 space-y-1 list-['—_'] pl-4">
            {briefing.key_facts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
        <p className="font-fell italic text-sm text-neutral-400 border-l-2 border-amber-700/40 pl-3">
          {briefing.your_task}
        </p>
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="font-elite text-xs uppercase tracking-wider rounded bg-neutral-100 text-neutral-900 px-4 py-2 hover:bg-white"
          >
            Get to work
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
