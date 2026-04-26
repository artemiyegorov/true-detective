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

  // Hide the tab bar where it doesn't fit the design.
  if (pathname.startsWith("/chat") || pathname.startsWith("/location")) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 z-30 flex justify-center pointer-events-none"
      style={{ bottom: 0, padding: "14px 0 24px" }}
    >
      <div
        className="flex gap-1 pointer-events-auto"
        style={{
          background: "rgba(20,18,15,0.85)",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(232,225,211,0.18)",
          padding: "8px 6px",
          boxShadow: "0 6px 18px rgba(0,0,0,0.5)",
        }}
      >
        {tabs.map(t => {
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className="font-elite uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.32em",
                color: active ? "var(--fg)" : "rgba(232,225,211,0.5)",
                padding: "6px 16px",
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
