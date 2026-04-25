"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getState,
  pinImportant,
  unpinImportant,
  type PlayerState,
} from "@/lib/player-state";
import {
  BOARD_EDGES,
  visibleNodes,
  visibleEdges,
  type BoardNode,
} from "@/lib/board-graph";

type ClueDetail = { id: string; name: string; significance: string };

const KIND_STYLE: Record<BoardNode["kind"], {
  ring: string;
  text: string;
  glow: string;
  iconBg: string;
  icon: string;
  tag: string;
  accent: string;
}> = {
  location: {
    ring: "ring-amber-700/50",
    text: "text-amber-200",
    glow: "glow-amber",
    iconBg: "bg-amber-900/40",
    icon: "📍",
    tag: "LOCATION",
    accent: "text-amber-300",
  },
  person: {
    ring: "ring-slate-500/50",
    text: "text-slate-100",
    glow: "glow-slate",
    iconBg: "bg-slate-700/40",
    icon: "👤",
    tag: "PERSON",
    accent: "text-slate-200",
  },
  clue: {
    ring: "ring-rose-800/60",
    text: "text-rose-100",
    glow: "glow-rust",
    iconBg: "bg-rose-900/40",
    icon: "🔍",
    tag: "CLUE",
    accent: "text-rose-300",
  },
};

