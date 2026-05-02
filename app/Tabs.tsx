"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Bottom-floating dock per Blackfile design — center pill with two
// uppercase mono tabs. Hidden on /chat (interrogation owns its own UI)
// and on /location (the location screen has its own back gesture).

const tabs = [
  { href: "/board", label: "BOARD" },
  { href: "/casebook", label: "CASEBOOK" },
];

export default function Tabs() {
  const pathname = usePathname() ?? "";

  // Tabs are scoped to the investigation surfaces only.
  const showOn =
    pathname === "/board" ||
    pathname === "/casebook" ||
    pathname.startsWith("/board/") ||
    pathname.startsWith("/casebook/");
  if (!showOn) return null;

  return (
    <div
      className="fixed inset-x-0 z-30 flex justify-center pointer-events-none"
      style={{ bottom: 0, padding: "14px 0 24px" }}
    >
      <div
        className="flex pointer-events-auto"
        style={{
          gap: 4,
          background: "rgba(14,12,10,0.88)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(232,225,211,0.16)",
          padding: "12px 22px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.55)",
        }}
      >
        {tabs.map(t => {
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className="font-elite uppercase relative"
              style={{
                fontSize: 11,
                letterSpacing: "0.36em",
                color: active ? "var(--fg)" : "rgba(232,225,211,0.45)",
                padding: "6px 22px",
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
