"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  getState,
  pinImportant,
  unpinImportant,
  type PlayerState,
} from "@/lib/player-state";
import { BOARD_EDGES, BOARD_NODES, type BoardNode } from "@/lib/board-graph";
import Tabs from "../Tabs";

export type ClueDetail = {
  id: string;
  name: string;
  significance: string;
  foundAt?: string;
  image?: string;
};

type ClueRow =
  | { kind: "evidence"; id: string; detail: ClueDetail }
  | { kind: "fact"; id: string; text: string };

export default function CasebookView({
  evidenceById,
  factsById,
  caseTitle,
}: {
  evidenceById: Record<string, ClueDetail>;
  factsById: Record<string, string>;
  caseTitle: string;
}) {
  const [state, setState] = useState<PlayerState | null>(null);
  const [openItem, setOpenItem] = useState<ClueRow | null>(null);
  const [filter, setFilter] = useState<"all" | "important">("all");

  useEffect(() => {
    setState(getState());
    const handler = () => setState(getState());
    window.addEventListener("td-state-change", handler);
    return () => window.removeEventListener("td-state-change", handler);
  }, []);

  const rows = useMemo<ClueRow[]>(() => {
    if (!state) return [];
    // Casebook holds evidence only — facts stay as ambient context, they
    // don't get filed as clues.
    const evs: ClueRow[] = state.discoveredEvidence
      .map(id => evidenceById[id])
      .filter((d): d is ClueDetail => !!d)
      .map(detail => ({ kind: "evidence" as const, id: detail.id, detail }));
    if (filter === "important") {
      return evs.filter(r => state.importantClues.includes(r.id));
    }
    return evs;
  }, [state, evidenceById, filter]);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-600 font-elite text-sm">
        loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-3 grid grid-cols-[auto_1fr_auto] gap-4 items-center border-b border-neutral-800/80 bg-black/60 backdrop-blur z-10">
        <Link
          href="/"
          className="font-elite text-[10px] uppercase tracking-[0.3em] text-neutral-400 hover:text-neutral-100"
        >
          home
        </Link>
        <div className="flex justify-center"><Tabs /></div>
        <div className="flex items-center justify-end gap-3 text-xs font-elite text-neutral-500">
          <button
            onClick={() => setFilter("all")}
            className={`uppercase tracking-[0.2em] px-2 py-1.5 rounded ${filter === "all" ? "bg-neutral-100 text-neutral-900" : "hover:text-neutral-200"}`}
          >
            all
          </button>
          <button
            onClick={() => setFilter("important")}
            className={`uppercase tracking-[0.2em] px-2 py-1.5 rounded ${filter === "important" ? "bg-rose-900/60 text-rose-100" : "hover:text-rose-200"}`}
          >
            ★ important
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-6">
        {rows.length === 0 ? (
          <p className="italic text-sm text-neutral-500">
            {filter === "important"
              ? "Nothing pinned as important yet."
              : "Nothing in your casebook yet. Investigate locations and talk to people."}
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map(r => (
              <CasebookRowItem
                key={r.id}
                row={r}
                isPinned={state.importantClues.includes(r.id)}
                onOpen={() => setOpenItem(r)}
              />
            ))}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {openItem && (
          <ClueModal
            row={openItem}
            evidenceById={evidenceById}
            isPinned={state.importantClues.includes(openItem.id)}
            onClose={() => setOpenItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CasebookRowItem({
  row,
  isPinned,
  onOpen,
}: {
  row: ClueRow;
  isPinned: boolean;
  onOpen: () => void;
}) {
  if (row.kind !== "evidence") return null;
  return (
    <li>
      <button
        onClick={onOpen}
        className="w-full text-left rounded-md bg-[#15161f] ring-1 ring-neutral-800 hover:bg-[#1a1c25] hover:ring-neutral-700 px-4 py-3 transition flex gap-3"
      >
        <span className="shrink-0 w-1 self-stretch rounded bg-rose-700" />
        <div className="flex-1 min-w-0">
          <p className="font-fell text-base text-neutral-100">{row.detail.name}</p>
          {row.detail.significance && (
            <p className="text-sm text-neutral-400 italic mt-0.5 line-clamp-1">{row.detail.significance}</p>
          )}
        </div>
        {isPinned && (
          <span className="shrink-0 self-start font-elite text-[9px] uppercase tracking-wider text-rose-300">★</span>
        )}
      </button>
    </li>
  );
}

function ClueModal({
  row,
  evidenceById,
  isPinned,
  onClose,
}: {
  row: ClueRow;
  evidenceById: Record<string, ClueDetail>;
  isPinned: boolean;
  onClose: () => void;
}) {
  const isEvidence = row.kind === "evidence";
  const detail = isEvidence ? row.detail : null;

  // Connected entities via the graph (people / locations).
  const clueNodeId = `c:${row.id.replace(/^ev_|^fact_/, "")}`; // best-effort
  const possibleClueNode = BOARD_NODES.find(
    n => n.kind === "clue" && (n.refId === row.id || n.id === clueNodeId),
  );
  const connectedPeople: BoardNode[] = [];
  const connectedLocations: BoardNode[] = [];
  if (possibleClueNode) {
    for (const e of BOARD_EDGES) {
      if (e.from === possibleClueNode.id || e.to === possibleClueNode.id) {
        const otherId = e.from === possibleClueNode.id ? e.to : e.from;
        const other = BOARD_NODES.find(n => n.id === otherId);
        if (!other) continue;
        if (other.kind === "person") connectedPeople.push(other);
        else if (other.kind === "location") connectedLocations.push(other);
      }
    }
  }
  const foundAtLoc = detail?.foundAt
    ? BOARD_NODES.find(n => n.kind === "location" && n.refId === detail.foundAt)
    : undefined;
  const locationsToShow = foundAtLoc
    ? [foundAtLoc, ...connectedLocations.filter(l => l.id !== foundAtLoc.id)]
    : connectedLocations;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/95 overflow-y-auto"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bg-black/70 ring-1 ring-neutral-700 hover:bg-neutral-900 hover:ring-neutral-500 text-neutral-300 hover:text-white flex items-center justify-center text-lg leading-none"
      >
        ×
      </button>

      {detail?.image && (
        <div className="relative w-full h-[40vh] noir-vignette">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={detail.image} alt={detail.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
        </div>
      )}

      <motion.div
        className={`max-w-2xl mx-auto px-6 py-8 space-y-6 relative ${detail?.image ? "-mt-12" : "pt-24"}`}
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div>
          <h2 className="font-fell text-3xl sm:text-4xl text-neutral-50 leading-tight">
            {isEvidence ? detail?.name : row.text}
          </h2>
        </div>

        {isEvidence && detail?.significance && (
          <p className="text-base text-neutral-200 leading-relaxed">{detail.significance}</p>
        )}

        {connectedPeople.length > 0 && (
          <RelatedCards title="Connected to" nodes={connectedPeople} onItem={onClose} />
        )}
        {locationsToShow.length > 0 && (
          <RelatedCards title="Found at" nodes={locationsToShow} onItem={onClose} />
        )}

        <div className="flex flex-wrap gap-2 pt-4">
          <button
            onClick={() => (isPinned ? unpinImportant(row.id) : pinImportant(row.id))}
            className={`font-elite text-[11px] uppercase tracking-wider rounded px-4 py-2 ring-1 transition ${
              isPinned
                ? "bg-rose-900/50 ring-rose-700 text-rose-100"
                : "ring-neutral-700 hover:bg-neutral-800 text-neutral-300"
            }`}
          >
            {isPinned ? "★ pinned" : "☆ pin important"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RelatedCards({
  title,
  nodes,
  onItem,
}: {
  title: string;
  nodes: BoardNode[];
  onItem: () => void;
}) {
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
