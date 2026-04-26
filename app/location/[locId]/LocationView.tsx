"use client";

import { useEffect, useMemo, useState } from "react";
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
import { BOARD_EDGES, BOARD_NODES, visibleNodes, type BoardNode } from "@/lib/board-graph";
import { sceneFor } from "@/lib/scene-content";
import Tabs from "../../Tabs";

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
  evidenceMap: Record<string, { id: string; name: string; significance: string; found_at?: string }>;
  factsMap: Record<string, string>;
  briefing: { narrator_script: string; key_facts: string[]; your_task: string } | null;
}) {
  const [state, setState] = useState<PlayerState | null>(null);
  const [reveal, setReveal] = useState<RevealedItem | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);

  const sceneContent = useMemo(() => sceneFor(locId), [locId]);

  useEffect(() => {
    setState(getState());
    const handler = () => setState(getState());
    window.addEventListener("td-state-change", handler);
    return () => window.removeEventListener("td-state-change", handler);
  }, []);

  // Visit + briefing + ambient-fact auto-discovery on entry.
  useEffect(() => {
    visitLocation(locId);
    if (briefing && !hasFlag("seen-briefing")) {
      setShowBriefing(true);
      setFlag("seen-briefing");
    }
  }, [locId, briefing]);

  function clickHotspot(hs: Hotspot) {
    if (hs.leads_to_npc) return;       // person cards handle their own click
    if (hs.leads_to_location) return;  // location cards handle their own click

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
    setReveal({ kind: "info", id: hs.id, text: hs.on_click_text ?? "Nothing of note here." });
  }

  if (!state) return <div className="p-8 text-neutral-500 text-sm">loading…</div>;

  // Group hotspots by interaction kind, but the player only sees a single
  // bare list (no tag pills) — the grouping just shapes layout sections.
  const peopleHotspots = hotspots.filter(h => h.leads_to_npc);
  const exitHotspots = hotspots.filter(h => h.leads_to_location);
  const objectHotspots = hotspots.filter(h => !h.leads_to_npc && !h.leads_to_location);

  // Person nodes from the global graph, looked up by char_id so we can
  // render their photo cards.
  const hotspotPeople = peopleHotspots
    .map(h => BOARD_NODES.find(n => n.kind === "person" && `char_${n.refId}` === h.leads_to_npc))
    .filter((n): n is BoardNode => !!n);
  const locationNodes = exitHotspots
    .map(h => BOARD_NODES.find(n => n.kind === "location" && n.refId === h.leads_to_location))
    .filter((n): n is BoardNode => !!n);

  // Anyone the player has unlocked who is connected to this location
  // through the case graph (so e.g. visiting the bakery surfaces Tom +
  // Sarah even before they're listed as a hotspot).
  const visible = visibleNodes(state);
  const visibleIds = new Set(visible.map(n => n.id));
  const locNodeId = `l:${locId.replace(/^loc_/, "")}`;
  const linkedPeopleIds = new Set<string>();
  for (const e of BOARD_EDGES) {
    if (e.from === locNodeId && visibleIds.has(e.to)) linkedPeopleIds.add(e.to);
    if (e.to === locNodeId && visibleIds.has(e.from)) linkedPeopleIds.add(e.from);
  }
  const linkedPeople = visible.filter(
    n => n.kind === "person" && linkedPeopleIds.has(n.id),
  );
  // Only persons with a chat target (i.e. not the victim).
  const peopleNodes = mergeUniqueById([...hotspotPeople, ...linkedPeople])
    .filter(p => !!p.href);

  // Clues the player has discovered at this location.
  const cluesHere = state.discoveredEvidence
    .map(id => evidenceMap[id])
    .filter((ev): ev is { id: string; name: string; significance: string; found_at?: string } => !!ev)
    .filter(ev => ev.found_at?.split(":")[0] === locId);

  const labelFor = (hs: Hotspot) => sceneContent?.labels?.[hs.id] ?? hs.label;
  const ambient = sceneContent?.ambient ?? [];
  const sceneProse = sceneContent?.scene ?? null;

  return (
    <div className="relative min-h-screen bg-neutral-950">
      {/* Pinned hero photo — stays in place while content scrolls over it */}
      <div className="fixed inset-x-0 top-0 h-[80vh] z-0 pointer-events-none">
        {locImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={locImage} alt={locName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#0a0c12]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-neutral-950" />
      </div>

      {/* Top tabs bar — floats above the hero */}
      <header className="fixed top-0 inset-x-0 z-30 px-6 py-3 grid grid-cols-[auto_1fr_auto] gap-4 items-center bg-gradient-to-b from-black/70 to-transparent backdrop-blur-sm">
        <Link
          href="/"
          className="font-elite text-[10px] uppercase tracking-[0.3em] text-neutral-200 hover:text-white"
        >
          home
        </Link>
        <div className="flex justify-center"><Tabs /></div>
        <span />
      </header>

      {/* Spacer so the title starts well into the visible hero */}
      <div className="h-[60vh] relative z-0" />

      {/* Scrolling content slides up over the fixed hero */}
      <div className="relative z-10 bg-neutral-950 rounded-t-[28px] shadow-[0_-30px_60px_-20px_rgba(0,0,0,0.9)] min-h-screen">
        <div className="max-w-2xl mx-auto px-6 pt-8 pb-16 space-y-8">
          <div>
            <p className="font-elite text-xs uppercase tracking-[0.3em] text-neutral-500">Location</p>
            <h1 className="font-fell text-3xl sm:text-4xl text-neutral-50 mt-1 leading-tight">{locName}</h1>
          </div>
        {/* Atmospheric scene prose */}
        {sceneProse && (
          <p className="text-base sm:text-lg leading-relaxed text-neutral-200 italic">
            {sceneProse}
          </p>
        )}

        {/* Ambient facts — what you notice immediately */}
        {ambient.length > 0 && (
          <div className="space-y-2 border-l-2 border-neutral-800 pl-4">
            <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              You notice immediately
            </p>
            <ul className="space-y-1">
              {ambient.map((line, i) => (
                <li key={i} className="text-sm text-neutral-300 flex gap-2">
                  <span className="text-neutral-600">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* People connected to / in the scene */}
        {peopleNodes.length > 0 && (
          <Section title="People connected here">
            <div className="flex flex-wrap gap-3">
              {peopleNodes.map(p => <PersonCard key={p.id} node={p} />)}
            </div>
          </Section>
        )}

        {/* Clues already discovered at this location */}
        {cluesHere.length > 0 && (
          <Section title="Clues from this location">
            <ul className="space-y-1">
              {cluesHere.map(ev => (
                <li key={ev.id}>
                  <ObjectButton
                    label={ev.name}
                    discovered={true}
                    onClick={() => setReveal({ kind: "evidence", id: ev.id, name: ev.name, significance: ev.significance })}
                  />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Interactive objects as proper buttons (no leaked tags) */}
        {objectHotspots.length > 0 && (
          <Section title="Around you">
            <div className="grid sm:grid-cols-2 gap-2">
              {objectHotspots.map(hs => (
                <ObjectButton
                  key={hs.id}
                  label={labelFor(hs)}
                  discovered={
                    (hs.reveals?.type === "evidence" && state.discoveredEvidence.includes(hs.reveals.id)) ||
                    (hs.reveals?.type === "fact" && state.discoveredFacts.includes(hs.reveals.id))
                  }
                  onClick={() => clickHotspot(hs)}
                />
              ))}
            </div>
          </Section>
        )}

        {/* Connected locations */}
        {locationNodes.length > 0 && (
          <Section title="Adjacent">
            <div className="flex flex-wrap gap-3">
              {locationNodes.map(l => <LocationCard key={l.id} node={l} />)}
            </div>
          </Section>
        )}
        </div>
      </div>

      <AnimatePresence>
        {reveal && (
          <RevealModal
            reveal={reveal}
            isPinned={
              (reveal.kind === "evidence" || reveal.kind === "fact") &&
              state.importantClues.includes(reveal.id)
            }
            onClose={() => setReveal(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBriefing && briefing && (
          <BriefingModal briefing={briefing} onClose={() => setShowBriefing(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function mergeUniqueById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-elite text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ObjectButton({
  label,
  discovered,
  onClick,
}: {
  label: string;
  discovered: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-md ring-1 transition flex items-center gap-3 ${
        discovered
          ? "bg-[#0f1018] ring-neutral-900 text-neutral-500 hover:ring-neutral-700"
          : "bg-[#15161f] ring-neutral-800 text-neutral-100 hover:bg-[#1a1c25] hover:ring-neutral-700"
      }`}
    >
      <span className="text-base flex-1">{label}</span>
      {discovered && (
        <span className="font-elite text-[9px] uppercase tracking-wider text-emerald-600/80">noted</span>
      )}
    </button>
  );
}

function PersonCard({ node }: { node: BoardNode }) {
  return (
    <Link
      href={node.href ?? "#"}
      className="flex items-center gap-3 rounded-md bg-[#15161f] ring-1 ring-neutral-800 hover:bg-[#1a1c25] hover:ring-neutral-600 px-3 py-2 transition min-w-[180px]"
    >
      {node.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={node.image} alt={node.label} className="w-10 h-12 object-cover rounded-sm" />
      ) : (
        <span className="w-10 h-12 rounded-sm bg-neutral-800 flex items-center justify-center font-elite text-xs text-neutral-500">
          {(node.label.split(/\s+/).map(p => p[0]).slice(0, 2).join("") || "?").toUpperCase()}
        </span>
      )}
      <div>
        <p className="font-fell text-sm text-neutral-100 leading-tight">{node.label}</p>
        <p className="font-elite text-[9px] uppercase tracking-wider text-neutral-500 mt-0.5">talk →</p>
      </div>
    </Link>
  );
}

function LocationCard({ node }: { node: BoardNode }) {
  return (
    <Link
      href={node.href ?? "#"}
      className="flex items-center gap-3 rounded-md bg-[#15161f] ring-1 ring-neutral-800 hover:bg-[#1a1c25] hover:ring-neutral-600 px-3 py-2 transition min-w-[180px]"
    >
      {node.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={node.image} alt={node.label} className="w-12 h-12 object-cover rounded-sm" />
      ) : (
        <span className="w-12 h-12 rounded-sm bg-amber-950/40 ring-1 ring-amber-700/40 flex items-center justify-center text-amber-300">
          📍
        </span>
      )}
      <div>
        <p className="font-fell text-sm text-neutral-100 leading-tight">{node.label}</p>
        <p className="font-elite text-[9px] uppercase tracking-wider text-neutral-500 mt-0.5">enter →</p>
      </div>
    </Link>
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
      className="fixed inset-0 bg-black/85 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center p-4 py-12">
      <motion.div
        initial={{ scale: 0.94, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        className="relative bg-[#15161f] ring-1 ring-neutral-700 rounded-md max-w-lg w-full p-5 pr-12 space-y-3"
        onClick={e => e.stopPropagation()}
      >
        {/* Top-right action row: pin star + close × — same size, same row */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {(reveal.kind === "evidence" || reveal.kind === "fact") && (
            <button
              type="button"
              onClick={() => (isPinned ? unpinImportant(reveal.id) : pinImportant(reveal.id))}
              aria-label={isPinned ? "Unpin" : "Pin as important"}
              className={`w-9 h-9 rounded-full ring-1 flex items-center justify-center text-lg leading-none transition ${
                isPinned
                  ? "bg-rose-500/90 ring-rose-300 text-white shadow-[0_0_18px_rgba(244,63,94,0.55)]"
                  : "bg-transparent ring-rose-700 text-rose-300 hover:bg-rose-900/40 hover:text-white"
              }`}
            >
              {isPinned ? "★" : "☆"}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-black/40 ring-1 ring-neutral-700 hover:bg-neutral-900 hover:ring-neutral-500 text-neutral-400 hover:text-white flex items-center justify-center text-xl leading-none"
          >
            ×
          </button>
        </div>

        {reveal.kind === "evidence" && (
          <>
            <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-rose-300">
              Evidence · added to casebook
            </p>
            <h2 className="font-fell text-xl text-neutral-100">{reveal.name}</h2>
            <p className="text-sm text-neutral-300">{reveal.significance}</p>
          </>
        )}
        {reveal.kind === "fact" && (
          <>
            <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-amber-300">
              You note
            </p>
            <p className="text-base text-neutral-100">{reveal.text}</p>
          </>
        )}
        {reveal.kind === "info" && (
          <>
            <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              Observation
            </p>
            <p className="text-base text-neutral-200">{reveal.text}</p>
          </>
        )}
      </motion.div>
      </div>
    </motion.div>
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
      className="fixed inset-0 z-50 bg-black/85 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center p-4 py-12">
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
        <p className="text-base text-neutral-200 leading-relaxed">
          {briefing.narrator_script}
        </p>
        <div>
          <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
            Key facts
          </p>
          <ul className="text-sm text-neutral-300 space-y-1 list-['—_'] pl-4">
            {briefing.key_facts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
        <p className="italic text-sm text-neutral-400 border-l-2 border-amber-700/40 pl-3">
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
      </div>
    </motion.div>
  );
}
