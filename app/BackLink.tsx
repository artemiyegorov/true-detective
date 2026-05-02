"use client";

import Link from "next/link";

// Always-fixed back link in the top-left corner. Same position, same
// styling across every screen so it doesn't jump when the player
// navigates from board → location → person → chat.

export function BackLink({
  href,
  label,
  onClick,
}: {
  /** href when this is a real navigation */
  href?: string;
  /** label after the arrow — e.g. "BOARD", "CASES" */
  label: string;
  /** when provided, renders a button instead (used by modal-close) */
  onClick?: () => void;
}) {
  // Subtle dark backdrop pill so the link stays legible over any
  // background (including the parallax-scrolling photo on /location).
  const sharedStyle: React.CSSProperties = {
    position: "fixed",
    top: 14,
    left: 14,
    zIndex: 60,
    fontSize: 10,
    letterSpacing: "0.32em",
    color: "var(--fg)",
    padding: "8px 12px",
    background: "rgba(8,6,4,0.55)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    border: "1px solid rgba(232,225,211,0.12)",
    textDecoration: "none",
    lineHeight: 1,
  };

  const className = "font-elite uppercase";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} style={sharedStyle}>
        ← {label}
      </button>
    );
  }
  return (
    <Link href={href ?? "/"} className={className} style={sharedStyle}>
      ← {label}
    </Link>
  );
}
