"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getState, type PlayerState } from "@/lib/player-state";
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
}> = {
  location: {
    ring: "ring-amber-700/50",
    text: "text-amber-200",
    glow: "glow-amber",
    iconBg: "bg-amber-900/40",
    icon: "📍",
    tag: "LOCATION",
  },
  person: {
    ring: "ring-slate-500/50",
    text: "text-slate-100",
    glow: "glow-slate",
    iconBg: "bg-slate-700/40",
    icon: "👤",
    tag: "PERSON",
  },
  clue: {
    ring: "ring-rose-800/60",
    text: "text-rose-100",
    glow: "glow-rust",
    iconBg: "bg-rose-900/40",
    icon: "🔍",
    tag: "CLUE",
  },
};

export default function BoardView({
  evidenceById,
  caseTitle,
}: {
  evidenceById: Record<string, ClueDetail>;
  caseTitle: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<PlayerState | null>(null);
  const [clueModal, setClueModal] = useState<ClueDetail | null>(null);

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

  function handleNodeClick(node: BoardNode) {
    if (node.kind === "clue") {
      const detail =
        (node.evidenceId && evidenceById[node.evidenceId]) ||
        { id: node.id, name: node.label, significance: "" };
      setClueModal(detail);
      return;
    }
    if (node.href) router.push(node.href);
  }

  const totalNodes = data.nodes.length;
  const totalEdges = data.edges.length;

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
        <div className="text-right text-sm font-elite text-neutral-500">
          <p>{totalNodes} pinned · {totalEdges} threads</p>
          <p className="text-xs mt-0.5">
            {state.discoveredEvidence.length} clues · {state.unlockedLocations.length}/5 locations
          </p>
        </div>
      </header>

      {/* Board canvas — fixed-aspect, percent-positioned children */}
      <div className="flex-1 relative overflow-hidden">
        <BoardCanvas
          nodes={data.nodes}
          edges={data.edges}
          onNodeClick={handleNodeClick}
        />
      </div>

      {/* Footer / quick-actions for slice 2 demo */}
      <footer className="px-6 py-3 border-t border-neutral-800/80 bg-black/30 backdrop-blur flex flex-wrap gap-2 text-sm">
        <Link href="/chat/tom" className="font-elite text-xs uppercase tracking-wider px-3 py-1.5 rounded bg-neutral-900 ring-1 ring-neutral-700 hover:bg-neutral-800">
          interview tom
        </Link>
        <Link href="/chat/sarah" className="font-elite text-xs uppercase tracking-wider px-3 py-1.5 rounded bg-neutral-900 ring-1 ring-neutral-700 hover:bg-neutral-800">
          interview sarah
        </Link>
      </footer>

      <AnimatePresence>
        {clueModal && (
          <ClueModal detail={clueModal} onClose={() => setClueModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function BoardCanvas({
  nodes,
  edges,
  onNodeClick,
}: {
  nodes: BoardNode[];
  edges: typeof BOARD_EDGES;
  onNodeClick: (n: BoardNode) => void;
}) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return (
    <div className="absolute inset-0">
      {/* SVG strings layer (under cards) */}
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
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
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

      {/* Node cards layer */}
      <AnimatePresence>
        {nodes.map(n => (
          <NodeCard key={n.id} node={n} onClick={() => onNodeClick(n)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function NodeCard({ node, onClick }: { node: BoardNode; onClick: () => void }) {
  const style = KIND_STYLE[node.kind];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      title={node.hint ?? node.label}
      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer
        rounded-md ring-1 ${style.ring} ${style.glow}
        bg-[#15161f]/90 backdrop-blur-sm
        px-2.5 py-1.5 min-w-[140px] max-w-[180px]
        hover:scale-[1.04] transition-transform
        text-left`}
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="flex items-center gap-1.5">
        <span className={`shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-sm text-[11px] ${style.iconBg}`}>
          {style.icon}
        </span>
        <span className={`font-elite text-[9px] uppercase tracking-[0.25em] ${style.text} opacity-70`}>
          {style.tag}
        </span>
      </div>
      <p className="mt-0.5 font-fell text-[14px] leading-tight text-neutral-100">
        {node.label}
      </p>
    </motion.button>
  );
}

function ClueModal({ detail, onClose }: { detail: ClueDetail; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#15161f] ring-1 ring-rose-800/60 rounded-md max-w-md w-full p-5 space-y-3"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
      >
        <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-rose-300">Clue</p>
        <h2 className="font-fell text-xl text-neutral-100">{detail.name}</h2>
        {detail.significance && (
          <p className="font-fell text-sm text-neutral-300 italic">{detail.significance}</p>
        )}
        <p className="font-elite text-[10px] text-neutral-600">{detail.id}</p>
        <div className="pt-2 flex justify-end">
          <button onClick={onClose} className="font-elite text-xs uppercase tracking-wider text-neutral-500 hover:text-neutral-300">
            close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