export default function BoardView({
  evidenceById,
  caseTitle,
}: {
  evidenceById: Record<string, ClueDetail>;
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
      <header className="px-6 py-4 flex items-baseline justify-between border-b border-neutral-800/80 bg-black/30 backdrop-blur">
        <div>
          <Link href="/" className="font-elite text-xs uppercase tracking-[0.3em] text-neutral-500 hover:text-neutral-300">
            ← case file
          </Link>
          <h1 className="font-elite text-2xl tracking-wide mt-1 text-neutral-100">
            {caseTitle}
          </h1>
        </div>
        <div className="text-right text-sm font-elite text-neutral-500 flex items-center gap-3">
          <div>
            <p>{data.nodes.length} pinned · {data.edges.length} threads</p>
            <p className="text-xs mt-0.5">
              {state.discoveredEvidence.length} clues · {state.unlockedLocations.length}/5 locations
            </p>
          </div>
          <button
            onClick={() => setShowImportant(true)}
            className="ml-4 font-elite text-[10px] uppercase tracking-[0.2em] rounded ring-1 ring-rose-800/60 px-3 py-2 text-rose-200 hover:bg-rose-950/40"
            title="Important evidence"
          >
            ★ {importantCount} important
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
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return (
    <div className="absolute inset-0">
      {/* SVG strings under cards */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <defs>
          <filter id="threadGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.25" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {edges.map((e, i) => {
          const a = nodeMap.get(e.from);
          const b = nodeMap.get(e.to);
          if (!a || !b) return null;
          return (
            <motion.line
              key={`${e.from}->${e.to}-${i}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="var(--string-faint)"
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

      <AnimatePresence>
        {nodes.map(n => (
          <NodeCard
            key={n.id}
            node={n}
            state={state}
            onClick={() => onNodeClick(n)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function NodeCard({
  node,
  state,
  onClick,
}: {
  node: BoardNode;
  state: PlayerState;
  onClick: () => void;
}) {
  const style = KIND_STYLE[node.kind];

  // Visual state: visited locations / met persons / discovered clues get a
  // subtle glow halo and a "✓" tick.
  const visitedOrMet =
    (node.kind === "location" && node.refId && state.visitedLocations.includes(node.refId)) ||
    (node.kind === "person" && node.refId && state.metNpcs.includes(node.refId)) ||
    node.kind === "clue";
  const initials = (node.label.split(/\s+/).map(p => p[0]).slice(0, 2).join("") || "?").toUpperCase();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      title={node.hint ?? node.label}
      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer
        rounded-md ring-1 ${style.ring} ${style.glow}
        bg-[#15161f]/95 backdrop-blur-sm
        px-2.5 py-1.5 min-w-[148px] max-w-[200px]
        hover:scale-[1.04] transition-transform
        text-left`}
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2">
        {/* Avatar / icon */}
        {node.kind === "person" ? (
          node.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={node.image}
              alt={node.label}
              className="shrink-0 w-7 h-9 object-cover rounded-sm ring-1 ring-slate-600/60"
            />
          ) : (
            <span className="shrink-0 inline-flex items-center justify-center w-7 h-9 rounded-sm bg-slate-700/40 text-[11px] font-elite text-slate-200 ring-1 ring-slate-600/40">
              {initials}
            </span>
          )
        ) : (
          <span className={`shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-sm text-[11px] ${style.iconBg}`}>
            {style.icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className={`font-elite text-[9px] uppercase tracking-[0.25em] ${style.text} opacity-70`}>
              {style.tag}
            </span>
            {visitedOrMet && (
              <span className="text-[10px] text-emerald-500/80">✓</span>
            )}
          </div>
          <p className="font-fell text-[14px] leading-tight text-neutral-100 truncate">
            {node.label}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

// =====================================================================
// Dossier — opens when you click a person or location card
// =====================================================================

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
  const style = KIND_STYLE[node.kind];

  // Connected clues that have already been discovered.
  const connectedClues =
    node.kind === "clue"
      ? []
      : BOARD_EDGES.filter(e => (e.from === node.id || e.to === node.id))
          .map(e => (e.from === node.id ? e.to : e.from))
          .map(id => {
            const n = visibleNodes(state).find(v => v.id === id);
            return n;
          })
          .filter((n): n is BoardNode => !!n && n.kind === "clue");

  const npcReveals = node.kind === "person" && node.refId
    ? state.revealedByNpc[node.refId] ?? []
    : [];

  const isClue = node.kind === "clue";
  const clueDetail = isClue && node.refId ? evidenceById[node.refId] : null;
  const isPinned = isClue && node.refId ? state.importantClues.includes(node.refId) : false;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative bg-[#15161f] ring-1 ring-neutral-700 rounded-md w-full max-w-lg overflow-hidden"
        initial={{ scale: 0.92, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 12 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header strip with photo (if person) */}
        {node.kind === "person" && (
          <div className="relative h-44 bg-[#0a0a14] overflow-hidden">
            {node.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={node.image}
                alt={node.label}
                className="w-full h-full object-cover opacity-90"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-elite text-5xl text-slate-500">
                {(node.label.split(/\s+/).map(p => p[0]).slice(0, 2).join("") || "?").toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#15161f] via-[#15161f]/30 to-transparent" />
          </div>
        )}

        <div className="p-5 space-y-4">
          <div>
            <p className={`font-elite text-[10px] uppercase tracking-[0.3em] ${style.accent}`}>
              {style.tag}{node.refId ? ` · ${node.refId}` : ""}
            </p>
            <h2 className="font-fell text-2xl text-neutral-100 mt-1">{node.label}</h2>
            {node.role && (
              <p className="font-fell text-sm text-neutral-400 italic mt-0.5">{node.role}</p>
            )}
          </div>

          {/* Clue significance */}
          {isClue && clueDetail?.significance && (
            <p className="font-fell text-sm text-neutral-200 leading-relaxed">
              {clueDetail.significance}
            </p>
          )}

          {/* Person hint */}
          {!isClue && node.hint && (
            <p className="font-fell text-sm text-neutral-300 leading-relaxed">{node.hint}</p>
          )}

          {/* What we know — only for people */}
          {node.kind === "person" && (
            <DossierKnown
              connectedClues={connectedClues}
              npcReveals={npcReveals}
              evidenceById={evidenceById}
            />
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {node.href && (
              <Link
                href={node.href}
                className="font-elite text-[11px] uppercase tracking-wider rounded bg-neutral-100 text-neutral-900 px-3 py-1.5 hover:bg-white"
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
                className={`font-elite text-[11px] uppercase tracking-wider rounded px-3 py-1.5 ring-1 transition ${
                  isPinned
                    ? "bg-rose-900/50 ring-rose-700 text-rose-100"
                    : "ring-neutral-700 hover:bg-neutral-800 text-neutral-300"
                }`}
              >
                {isPinned ? "★ pinned" : "☆ pin important"}
              </button>
            )}
            <button
              onClick={onClose}
              className="ml-auto font-elite text-[11px] uppercase tracking-wider text-neutral-500 hover:text-neutral-300 px-2"
            >
              close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
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
        <p className="font-fell italic text-sm text-neutral-600">
          Nothing yet. Talk to them or surface evidence.
        </p>
      )}
      {connectedClues.length > 0 && (
        <ul className="font-fell text-sm text-neutral-300 space-y-1 mb-2">
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
        <ul className="font-fell text-sm text-neutral-300 space-y-1">
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

// =====================================================================
// Important panel — sliding sidebar with pinned clues
// =====================================================================

function ImportantPanel({
  state,
  evidenceById,
  onClose,
}: {
  state: PlayerState;
  evidenceById: Record<string, ClueDetail>;
  onClose: () => void;
}) {
  const items = state.importantClues
    .map(id => evidenceById[id])
    .filter((e): e is ClueDetail => !!e);
  return (
    <motion.div
      className="fixed inset-0 z-40 bg-black/60 flex justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.aside
        className="h-full w-full max-w-sm bg-[#0d0e15] ring-l ring-1 ring-rose-900/40 p-5 overflow-y-auto"
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 32 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-fell text-xl text-rose-100">Important evidence</h2>
          <button onClick={onClose} className="font-elite text-xs uppercase text-neutral-500 hover:text-neutral-300">
            close
          </button>
        </div>
        {items.length === 0 ? (
          <p className="font-fell italic text-sm text-neutral-500">
            Nothing pinned yet. Open a clue and tap “pin important”.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map(ev => (
              <li key={ev.id} className="rounded-md ring-1 ring-rose-900/50 p-3 bg-[#15161f]">
                <p className="font-elite text-[10px] uppercase tracking-[0.25em] text-rose-300">{ev.id}</p>
                <p className="font-fell text-base text-neutral-100 mt-0.5">{ev.name}</p>
                {ev.significance && (
                  <p className="font-fell text-sm text-neutral-400 italic mt-1">{ev.significance}</p>
                )}
                <button
                  onClick={() => unpinImportant(ev.id)}
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
