"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";
import {
  getState,
  pinImportant,
  unpinImportant,
  type PlayerState,
} from "@/lib/player-state";
import { BOARD_EDGES, BOARD_NODES, type BoardNode } from "@/lib/board-graph";
import RelatedPolaroid from "../RelatedPolaroid";

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

  const totalEntries = state.discoveredEvidence.length;
  const starredCount = state.importantClues.length;

  return (
    <div className="relative min-h-screen noir-grain" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      {/* Top back link */}
      <div className="absolute top-0 inset-x-0 h-14 z-10 flex items-end" style={{ padding: "0 18px 8px" }}>
        <Link
          href="/"
          className="font-elite uppercase"
          style={{ fontSize: 10, letterSpacing: "0.32em", color: "var(--fg)", padding: 4 }}
        >
          ← cases
        </Link>
      </div>

      <div className="relative z-[2]" style={{ padding: "74px 18px 110px" }}>
        <div
          className="font-elite uppercase"
          style={{ fontSize: 9, letterSpacing: "0.32em", color: "rgba(232,225,211,0.45)" }}
        >
          {totalEntries} entries{starredCount ? ` · ${starredCount} starred` : ""}
        </div>

        <h1
          className="font-fell uppercase"
          style={{
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: "0.08em",
            margin: "8px 0 0",
          }}
        >
          Casebook
        </h1>

        {/* 22×1 oxblood rule */}
        <div style={{ width: 22, height: 1, background: "var(--accent)", marginTop: 14 }} />

        {/* Filters: All / Starred */}
        <div
          className="flex"
          style={{
            marginTop: 22,
            gap: 18,
            paddingBottom: 16,
            borderBottom: "1px solid rgba(232,225,211,0.12)",
          }}
        >
          {(["all", "important"] as const).map(f => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="font-elite uppercase inline-flex items-center"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  gap: 6,
                  paddingBottom: 4,
                  color: active ? "var(--accent)" : "rgba(232,225,211,0.5)",
                  borderBottom: `1px solid ${active ? "var(--accent)" : "transparent"}`,
                }}
              >
                {f === "important" && (
                  <Star
                    size={10}
                    strokeWidth={1.6}
                    className={active ? "fill-[var(--accent)]" : ""}
                  />
                )}
                {f === "all" ? "All" : "Starred"}
              </button>
            );
          })}
        </div>

        {/* Cards */}
        <div className="flex flex-col" style={{ marginTop: 16, gap: 10 }}>
          {rows.length === 0 ? (
            <p className="italic" style={{ fontSize: 14, color: "rgba(232,225,211,0.45)" }}>
              {filter === "important"
                ? "Nothing pinned as important yet."
                : "Nothing in your casebook yet. Investigate locations and talk to people."}
            </p>
          ) : (
            rows.map(r => (
              <CasebookRowItem
                key={r.id}
                row={r}
                isPinned={state.importantClues.includes(r.id)}
                onOpen={() => setOpenItem(r)}
                onToggleStar={() => {
                  if (state.importantClues.includes(r.id)) unpinImportant(r.id);
                  else pinImportant(r.id);
                }}
              />
            ))
          )}
        </div>
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
  onToggleStar,
}: {
  row: ClueRow;
  isPinned: boolean;
  onOpen: () => void;
  onToggleStar: () => void;
}) {
  if (row.kind !== "evidence") return null;
  const sourceLabel = row.detail.foundAt
    ? `Found · ${row.detail.foundAt.replace(/^loc_/, "").replace(/_/g, " ")}`
    : "Casebook";

  return (
    <div
      className="relative flex items-start"
      style={{
        background: "rgba(232,225,211,0.04)",
        border: "1px solid rgba(232,225,211,0.08)",
        padding: "14px 14px 14px 18px",
        gap: 12,
      }}
    >
      {/* red left bar */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: 10,
          bottom: 10,
          width: 3,
          background: isPinned ? "var(--accent)" : "rgba(168,57,46,0.5)",
        }}
      />
      <button
        onClick={onOpen}
        className="flex-1 min-w-0 text-left bg-transparent border-0 p-0"
      >
        <div
          className="font-fell"
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--fg)",
            lineHeight: 1.25,
            letterSpacing: "0.01em",
          }}
        >
          {row.detail.name}
        </div>
        {row.detail.significance && (
          <div
            className="italic"
            style={{
              fontSize: 13.5,
              color: "rgba(232,225,211,0.55)",
              marginTop: 6,
              lineHeight: 1.4,
            }}
          >
            {row.detail.significance}
          </div>
        )}
        <div
          className="font-elite uppercase"
          style={{
            fontSize: 9,
            letterSpacing: "0.22em",
            color: "rgba(232,225,211,0.4)",
            marginTop: 8,
          }}
        >
          {sourceLabel}
        </div>
      </button>
      <button
        onClick={onToggleStar}
        aria-label={isPinned ? "Unstar" : "Star"}
        className="bg-transparent border-0 flex items-center"
        style={{ padding: 4, color: isPinned ? "var(--accent)" : "rgba(232,225,211,0.4)" }}
      >
        <Star
          size={16}
          strokeWidth={1.4}
          className={isPinned ? "fill-current" : ""}
        />
      </button>
    </div>
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
      className="fixed inset-0 z-50 overflow-y-auto noir-grain"
      style={{ background: "var(--bg)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Top action row: breadcrumb left, star + close (38×38 squares) right */}
      <div
        className="fixed inset-x-0 z-50 flex justify-between items-center"
        style={{ top: 0, padding: "20px 18px 0" }}
      >
        <div
          className="font-elite uppercase"
          style={{ fontSize: 9, letterSpacing: "0.32em", color: "rgba(232,225,211,0.5)" }}
        >
          Casebook / {isEvidence ? "Evidence" : "Note"}
        </div>
        <div className="flex" style={{ gap: 10 }}>
          {isEvidence && (
            <button
              type="button"
              onClick={() => (isPinned ? unpinImportant(row.id) : pinImportant(row.id))}
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
              <Star
                size={16}
                strokeWidth={1.4}
                className={isPinned ? "fill-current" : ""}
              />
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

      {detail?.image && (
        <div className="relative w-full h-[40vh] noir-vignette">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={detail.image} alt={detail.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
        </div>
      )}

      <motion.div
        className="max-w-2xl mx-auto relative"
        style={{ padding: "110px 22px 60px" }}
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div
          className="font-elite uppercase"
          style={{ fontSize: 9, letterSpacing: "0.32em", color: "rgba(232,225,211,0.45)" }}
        >
          {isEvidence ? "Physical · " : "Note · "}
          <span style={{ color: "rgba(232,225,211,0.4)" }}>#{row.id.replace(/^ev_|^fact_/, "").toUpperCase()}</span>
        </div>

        <h1
          className="font-fell"
          style={{
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: "0.01em",
            margin: "10px 0 0",
            lineHeight: 1.1,
            color: "var(--fg)",
          }}
        >
          {isEvidence ? detail?.name : row.text}
        </h1>

        {/* 22×1 oxblood rule */}
        <div style={{ width: 22, height: 1, background: "var(--accent)", marginTop: 16 }} />

        {isEvidence && detail?.significance && (
          <p
            style={{
              fontSize: 15.5,
              lineHeight: 1.55,
              color: "rgba(232,225,211,0.88)",
              marginTop: 18,
            }}
          >
            {detail.significance}
          </p>
        )}

        {locationsToShow.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <RelatedCards title="Found at" nodes={locationsToShow} onItem={onClose} />
          </div>
        )}
        {connectedPeople.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <RelatedCards title="Connections" nodes={connectedPeople} onItem={onClose} />
          </div>
        )}

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
      <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3">
        {title}
      </p>
      <div className="flex flex-wrap gap-3">
        {nodes.map(n => <RelatedPolaroid key={n.id} node={n} onClick={onItem} />)}
      </div>
    </div>
  );
}

