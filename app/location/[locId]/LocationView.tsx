"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";
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
import RelatedPolaroid from "../../RelatedPolaroid";
import { BackLink } from "../../BackLink";

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
  | { kind: "evidence"; id: string; name: string; significance: string; image?: string }
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
  evidenceMap: Record<string, { id: string; name: string; significance: string; found_at?: string; image?: string }>;
  factsMap: Record<string, string>;
  briefing: {
    narrator_script: string;
    key_facts: string[];
    your_task: string;
    video?: string;
    auto_discover_evidence?: string[];
    auto_discover_facts?: string[];
  } | null;
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

  // When the briefing closes (or auto-completes) mark the evidence and
  // facts the duty officer name-dropped so the player isn't forced to
  // re-collect them from the scene one-by-one.
  function handleBriefingClose() {
    if (briefing?.auto_discover_evidence) {
      for (const id of briefing.auto_discover_evidence) discoverEvidence(id);
    }
    if (briefing?.auto_discover_facts) {
      for (const id of briefing.auto_discover_facts) discoverFact(id);
    }
    setShowBriefing(false);
  }

  function clickHotspot(hs: Hotspot) {
    if (hs.leads_to_npc) return;       // person cards handle their own click
    if (hs.leads_to_location) return;  // location cards handle their own click

    if (hs.reveals?.type === "evidence") {
      const ev = evidenceMap[hs.reveals.id];
      if (ev) {
        discoverEvidence(ev.id);
        setReveal({ kind: "evidence", id: ev.id, name: ev.name, significance: ev.significance, image: ev.image });
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
  // "Around you" only lists interactive objects the player hasn't yet
  // surfaced. Once a hotspot's reveal lands in discoveredEvidence /
  // discoveredFacts it's redundant with "Clues from this location" above,
  // so we drop it from the list to keep the scene compact.
  const objectHotspots = hotspots.filter(h => {
    if (h.leads_to_npc || h.leads_to_location) return false;
    const r = h.reveals;
    if (!r) return true;
    if (r.type === "evidence" && state.discoveredEvidence.includes(r.id)) return false;
    if (r.type === "fact" && state.discoveredFacts.includes(r.id)) return false;
    return true;
  });

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
    .filter((ev): ev is { id: string; name: string; significance: string; found_at?: string; image?: string } => !!ev)
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

      {!reveal && !showBriefing && <BackLink href="/board" label="BOARD" />}

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
              {peopleNodes.map(p => <RelatedPolaroid key={p.id} node={p} />)}
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
                    onClick={() => setReveal({ kind: "evidence", id: ev.id, name: ev.name, significance: ev.significance, image: ev.image })}
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
              {locationNodes.map(l => <RelatedPolaroid key={l.id} node={l} />)}
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
          <BriefingModal briefing={briefing} onClose={handleBriefingClose} />
        )}
      </AnimatePresence>

      {/* Replay-briefing button — top-right, mirroring the BackLink that
          sits top-left. Same vertical position so they read as a pair.
          Hidden whenever any modal is up (reveal / briefing) so it doesn't
          overlap the modal's own close × button. */}
      {briefing && !showBriefing && !reveal && (
        <button
          onClick={() => setShowBriefing(true)}
          aria-label="Replay duty officer briefing"
          title="Replay briefing"
          className="fixed z-[60] flex items-center justify-center"
          style={{
            right: 14,
            top: 14,
            // Match BackLink's pill height (≈34px). Square keeps the play
            // glyph centered cleanly.
            width: 34,
            height: 34,
            padding: 0,
            background: "rgba(8,6,4,0.55)",
            border: "1px solid rgba(232,225,211,0.12)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            color: "var(--fg)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M3 2l9 5-9 5V2z" fill="currentColor" />
          </svg>
        </button>
      )}
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


function RevealModal({
  reveal,
  isPinned,
  onClose,
}: {
  reveal: RevealedItem;
  isPinned: boolean;
  onClose: () => void;
}) {
  const isEvidence = reveal.kind === "evidence";
  const isFact = reveal.kind === "fact";
  const breadcrumb = isEvidence
    ? "Casebook / Evidence"
    : isFact
    ? "Field notes / Observation"
    : "Field notes / Note";
  const typeTag = isEvidence ? "Physical evidence" : isFact ? "Note" : "Observation";
  const title = isEvidence ? reveal.name : reveal.text;
  const [imgFailed, setImgFailed] = useState(false);
  const imageSrc = isEvidence && reveal.image && !imgFailed ? reveal.image : null;

  return (
    <motion.div
      className="td-modal-backdrop fixed inset-0 z-50 overflow-y-auto sm:flex sm:items-start sm:justify-center sm:py-10"
      style={{
        background: "var(--bg)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Sheet — full-bleed on mobile, centered max-w-2xl card on desktop. */}
      <div
        className="relative noir-grain w-full sm:max-w-2xl sm:rounded-sm sm:border sm:border-[rgba(232,225,211,0.14)] sm:overflow-hidden sm:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)]"
        style={{ background: "var(--bg)" }}
        onClick={e => e.stopPropagation()}
      >
      {/* Top action row: breadcrumb left, star + close (38×38 squares) right.
          Absolute (anchored to sheet) so on desktop it sits at the top of
          the centered card, not the viewport. */}
      <div
        className="absolute inset-x-0 z-[2] flex justify-between items-center"
        style={{ top: 0, padding: "20px 18px 0" }}
      >
        <div
          className="font-elite uppercase"
          style={{ fontSize: 9, letterSpacing: "0.32em", color: "rgba(232,225,211,0.5)" }}
        >
          {breadcrumb}
        </div>
        <div className="flex" style={{ gap: 10 }}>
          {(isEvidence || isFact) && (
            <button
              type="button"
              onClick={() => (isPinned ? unpinImportant(reveal.id) : pinImportant(reveal.id))}
              aria-label={isPinned ? "Unstar" : "Star"}
              className="flex items-center justify-center"
              style={{
                width: 38,
                height: 38,
                background: "transparent",
                border: `1px solid ${isPinned ? "var(--accent)" : "rgba(232,225,211,0.25)"}`,
                color: isPinned ? "var(--accent)" : "rgba(232,225,211,0.7)",
              }}
            >
              <Star size={16} strokeWidth={1.4} className={isPinned ? "fill-current" : ""} />
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center"
            style={{
              width: 38,
              height: 38,
              background: "transparent",
              border: "1px solid rgba(232,225,211,0.25)",
              color: "rgba(232,225,211,0.85)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 2l10 10M12 2L2 12"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {imageSrc && (
        <div className="relative w-full h-[40vh] noir-vignette">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={isEvidence ? reveal.name : ""}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
        </div>
      )}

      <motion.div
        className="max-w-2xl mx-auto relative"
        style={{ padding: imageSrc ? "26px 22px 60px" : "110px 22px 60px" }}
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div
          className="font-elite uppercase"
          style={{ fontSize: 9, letterSpacing: "0.32em", color: "rgba(232,225,211,0.45)" }}
        >
          {typeTag}
        </div>

        <h1
          className="font-fell"
          style={{
            fontSize: isEvidence ? 30 : 22,
            fontWeight: 600,
            letterSpacing: "0.01em",
            margin: "10px 0 0",
            lineHeight: 1.2,
            color: "var(--fg)",
          }}
        >
          {title}
        </h1>

        {/* 22×1 oxblood rule */}
        <div style={{ width: 22, height: 1, background: "var(--accent)", marginTop: 16 }} />

        {isEvidence && reveal.significance && (
          <p
            style={{
              fontSize: 15.5,
              lineHeight: 1.55,
              color: "rgba(232,225,211,0.88)",
              marginTop: 18,
            }}
          >
            {reveal.significance}
          </p>
        )}

        {isEvidence && (
          <p
            className="font-elite uppercase"
            style={{
              marginTop: 24,
              fontSize: 9,
              letterSpacing: "0.32em",
              color: "var(--accent)",
            }}
          >
            ✓ added to casebook
          </p>
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
  briefing: {
    narrator_script: string;
    key_facts: string[];
    your_task: string;
    video?: string;
    auto_discover_evidence?: string[];
  };
  onClose: () => void;
}) {
  // Video-first briefing: the duty officer's MP4 plays full-screen. When
  // it ends (or the player closes), the evidence the officer named is
  // marked as discovered (handled by the parent's onClose).
  if (briefing.video) {
    return (
      <motion.div
        className="fixed inset-0 z-[55] flex items-center justify-center"
        style={{ background: "#000" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src={briefing.video}
          autoPlay
          playsInline
          controls
          onEnded={onClose}
          className="max-w-full max-h-full"
          style={{ background: "#000" }}
        />
        <button
          onClick={onClose}
          aria-label="Close briefing"
          className="fixed flex items-center justify-center"
          style={{
            top: 18,
            right: 18,
            width: 38,
            height: 38,
            background: "rgba(8,6,4,0.85)",
            border: "1px solid rgba(232,225,211,0.25)",
            color: "rgba(232,225,211,0.85)",
            zIndex: 56,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <div
          className="font-elite uppercase fixed"
          style={{
            top: 22,
            left: 18,
            fontSize: 9,
            letterSpacing: "0.32em",
            color: "rgba(232,225,211,0.55)",
            zIndex: 56,
          }}
        >
          {"// Duty officer briefing"}
        </div>
      </motion.div>
    );
  }

  // Legacy text fallback for any future location whose briefing has no
  // video — keep the prose modal so we don't regress that path.
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
