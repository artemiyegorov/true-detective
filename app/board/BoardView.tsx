"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import {
  getState,
  pinImportant,
  resetBoardLayout,
  resetPlayerState,
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
import RelatedPolaroid from "../RelatedPolaroid";
import { BackLink } from "../BackLink";
import Accusation from "../Accusation";

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
  groundTruth,
}: {
  evidenceById: Record<string, ClueDetail>;
  factsById: Record<string, string>;
  caseTitle: string;
  groundTruth: import("@/lib/case").AccusationGroundTruth;
}) {
  const router = useRouter();
  const [state, setState] = useState<PlayerState | null>(null);
  const [openNode, setOpenNode] = useState<BoardNode | null>(null);
  const [showImportant, setShowImportant] = useState(false);
  const [showVerdictReplay, setShowVerdictReplay] = useState(false);

  // Locations skip the dossier — clicking a location card on the board
  // takes the player straight into the scene.
  function handleNodeClick(node: BoardNode) {
    if (node.kind === "location" && node.href) {
      router.push(node.href);
      return;
    }
    setOpenNode(node);
  }

  useEffect(() => {
    setState(getState());
    const handler = () => setState(getState());
    window.addEventListener("td-state-change", handler);
    return () => window.removeEventListener("td-state-change", handler);
  }, []);

  const data = useMemo(() => {
    if (!state) return { nodes: [], edges: [], visibleIds: new Set<string>() };
    // Clues live in the Casebook, not on the board. Keep only people +
    // locations on the cork wall. Edges between clue nodes are filtered
    // out automatically by visibleEdges since the clue ids aren't in
    // visibleIds.
    const nodes = visibleNodes(state).filter(n => n.kind !== "clue");
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
      {!openNode && !showImportant && <BackLink href="/" label="cases" />}

      {/* Header — actions only on the right; back is handled by BackLink. */}
      <header className="px-6 py-3 flex items-center justify-end border-b border-[rgba(232,225,211,0.12)] bg-black/60 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          {state.accusation && (
            <button
              onClick={() => setShowVerdictReplay(true)}
              className="font-elite uppercase inline-flex items-center"
              style={{
                fontSize: 10,
                letterSpacing: "0.32em",
                color: "var(--accent)",
                padding: "6px 10px",
                border: "1px solid rgba(168,57,46,0.6)",
                gap: 8,
              }}
              title="View final verdict"
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>⚖</span>
              <span>Verdict</span>
            </button>
          )}
          <button
            onClick={() => {
              if (
                confirm(
                  "Reset the case? This clears all discovered evidence, met witnesses, unlocked locations, pinned clues and card positions — start the investigation from scratch.",
                )
              ) {
                resetPlayerState();
                resetBoardLayout();
                // Re-mount the page so all useEffect-driven state derived
                // from sessionStorage (board layout, briefing flag, etc.)
                // re-reads cleanly.
                if (typeof window !== "undefined") window.location.href = "/board";
              }
            }}
            className="font-elite uppercase"
            style={{ fontSize: 10, letterSpacing: "0.32em", color: "rgba(232,225,211,0.5)", padding: "6px 8px" }}
            title="Reset the entire case to zero"
          >
            reset
          </button>
          <button
            onClick={() => setShowImportant(true)}
            aria-label="Important"
            className="inline-flex items-center gap-2"
            style={{
              border: "1px solid rgba(168,57,46,0.6)",
              padding: "6px 12px",
              color: "var(--accent)",
              height: 36,
            }}
          >
            <Star size={16} strokeWidth={1.6} className="block fill-[var(--accent)]/80 text-[var(--accent)]" />
            <span className="font-elite text-base tabular-nums leading-[16px]">{importantCount}</span>
          </button>
        </div>
      </header>

      {/* Canvas — fills to bottom; the floating pill sits on top of the
          cork board (matches design). */}
      <div className="flex-1 relative overflow-hidden">
        <BoardCanvas
          nodes={data.nodes}
          edges={data.edges}
          state={state}
          onNodeClick={handleNodeClick}
        />
      </div>

      <AnimatePresence>
        {openNode && (
          <DossierPanel
            node={openNode}
            state={state}
            evidenceById={evidenceById}
            caseTitle={caseTitle}
            groundTruth={groundTruth}
            onClose={() => setOpenNode(null)}
          />
        )}
      </AnimatePresence>

      {showVerdictReplay && state.accusation && (
        <Accusation
          accusedNpcId={state.accusation.accusedNpcId}
          accusedName={state.accusation.accusedName}
          accusedRole=""
          accusedPortrait={null}
          groundTruth={groundTruth}
          caseTitle={caseTitle}
          onClose={() => setShowVerdictReplay(false)}
        />
      )}

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
  const cardScale = scaleForCount(nodes.length);
  // Lookup map for edges — they need the *resolved* (post-drag) position
  // of each endpoint, not the original graph default.
  const posById = new Map(positioned.map(p => [p.node.id, p.pos]));

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cork-board"
    >
      {/* SVG strings — endpoints follow the dragged card positions */}
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
          const a = posById.get(e.from);
          const b = posById.get(e.to);
          if (!a || !b) return null;
          return (
            <motion.line
              key={`${e.from}->${e.to}-${i}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
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
            scale={cardScale}
            containerRef={containerRef}
            onClick={() => onNodeClick(node)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Card scale shrinks as the wall fills up so things still fit on
// mobile. Up to 6 cards stay full size; from 7-10 we trim 3% per
// card; past 10 we trim a steeper 5% per card down to a 50% floor.
function scaleForCount(count: number): number {
  if (count <= 6) return 1;
  if (count <= 10) return 1 - (count - 6) * 0.03; // 0.88 at 10
  return Math.max(0.5, 0.88 - (count - 10) * 0.05);
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
  scale,
  containerRef,
  onClick,
}: {
  node: BoardNode;
  pos: { x: number; y: number; rot: number };
  scale: number;
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
      className="absolute cursor-pointer select-none"
      // Framer-motion overwrites the CSS transform when it animates
      // rotate/x/y, which kills the -translate-x/y-1/2 centering. Prepend
      // the centering translate via transformTemplate so the card's
      // center stays anchored at (pos.x%, pos.y%) — matching the SVG
      // string endpoints.
      transformTemplate={(_values, generated) =>
        `translate(-50%, -50%) ${generated}`
      }
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        x: dragX,
        y: dragY,
        rotate: pos.rot,
        zIndex: dragging ? 30 : 1,
      }}
      initial={{ opacity: 0, scale: scale * 0.6 }}
      animate={{ opacity: 1, scale }}
      exit={{ opacity: 0, scale: scale * 0.6 }}
      whileHover={{ scale: scale * 1.06, rotate: 0, zIndex: 20 }}
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
  return "bg-[var(--accent)]"; // clue
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
// Victim cards (no chat target) render as a black "memorial" frame.
function PolaroidCard({ node }: { node: BoardNode }) {
  const initials = (node.label.split(/\s+/).map(p => p[0]).slice(0, 2).join("") || "?").toUpperCase();
  const isVictim = node.kind === "person" && !node.href;
  const frameBg = isVictim ? "bg-[#0a0a0a]" : "bg-[#f3ede0]";
  const captionColor = isVictim ? "text-neutral-200" : "text-[#1a1a1a]";
  return (
    <div
      className={`${frameBg} p-1.5 pb-2 ring-1 ring-black/40 w-[104px]`}
      style={{ boxShadow: "0 8px 18px -4px rgba(0,0,0,0.7), 0 2px 3px rgba(0,0,0,0.5)" }}
    >
      <div className="relative aspect-[3/4] bg-[#1f1d1a] overflow-hidden">
        {node.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={node.image}
            alt={node.label}
            className={`w-full h-full object-cover ${isVictim ? "grayscale brightness-75 contrast-110" : ""}`}
            draggable={false}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center font-fell text-2xl ${isVictim ? "text-neutral-500" : "text-[#f3ede0]/70"}`}>
            {initials}
          </div>
        )}
        <div className="absolute inset-0 mix-blend-multiply opacity-40 pointer-events-none"
             style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)" }} />
        {isVictim && (
          <span className="absolute top-1 right-1 font-elite text-[8px] uppercase tracking-[0.25em] text-[var(--accent)]/80 bg-black/60 px-1 py-0.5 rounded-sm">
            ✝
          </span>
        )}
      </div>
      <p className={`font-fell text-[11px] text-center ${captionColor} mt-1.5 leading-tight truncate`}>
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
      <p className="font-elite text-[8px] uppercase tracking-[0.3em] text-[var(--accent)]/70">
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
      className="relative w-[110px] px-2 py-1.5 bg-[#f0d9b5] ring-1 ring-[var(--accent)]/30"
      style={{
        boxShadow: "0 6px 14px -2px rgba(0,0,0,0.55)",
        clipPath: "polygon(0% 3px, 6px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%)",
      }}
    >
      <p className="font-elite text-[8px] uppercase tracking-[0.3em] text-[var(--accent)]">
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
  clue: "text-[var(--accent)]",
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
  caseTitle,
  groundTruth,
  onClose,
}: {
  node: BoardNode;
  state: PlayerState;
  evidenceById: Record<string, ClueDetail>;
  caseTitle: string;
  groundTruth: import("@/lib/case").AccusationGroundTruth;
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

  // Accusation flow lives at this layer so we can hide the dossier's own
  // back-link and × close while the formal-accusation modal is on top —
  // otherwise they bleed through and overlap "STEP 2 / 2 · FORMAL ACCUSATION".
  const [accusing, setAccusing] = useState(false);

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

  // Person → full-bleed portrait overlay (Blackfile PersonModal pattern).
  // Clue → centered card on dimmed bg.
  if (node.kind === "person") {
    return (
      <motion.div
        className="td-modal-backdrop fixed inset-0 z-50 overflow-hidden sm:flex sm:items-center sm:justify-center sm:py-10"
        style={{
          background: "#0a0604",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
        onClick={onClose}
      >
        {/* Sheet — full-bleed on phone; centered max-w-2xl card with a
            fixed aspect on desktop so the underlying board remains visible
            on the sides. */}
        <div
          className="relative w-full h-full sm:max-w-2xl sm:h-[88vh] sm:rounded-sm sm:border sm:border-[rgba(232,225,211,0.14)] sm:overflow-hidden sm:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)]"
          style={{ background: "#0a0604" }}
          onClick={e => e.stopPropagation()}
        >
        {/* Full-bleed portrait — fills the sheet on every viewport. */}
        <div className="absolute inset-0">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt={node.label}
              className="w-full h-full object-cover object-top"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "#0a0604" }}>
              <span className="font-fell" style={{ fontSize: 96, color: "rgba(232,225,211,0.25)" }}>{initials}</span>
            </div>
          )}
        </div>

        {/* Bottom gradient overlay for legibility */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,6,4,0.05) 0%, rgba(8,6,4,0) 38%, rgba(8,6,4,0.55) 58%, rgba(8,6,4,0.94) 82%, rgba(8,6,4,1) 100%)",
          }}
        />

        {/* Back link — anchored to the sheet's top-left so on desktop it
            sticks to the centered card, not the viewport edge. Hidden
            while the accusation overlay is on top. */}
        {!accusing && <button
          type="button"
          onClick={onClose}
          aria-label="Back to board"
          className="absolute z-[5] font-elite uppercase"
          style={{
            top: 14,
            left: 14,
            fontSize: 10,
            letterSpacing: "0.32em",
            color: "var(--fg)",
            padding: "8px 12px",
            background: "rgba(8,6,4,0.55)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            border: "1px solid rgba(232,225,211,0.12)",
            lineHeight: 1,
          }}
        >
          ← BOARD
        </button>}

        {/* Square close button — top-right. Stays visible during the
            accusation flow so the player can always bail out of the
            modal stack with a single tap. */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute z-[5] flex items-center justify-center"
          style={{
            top: 18,
            right: 18,
            width: 40,
            height: 40,
            background: "rgba(20,16,12,0.55)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(232,225,211,0.18)",
            color: "var(--fg)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        {/* Content overlay */}
        <div
          className="absolute inset-x-0 bottom-0 z-[4] overflow-y-auto"
          style={{ padding: "0 24px 110px", maxHeight: "70vh" }}
        >
          <div
            className="font-elite uppercase"
            style={{ fontSize: 10, letterSpacing: "0.4em", color: "rgba(232,225,211,0.6)", marginBottom: 8 }}
          >
            Person
          </div>
          <h1
            className="font-fell"
            style={{
              fontSize: 34,
              fontWeight: 600,
              color: "#f4ecd8",
              letterSpacing: "0.005em",
              margin: 0,
              lineHeight: 1.05,
              textShadow: "0 2px 12px rgba(0,0,0,0.7)",
            }}
          >
            {node.label}
          </h1>
          {node.role && (
            <p
              className="italic"
              style={{
                fontSize: 16,
                color: "rgba(232,225,211,0.85)",
                margin: "8px 0 0",
                lineHeight: 1.4,
              }}
            >
              {node.role}
            </p>
          )}

          <div
            className="font-elite uppercase"
            style={{
              marginTop: 22,
              fontSize: 9.5,
              letterSpacing: "0.4em",
              color: "rgba(232,225,211,0.5)",
            }}
          >
            What we know
          </div>
          <div style={{ marginTop: 6 }}>
            <DossierKnown
              connectedClues={connectedClues}
              npcReveals={npcReveals}
              evidenceById={evidenceById}
              // Persons without a chat link are non-interactive — i.e.
              // the victim. Show a coroner-summary line instead of the
              // generic "Talk to them or surface evidence" prompt.
              isVictim={node.kind === "person" && !node.href}
            />
          </div>

          {node.href && (
            <Link
              href={node.href}
              onClick={onClose}
              className="font-elite uppercase inline-flex items-center"
              style={{
                marginTop: 22,
                padding: "14px 18px",
                background: "transparent",
                border: "1px solid rgba(232,225,211,0.45)",
                color: "var(--fg)",
                fontSize: 11,
                letterSpacing: "0.32em",
                gap: 10,
              }}
            >
              Open Interview
              <span style={{ display: "inline-block", transform: "translateY(-1px)" }}>→</span>
            </Link>
          )}

          <PersonAccuseButton
            node={node}
            state={state}
            caseTitle={caseTitle}
            groundTruth={groundTruth}
            open={accusing}
            onOpen={() => setAccusing(true)}
            onClose={() => setAccusing(false)}
          />
        </div>
        </div>
      </motion.div>
    );
  }

  // Clue → text-card modal (covered separately by EvidenceDetail style).
  return (
    <motion.div
      className="td-modal-backdrop fixed inset-0 z-50 overflow-y-auto sm:flex sm:items-start sm:justify-center sm:py-10"
      style={{
        background: "var(--bg)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl sm:rounded-sm sm:border sm:border-[rgba(232,225,211,0.14)] sm:overflow-hidden sm:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)]"
        style={{ background: "var(--bg)" }}
        onClick={e => e.stopPropagation()}
      >
      {/* Close button — anchored to the sheet on desktop. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute z-[2] flex items-center justify-center"
        style={{
          top: 18, right: 18, width: 38, height: 38,
          background: "transparent",
          border: "1px solid rgba(232,225,211,0.25)",
          color: "rgba(232,225,211,0.85)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {/* Body */}
      <motion.div
        className="max-w-2xl mx-auto"
        style={{ padding: "110px 22px 110px" }}
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div>
          <p className={`font-elite text-[10px] uppercase tracking-[0.3em] ${KIND_ACCENT[node.kind]}`}>
            {KIND_TAG[node.kind]}
          </p>
          <h2
            className="font-fell"
            style={{ fontSize: 30, fontWeight: 600, letterSpacing: "0.01em", margin: "10px 0 0", lineHeight: 1.1, color: "var(--fg)" }}
          >
            {node.label}
          </h2>
          <div style={{ width: 22, height: 1, background: "var(--accent)", marginTop: 16 }} />
        </div>

        {isClue && clueDetail?.significance && (
          <p
            style={{
              marginTop: 18,
              fontSize: 15.5,
              lineHeight: 1.55,
              color: "rgba(232,225,211,0.88)",
            }}
          >
            {clueDetail.significance}
          </p>
        )}

        {isClue && (connectedPeople.length > 0 || connectedLocations.length > 0 || foundAtLoc) && (
          <div className="space-y-4" style={{ marginTop: 32 }}>
            {(foundAtLoc || connectedLocations.length > 0) && (
              <RelatedRow
                title="Found at"
                nodes={foundAtLoc ? [foundAtLoc, ...connectedLocations.filter(l => l.id !== foundAtLoc.id)] : connectedLocations}
                onItem={onClose}
              />
            )}
            {connectedPeople.length > 0 && (
              <RelatedRow title="Connections" nodes={connectedPeople} onItem={onClose} />
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-4">
          {node.href && (
            <Link
              href={node.href}
              className="font-elite uppercase inline-flex items-center"
              style={{
                marginTop: 22,
                padding: "14px 18px",
                background: "transparent",
                border: "1px solid rgba(232,225,211,0.45)",
                color: "var(--fg)",
                fontSize: 11,
                letterSpacing: "0.32em",
                gap: 10,
              }}
              onClick={onClose}
            >
              {node.kind === "location" ? "Visit Location" : "Open"}
              <span style={{ display: "inline-block", transform: "translateY(-1px)" }}>→</span>
            </Link>
          )}
          {isClue && node.refId && (
            <button
              onClick={() => {
                if (isPinned) unpinImportant(node.refId!);
                else pinImportant(node.refId!);
              }}
              className="font-elite uppercase inline-flex items-center"
              style={{
                marginTop: 22,
                marginLeft: 12,
                padding: "14px 18px",
                background: "transparent",
                border: `1px solid ${isPinned ? "var(--accent)" : "rgba(232,225,211,0.25)"}`,
                color: isPinned ? "var(--accent)" : "rgba(232,225,211,0.7)",
                fontSize: 11,
                letterSpacing: "0.32em",
                gap: 10,
              }}
            >
              <Star size={14} strokeWidth={1.4} className={isPinned ? "fill-current" : ""} />
              <span>{isPinned ? "Starred" : "Star"}</span>
            </button>
          )}
        </div>
      </motion.div>
      </div>
    </motion.div>
  );
}

// Big red ACCUSE button — only on person dossiers, only after at least
// one chat exchange. Mounts the full-screen Accusation flow on click.
// If the player has already accused someone in this session, the button
// is hidden (Reset to start over).
function PersonAccuseButton({
  node,
  state,
  caseTitle,
  groundTruth,
  open,
  onOpen,
  onClose,
}: {
  node: BoardNode;
  state: PlayerState;
  caseTitle: string;
  groundTruth: import("@/lib/case").AccusationGroundTruth;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  if (node.kind !== "person" || !node.refId) return null;
  const alreadyAccused = !!state.accusation;
  const hasMet = state.metNpcs.includes(node.refId);
  const enabled = hasMet && !alreadyAccused;
  return (
    <>
      <button
        type="button"
        onClick={() => enabled && onOpen()}
        disabled={!enabled}
        className="font-elite uppercase block w-full"
        style={{
          marginTop: 16,
          padding: "16px 18px",
          background: enabled ? "var(--accent)" : "rgba(168,57,46,0.18)",
          border: `1px solid ${enabled ? "var(--accent)" : "rgba(168,57,46,0.4)"}`,
          color: enabled ? "#fff" : "rgba(232,225,211,0.45)",
          fontSize: 12,
          letterSpacing: "0.32em",
          fontWeight: 700,
          cursor: enabled ? "pointer" : "not-allowed",
        }}
      >
        Accuse {node.label.split(" ")[0]}
      </button>
      {!hasMet && !alreadyAccused && (
        <p
          className="italic"
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "rgba(232,225,211,0.45)",
            textAlign: "center",
          }}
        >
          Talk to them at least once before formally accusing.
        </p>
      )}
      {alreadyAccused && (
        <p
          className="font-elite uppercase"
          style={{
            marginTop: 8,
            fontSize: 9,
            letterSpacing: "0.32em",
            color: "rgba(232,225,211,0.55)",
            textAlign: "center",
          }}
        >
          Case closed — verdict filed
        </p>
      )}
      {open && node.refId && (
        <Accusation
          accusedNpcId={node.refId}
          accusedName={node.label}
          accusedRole={node.role ?? ""}
          accusedPortrait={node.image ?? null}
          groundTruth={groundTruth}
          caseTitle={caseTitle}
          onClose={onClose}
        />
      )}
    </>
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
      <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3">
        {title}
      </p>
      <div className="flex flex-wrap gap-3">
        {nodes.map(n => <RelatedPolaroid key={n.id} node={n} onClick={onItem} />)}
      </div>
    </div>
  );
}

function DossierKnown({
  connectedClues,
  npcReveals,
  evidenceById,
  isVictim,
}: {
  connectedClues: BoardNode[];
  npcReveals: string[];
  evidenceById: Record<string, ClueDetail>;
  isVictim?: boolean;
}) {
  // Reveal markers (`names_*`, `mentions_*`) are internal gating signals
  // for the board graph — they're not facts the detective "knows" about
  // this person. Strip them before rendering, leave only prose reveals.
  const proseReveals = npcReveals.filter(r => !/^(names|mentions)_/.test(r));
  const hasContent = connectedClues.length > 0 || proseReveals.length > 0;
  return (
    <div>
      {!hasContent && (
        <p className="italic text-sm text-neutral-600">
          {isVictim
            ? "Blunt force trauma to the back of the head. Time of death between 23:00 and 01:00 Sunday."
            : "Nothing yet. Talk to them or surface evidence."}
        </p>
      )}
      {connectedClues.length > 0 && (
        <ul className="text-sm text-neutral-300 space-y-1 mb-2">
          {connectedClues.map(c => {
            const ev = c.refId ? evidenceById[c.refId] : null;
            return (
              <li key={c.id} className="flex gap-2">
                <span className="text-[var(--accent)]">🔍</span>
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
      {proseReveals.length > 0 && (
        <ul className="text-sm text-neutral-300 space-y-1">
          {proseReveals.map((r, i) => (
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
      className="fixed inset-0 z-[70] bg-black/60 flex justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.aside
        className="h-full w-full max-w-sm bg-[#0d0e15] ring-1 ring-[var(--accent)]/40 p-5 overflow-y-auto"
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 32 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-fell text-xl text-[var(--fg)]">Important findings</h2>
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
              <li key={item.id} className="ring-1 ring-[var(--accent)]/50 p-3 bg-[#15161f]">
                <p className="font-elite text-[10px] uppercase tracking-[0.25em] text-[var(--accent)]">
                  Pinned
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
                  className="font-elite text-[10px] uppercase tracking-wider mt-2 text-neutral-500 hover:text-[var(--accent)]"
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
