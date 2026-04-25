"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import Link from "next/link";
import {
  getState,
  pinImportant,
  resetBoardLayout,
  setNodePosition,
  unpinImportant,
  type PlayerState,
} from "@/lib/player-state";
import {
  BOARD_EDGES,
  BOARD_NODES,
  visibleNodes,
  visibleEdges,
  type BoardNode,
} from "@/lib/board-graph";
import Tabs from "../Tabs";

export type ClueDetail = {
  id: string;
  name: string;
  significance: string;
  foundAt?: string;
  image?: string;
};

export default function BoardView({
  evidenceById,
  factsById,
  caseTitle,
}: {
  evidenceById: Record<string, ClueDetail>;
  factsById: Record<string, string>;
  caseTitle: string;
}) {
  const [state, setState] = useState<PlayerState | null>(null);
  const [openNode, setOpenNode] = useState<BoardNode | null>(null);
  const [showImportant, setShowImportant] = useState(false);

  useEffect(() => {
    setState(getState());
    const handler = () => setState(getState());
    window.addEventListener("td-state-change", handler);
    return () => window.removeEventListener("td-state-change", handler);
  }, []);

  const data = useMemo(() => {
    if (!state) return { nodes: [], edges: [], visibleIds: new Set<string>() };
    const nodes = visibleNodes(state);
    const visibleIds = new Set(nodes.map(n => n.id));
    const edges = visibleEdges(state, visibleIds);
    return { nodes, edges, visibleIds };
  }, [state]);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-600 font-elite text-sm">
        loading the board…
      </div>
    );
  }

  const importantCount = state.importantClues.length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-3 flex items-center justify-between border-b border-neutral-800/80 bg-black/60 backdrop-blur z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-elite text-[10px] uppercase tracking-[0.3em] text-neutral-500 hover:text-neutral-300">
            ←
          </Link>
          <h1 className="font-fell text-2xl text-neutral-100 leading-none">
            {caseTitle}
          </h1>
          <div className="ml-2"><Tabs /></div>
        </div>
        <div className="text-right text-xs font-elite text-neutral-500 flex items-center gap-3">
          <div className="hidden sm:block">
            <p>{data.nodes.length} pinned · {state.discoveredEvidence.length} clues</p>
            <p className="text-[10px] mt-0.5">{state.unlockedLocations.length}/5 locations</p>
          </div>
          <button
            onClick={() => {
              if (confirm("Reset all card positions to default?")) resetBoardLayout();
            }}
            className="font-elite text-[10px] uppercase tracking-[0.2em] text-neutral-600 hover:text-neutral-300 px-2 py-1.5"
            title="Reset card positions"
          >
            reset layout
          </button>
          <button
            onClick={() => setShowImportant(true)}
            className="font-elite text-[10px] uppercase tracking-[0.2em] rounded ring-1 ring-rose-800/60 px-3 py-1.5 text-rose-200 hover:bg-rose-950/40"
          >
            ★ {importantCount}
          </button>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <BoardCanvas
          nodes={data.nodes}
          edges={data.edges}
          state={state}
          onNodeClick={setOpenNode}
        />
      </div>

      <AnimatePresence>
        {openNode && (
          <DossierPanel
            node={openNode}
            state={state}
            evidenceById={evidenceById}
            onClose={() => setOpenNode(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImportant && (
          <ImportantPanel
            state={state}
            evidenceById={evidenceById}
            factsById={factsById}
            onClose={() => setShowImportant(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BoardCanvas({
  nodes,
  edges,
  state,
  onNodeClick,
}: {
  nodes: BoardNode[];
  edges: typeof BOARD_EDGES;
  state: PlayerState;
  onNodeClick: (n: BoardNode) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Resolve final position for a node: layout override first, then graph default.
  const resolvedPos = (n: BoardNode) => {
    const layout = state.boardLayout[n.id];
    return {
      x: layout?.x ?? n.x,
      y: layout?.y ?? n.y,
      rot: layout?.rot ?? naturalRotation(n.id),
    };
  };

  const positioned = nodes.map(n => ({ node: n, pos: resolvedPos(n) }));

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cork-board"
    >
      {/* SVG strings */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <defs>
          <filter id="threadGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {edges.map((e, i) => {
          const a = positioned.find(p => p.node.id === e.from);
          const b = positioned.find(p => p.node.id === e.to);
          if (!a || !b) return null;
          return (
            <motion.line
              key={`${e.from}->${e.to}-${i}`}
              x1={a.pos.x} y1={a.pos.y} x2={b.pos.x} y2={b.pos.y}
              stroke="rgba(180, 60, 50, 0.55)"
              strokeWidth={0.18}
              strokeLinecap="round"
              filter="url(#threadGlow)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          );
        })}
      </svg>

      {/* Cards layer */}
      <AnimatePresence>
        {positioned.map(({ node, pos }) => (
          <PinnedCard
            key={node.id}
            node={node}
            pos={pos}
            containerRef={containerRef}
            onClick={() => onNodeClick(node)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Stable per-node tilt so pinned cards look hand-placed, not aligned.
function naturalRotation(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  // [-3°, +3°]
  return ((h % 60) - 30) / 10;
}

// =====================================================================
// Polaroid / index / sticky card — pinned to the cork
// =====================================================================

function PinnedCard({
  node,
  pos,
  containerRef,
  onClick,
}: {
  node: BoardNode;
  pos: { x: number; y: number; rot: number };
  containerRef: React.RefObject<HTMLDivElement | null>;
  onClick: () => void;
}) {
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const [dragging, setDragging] = useState(false);

  function handleDragEnd(_: unknown, info: { offset: { x: number; y: number } }) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dxPct = (info.offset.x / rect.width) * 100;
    const dyPct = (info.offset.y / rect.height) * 100;
    const newX = clamp(pos.x + dxPct, 4, 96);
    const newY = clamp(pos.y + dyPct, 6, 94);
    dragX.set(0);
    dragY.set(0);
    setNodePosition(node.id, newX, newY, pos.rot);
    // Defer onClick suppression until after the click event would fire.
    setTimeout(() => setDragging(false), 50);
  }

  // Click only when drag delta was tiny.
  function handleClick(e: React.MouseEvent) {
    if (dragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick();
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => setDragging(true)}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        x: dragX,
        y: dragY,
        rotate: pos.rot,
        zIndex: dragging ? 30 : 1,
      }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      whileHover={{ scale: 1.04, rotate: 0, zIndex: 20 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {/* Push-pin */}
      <span
        className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${pinColor(node.kind)} shadow-[0_2px_3px_rgba(0,0,0,0.5)]`}
        style={{ boxShadow: "inset 0 -1px 1px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.7)" }}
      />
      <CardBody node={node} />
    </motion.div>
  );
}

function pinColor(kind: BoardNode["kind"]): string {
  if (kind === "person") return "bg-slate-300";
  if (kind === "location") return "bg-amber-300";
  return "bg-rose-500"; // clue
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function CardBody({ node }: { node: BoardNode }) {
  if (node.kind === "person") return <PolaroidCard node={node} />;
  if (node.kind === "location") return <IndexCard node={node} />;
  return <StickyCard node={node} />;
}

// Person — small polaroid (photo + name, no description).
function PolaroidCard({ node }: { node: BoardNode }) {
  const initials = (node.label.split(/\s+/).map(p => p[0]).slice(0, 2).join("") || "?").toUpperCase();
  return (
    <div
      className="bg-[#f3ede0] p-1.5 pb-2 ring-1 ring-black/30 w-[104px]"
      style={{ boxShadow: "0 8px 18px -4px rgba(0,0,0,0.7), 0 2px 3px rgba(0,0,0,0.5)" }}
    >
      <div className="relative aspect-[3/4] bg-[#1f1d1a] overflow-hidden">
        {node.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={node.image}
            alt={node.label}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-fell text-2xl text-[#f3ede0]/70">
            {initials}
          </div>
        )}
        <div className="absolute inset-0 mix-blend-multiply opacity-40 pointer-events-none"
             style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)" }} />
      </div>
      <p className="font-fell text-[11px] text-center text-[#1a1a1a] mt-1.5 leading-tight truncate">
        {node.label}
      </p>
    </div>
  );
}

// Location — small polaroid of the place when there's an image, otherwise
// a tiny index-card with just a label (no leaked prompt text).
function IndexCard({ node }: { node: BoardNode }) {
  if (node.image) {
    return (
      <div
        className="bg-[#f3ede0] p-1.5 pb-2 ring-1 ring-black/30 w-[120px]"
        style={{ boxShadow: "0 8px 18px -4px rgba(0,0,0,0.7), 0 2px 3px rgba(0,0,0,0.5)" }}
      >
        <div className="relative aspect-[4/5] bg-[#1f1d1a] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={node.image}
            alt={node.label}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 mix-blend-multiply opacity-30 pointer-events-none"
               style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.5) 100%)" }} />
        </div>
        <p className="font-fell text-[11px] text-center text-[#1a1a1a] mt-1.5 leading-tight truncate">
          {node.label}
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative w-[120px] px-2.5 py-2 bg-[#fbf6e6] ring-1 ring-black/40"
      style={{ boxShadow: "0 8px 18px -4px rgba(0,0,0,0.65), 0 2px 4px rgba(0,0,0,0.4)" }}
    >
      <p className="font-elite text-[8px] uppercase tracking-[0.3em] text-rose-700/70">
        Location
      </p>
      <p className="font-fell text-[12px] text-[#1a1a1a] leading-tight mt-1 truncate">
        {node.label}
      </p>
    </div>
  );
}

// Clue — small torn paper note.
function StickyCard({ node }: { node: BoardNode }) {
  return (
    <div
      className="relative w-[110px] px-2 py-1.5 bg-[#f0d9b5] ring-1 ring-rose-900/30"
      style={{
        boxShadow: "0 6px 14px -2px rgba(0,0,0,0.55)",
        clipPath: "polygon(0% 3px, 6px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%)",
      }}
    >
      <p className="font-elite text-[8px] uppercase tracking-[0.3em] text-rose-800">
        Clue
      </p>
      <p className="font-fell text-[11px] text-[#1a1a1a] leading-tight mt-0.5 truncate">
        {node.label}
      </p>
    </div>
  );
}

// =====================================================================
// Dossier panel + Important panel — same as before
// =====================================================================

const KIND_ACCENT: Record<BoardNode["kind"], string> = {
  location: "text-amber-300",
  person: "text-slate-200",
  clue: "text-rose-300",
};

const KIND_TAG: Record<BoardNode["kind"], string> = {
  location: "LOCATION",
  person: "PERSON",
  clue: "CLUE",
};

function DossierPanel({
  node,
  state,
  evidenceById,
  onClose,
}: {
  node: BoardNode;
  state: PlayerState;
  evidenceById: Record<string, ClueDetail>;
  onClose: () => void;
}) {
  // Walk the visible-graph edges to find related nodes by kind.
  const allConnected = BOARD_EDGES
    .filter(e => e.from === node.id || e.to === node.id)
    .map(e => (e.from === node.id ? e.to : e.from))
    .map(id => visibleNodes(state).find(v => v.id === id))
    .filter((n): n is BoardNode => !!n);
  const connectedClues = allConnected.filter(n => n.kind === "clue");
  const connectedPeople = allConnected.filter(n => n.kind === "person");
  const connectedLocations = allConnected.filter(n => n.kind === "location");

  const npcReveals = node.kind === "person" && node.refId
    ? state.revealedByNpc[node.refId] ?? []
    : [];

  const isClue = node.kind === "clue";
  const clueDetail = isClue && node.refId ? evidenceById[node.refId] : null;
  const isPinned = isClue && node.refId ? state.importantClues.includes(node.refId) : false;

  // Hero image: clues use their image (if any) at the top; people use
  // portrait; locations use location photo. Otherwise skip the hero.
  const heroImage = node.image ?? clueDetail?.image ?? null;
  const initials = (node.label.split(/\s+/).map(p => p[0]).slice(0, 2).join("") || "?").toUpperCase();

  // For clue: location where it was found (if visible on board).
  const foundAtLoc = clueDetail?.foundAt
    ? BOARD_NODES.find(n => n.kind === "location" && n.refId === clueDetail.foundAt)
    : undefined;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/95 overflow-y-auto"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bg-black/70 ring-1 ring-neutral-700 hover:bg-neutral-900 hover:ring-neutral-500 text-neutral-300 hover:text-white flex items-center justify-center text-lg leading-none"
      >
        ×
      </button>

      {/* Hero image (people / locations with image) */}
      {heroImage ? (
        <div className="relative w-full h-[50vh] sm:h-[60vh] noir-vignette">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt={node.label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
        </div>
      ) : node.kind === "person" ? (
        <div className="relative w-full h-[50vh] sm:h-[60vh] noir-vignette flex items-center justify-center bg-[#0a0a14]">
          <span className="font-fell text-7xl text-slate-500">{initials}</span>
        </div>
      ) : null}

      {/* Body */}
      <motion.div
        className={`max-w-2xl mx-auto px-6 py-8 space-y-6 relative ${
          heroImage || node.kind === "person" ? "-mt-16" : "pt-24"
        }`}
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div>
          <p className={`font-elite text-[10px] uppercase tracking-[0.3em] ${KIND_ACCENT[node.kind]}`}>
            {KIND_TAG[node.kind]}
          </p>
          <h2 className="font-fell text-4xl sm:text-5xl text-neutral-50 mt-2 leading-tight">
            {node.label}
          </h2>
          {node.role && (
            <p className="font-fell italic text-base text-neutral-400 mt-1">{node.role}</p>
          )}
        </div>

        {isClue && clueDetail?.significance && (
          <p className="text-base text-neutral-200 leading-relaxed">
            {clueDetail.significance}
          </p>
        )}

        {node.kind === "person" && (
          <DossierKnown
            connectedClues={connectedClues}
            npcReveals={npcReveals}
            evidenceById={evidenceById}
          />
        )}

        {isClue && (connectedPeople.length > 0 || connectedLocations.length > 0 || foundAtLoc) && (
          <div className="space-y-4">
            {connectedPeople.length > 0 && (
              <RelatedRow title="Connected to" nodes={connectedPeople} onItem={onClose} />
            )}
            {(foundAtLoc || connectedLocations.length > 0) && (
              <RelatedRow
                title="Found at"
                nodes={foundAtLoc ? [foundAtLoc, ...connectedLocations.filter(l => l.id !== foundAtLoc.id)] : connectedLocations}
                onItem={onClose}
              />
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-4">
          {node.href && (
            <Link
              href={node.href}
              className="font-elite text-[11px] uppercase tracking-wider rounded bg-neutral-100 text-neutral-900 px-4 py-2 hover:bg-white"
              onClick={onClose}
            >
              {node.kind === "person" ? "Open interview →" : "Visit location →"}
            </Link>
          )}
          {isClue && node.refId && (
            <button
              onClick={() => {
                if (isPinned) unpinImportant(node.refId!);
                else pinImportant(node.refId!);
              }}
              className={`font-elite text-[11px] uppercase tracking-wider rounded px-4 py-2 ring-1 transition ${
                isPinned
                  ? "bg-rose-900/50 ring-rose-700 text-rose-100"
                  : "ring-neutral-700 hover:bg-neutral-800 text-neutral-300"
              }`}
            >
              {isPinned ? "★ pinned" : "☆ pin important"}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function RelatedRow({
  title,
  nodes,
  onItem,
}: {
  title: string;
  nodes: BoardNode[];
  onItem: () => void;
}) {
  if (!nodes.length) return null;
  return (
    <div>
      <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
        {title}
      </p>
      <div className="flex flex-wrap gap-3">
        {nodes.map(n => (
          <Link
            key={n.id}
            href={n.href ?? "#"}
            onClick={onItem}
            className="flex items-center gap-2 rounded-md bg-[#15161f] ring-1 ring-neutral-800 hover:bg-[#1a1c25] hover:ring-neutral-600 px-3 py-2 transition"
          >
            {n.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={n.image} alt={n.label} className="w-8 h-10 object-cover rounded-sm" />
            ) : (
              <span className="w-8 h-10 rounded-sm bg-neutral-800 flex items-center justify-center font-elite text-[10px] text-neutral-500">
                {(n.label.split(/\s+/).map(p => p[0]).slice(0, 2).join("") || "?").toUpperCase()}
              </span>
            )}
            <span className="font-fell text-sm text-neutral-100">{n.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DossierKnown({
  connectedClues,
  npcReveals,
  evidenceById,
}: {
  connectedClues: BoardNode[];
  npcReveals: string[];
  evidenceById: Record<string, ClueDetail>;
}) {
  const hasContent = connectedClues.length > 0 || npcReveals.length > 0;
  return (
    <div>
      <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
        What we know
      </p>
      {!hasContent && (
        <p className="italic text-sm text-neutral-600">
          Nothing yet. Talk to them or surface evidence.
        </p>
      )}
      {connectedClues.length > 0 && (
        <ul className="text-sm text-neutral-300 space-y-1 mb-2">
          {connectedClues.map(c => {
            const ev = c.refId ? evidenceById[c.refId] : null;
            return (
              <li key={c.id} className="flex gap-2">
                <span className="text-rose-400">🔍</span>
                <span>
                  <span className="text-neutral-100">{c.label}</span>
                  {ev?.significance && (
                    <span className="text-neutral-500"> — {ev.significance}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {npcReveals.length > 0 && (
        <ul className="text-sm text-neutral-300 space-y-1">
          {npcReveals.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-amber-400">·</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ImportantPanel({
  state,
  evidenceById,
  factsById,
  onClose,
}: {
  state: PlayerState;
  evidenceById: Record<string, ClueDetail>;
  factsById: Record<string, string>;
  onClose: () => void;
}) {
  type Pinned =
    | { id: string; kind: "evidence"; name: string; significance: string }
    | { id: string; kind: "fact"; text: string };

  const items: Pinned[] = state.importantClues
    .map<Pinned | null>(id => {
      const ev = evidenceById[id];
      if (ev) return { id, kind: "evidence", name: ev.name, significance: ev.significance };
      const fact = factsById[id];
      if (fact) return { id, kind: "fact", text: fact };
      return null;
    })
    .filter((p): p is Pinned => !!p);

  return (
    <motion.div
      className="fixed inset-0 z-40 bg-black/60 flex justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.aside
        className="h-full w-full max-w-sm bg-[#0d0e15] ring-1 ring-rose-900/40 p-5 overflow-y-auto"
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 32 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-fell text-xl text-rose-100">Important findings</h2>
          <button onClick={onClose} className="font-elite text-xs uppercase text-neutral-500 hover:text-neutral-300">
            close
          </button>
        </div>
        {items.length === 0 ? (
          <p className="italic text-sm text-neutral-500">
            Nothing pinned yet. Tap “pin important” on any evidence or fact.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map(item => (
              <li key={item.id} className="rounded-md ring-1 ring-rose-900/50 p-3 bg-[#15161f]">
                <p className="font-elite text-[10px] uppercase tracking-[0.25em] text-rose-300">
                  {item.kind === "evidence" ? "Evidence" : "Fact"}
                </p>
                {item.kind === "evidence" ? (
                  <>
                    <p className="font-fell text-base text-neutral-100 mt-0.5">{item.name}</p>
                    {item.significance && (
                      <p className="text-sm text-neutral-400 italic mt-1">{item.significance}</p>
                    )}
                  </>
                ) : (
                  <p className="text-base text-neutral-100 mt-0.5">{item.text}</p>
                )}
                <button
                  onClick={() => unpinImportant(item.id)}
                  className="font-elite text-[10px] uppercase tracking-wider mt-2 text-neutral-500 hover:text-rose-300"
                >
                  unpin
                </button>
              </li>
            ))}
          </ul>
        )}
      </motion.aside>
    </motion.div>
  );
}
