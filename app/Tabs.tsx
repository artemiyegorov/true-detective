"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/board", label: "Board" },
  { href: "/casebook", label: "Casebook" },
];

export default function Tabs() {
  const pathname = usePathname() ?? "";
  return (
    <nav className="flex items-center gap-1 px-1 py-1 rounded-md bg-black/40 ring-1 ring-neutral-800 backdrop-blur">
      {tabs.map(t => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`font-elite text-[10px] uppercase tracking-[0.25em] px-3 py-1.5 rounded transition ${
              active
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
