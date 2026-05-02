"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getState, type PlayerState } from "@/lib/player-state";
import { BOARD_NODES, visibleNodes } from "@/lib/board-graph";

// Top-anchored notification toast stack. Falls in from above when a new
// evidence is discovered, a new location unlocks, or a new person becomes
// available on the board. Auto-dismisses after a short delay; multiple
// triggers in quick succession stack vertically.

type Notif = {
  id: string;
  kind: "evidence" | "location" | "person";
  title: string;
};

const LABEL: Record<Notif["kind"], string> = {
  evidence: "New evidence",
  location: "New location",
  person: "New witness",
};

const DOT: Record<Notif["kind"], string> = {
  evidence: "var(--accent)",
  location: "#c9a548",
  person: "#5a7a8c",
};

const TTL_MS = 4500;

export default function Notifications({
  evidenceNames,
  locationNames,
}: {
  evidenceNames: Record<string, string>;
  locationNames: Record<string, string>;
}) {
  const [items, setItems] = useState<Notif[]>([]);
  const prevRef = useRef<PlayerState | null>(null);
  const visiblePeopleRef = useRef<Set<string>>(new Set());
  const initRef = useRef(false);
  // Stagger reveals so a burst of 3+ events drops in like a stair-step
  // instead of slamming the player with everything at once.
  const STAGGER_MS = 180;

  useEffect(() => {
    function sync() {
      const cur = getState();
      const prev = prevRef.current;
      const newNotifs: Notif[] = [];
      const stamp = Date.now();

      if (prev) {
        for (const id of cur.discoveredEvidence) {
          if (!prev.discoveredEvidence.includes(id)) {
            newNotifs.push({
              id: `ev-${id}-${stamp}`,
              kind: "evidence",
              title: evidenceNames[id] ?? id,
            });
          }
        }
        for (const id of cur.unlockedLocations) {
          if (!prev.unlockedLocations.includes(id)) {
            newNotifs.push({
              id: `loc-${id}-${stamp}`,
              kind: "location",
              title: locationNames[id] ?? id,
            });
          }
        }
      }

      const currentPeople = new Set(
        visibleNodes(cur)
          .filter(n => n.kind === "person")
          .map(n => n.id),
      );
      if (initRef.current) {
        for (const id of currentPeople) {
          if (!visiblePeopleRef.current.has(id)) {
            const node = BOARD_NODES.find(n => n.id === id);
            if (node) {
              newNotifs.push({
                id: `p-${id}-${stamp}`,
                kind: "person",
                title: node.label,
              });
            }
          }
        }
      }
      visiblePeopleRef.current = currentPeople;

      if (newNotifs.length) {
        // Reveal each notification with a stagger so a burst falls in like
        // a stair-step. Cap visible stack to 5 — older items drop off.
        newNotifs.forEach((n, i) => {
          window.setTimeout(() => {
            setItems(curr => [...curr, n].slice(-5));
          }, i * STAGGER_MS);
        });
      }
      prevRef.current = cur;
      initRef.current = true;
    }

    sync();
    window.addEventListener("td-state-change", sync);
    return () => window.removeEventListener("td-state-change", sync);
  }, [evidenceNames, locationNames]);

  // Auto-dismiss: the entire stack disappears together once nothing new
  // has arrived for TTL_MS. New notifications during the wait reset the
  // timer, so a burst of evidence + locations + people groups into one
  // toast that's visible long enough to read, then collapses at once.
  useEffect(() => {
    if (!items.length) return;
    const t = setTimeout(() => setItems([]), TTL_MS);
    return () => clearTimeout(t);
  }, [items]);

  return (
    <div
      className="fixed inset-x-0 z-[80] flex justify-center pointer-events-none"
      style={{ top: 0, paddingTop: 14 }}
    >
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            key="notif-stack"
            layout
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="pointer-events-auto"
            style={{
              maxWidth: "92vw",
              background: "rgba(8,6,4,0.92)",
              border: "1px solid rgba(232,225,211,0.18)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
              padding: "6px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <AnimatePresence initial={false}>
              {items.map(n => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    className="font-elite uppercase"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 9,
                      letterSpacing: "0.24em",
                      lineHeight: 1.4,
                      padding: "2px 0",
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 999,
                        background: DOT[n.kind],
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: "rgba(232,225,211,0.5)", flexShrink: 0 }}>
                      {LABEL[n.kind]}
                    </span>
                    <span
                      style={{
                        color: "var(--fg)",
                        textTransform: "none",
                        letterSpacing: "0.01em",
                        fontFamily: "var(--font-ui), sans-serif",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        minWidth: 0,
                      }}
                    >
                      {n.title}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
