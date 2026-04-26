import Link from "next/link";
import { loadCase } from "@/lib/case";

// === Cases — newspaper-style home ===
//
// Recreated from the Blackfile design system (claude.ai/design).
// Three sections: CURRENT (active case, lead story), ARCHIVE (closed),
// COMING UP (locked / future cases). Player taps "Resume Investigation"
// on the current case → /board.

const ARCHIVE = [
  {
    id: "BF-002",
    kicker: "CASE CLOSED",
    headline: "The Last Train\nto Pellham",
    log: "Conductor confessed after the lighter was traced back to his daughter.",
    dateline: "Pellham — 02 Feb",
    cover: "train" as const,
  },
  {
    id: "BF-001",
    kicker: "CASE CLOSED",
    headline: "The Belmont\nFire",
    log: "Insurance fraud uncovered after the diary surfaced six weeks late.",
    dateline: "Belmont — 18 Jan",
    cover: "fire" as const,
  },
];

const UPCOMING = [
  { id: "BF-004", release: "Releases · 28 Mar", tag: "Sealed" },
  { id: "BF-005", release: "Releases · 11 Apr", tag: "Sealed" },
  { id: "BF-006", release: "Releases · 25 Apr", tag: "Sealed" },
];

export default async function Home() {
  const ground = await loadCase();
  const current = {
    id: "BF-003",
    kicker: "OPEN INVESTIGATION",
    headline: ground.meta.title,
    log: ground.briefing.opening_scene,
    dateline: "Millbrook — 14 Mar",
    progress: 0,
    cover: "desk" as const,
    coverImage: "/bakery.png",
  };

  return (
    <main
      className="min-h-screen relative noir-grain"
      style={{ background: "var(--bg)", color: "var(--fg)" }}
    >
      <div className="max-w-xl mx-auto px-[18px] pt-1 pb-32 relative z-[1]">
        {/* Masthead — hero image */}
        <div
          className="-mx-[18px] relative aspect-[3/2] overflow-hidden"
          style={{
            background: "#0a0806",
            borderBottom: "1px solid rgba(232,225,211,0.15)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/blackfile-hero.png"
            alt="Blackfile"
            className="w-full h-full block object-cover"
          />
          <div
            className="absolute left-0 right-0 bottom-0 h-[60px] pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(14,12,10,0) 0%, rgba(14,12,10,0.95) 100%)",
            }}
          />
        </div>

        {/* CURRENT */}
        <SectionLabel left="Current" right="On your desk" />
        <CurrentStory data={current} />

        {/* ARCHIVE */}
        <SectionLabel left="Archive" right={`${ARCHIVE.length} closed`} />
        <div className="flex flex-col gap-[18px]">
          {ARCHIVE.map(c => <ArchiveStory key={c.id} data={c} />)}
        </div>

        {/* COMING UP */}
        <SectionLabel left="Coming up" right="Locked" />
        <div className="flex flex-col gap-2">
          {UPCOMING.map(c => <UpcomingRow key={c.id} data={c} />)}
        </div>
      </div>
    </main>
  );
}

function SectionLabel({ left, right }: { left: string; right: string }) {
  return (
    <div
      className="flex items-center gap-[10px] my-[28px] mb-[14px] py-[6px] px-[2px] font-elite uppercase"
      style={{
        borderTop: "1px solid rgba(232,225,211,0.18)",
        borderBottom: "1px solid rgba(232,225,211,0.18)",
        fontSize: 9,
        letterSpacing: "0.4em",
        color: "rgba(232,225,211,0.5)",
      }}
    >
      <span style={{ color: "rgba(232,225,211,0.85)" }}>{left}</span>
      <span className="flex-1 h-px" style={{ background: "rgba(232,225,211,0.1)" }} />
      <span>{right}</span>
    </div>
  );
}

type CurrentData = {
  id: string;
  kicker: string;
  headline: string;
  log: string;
  dateline: string;
  progress: number;
  cover: "desk" | "train" | "fire";
  coverImage?: string;
};

function CurrentStory({ data }: { data: CurrentData }) {
  const { id, kicker, headline, log, dateline, progress, cover, coverImage } = data;
  return (
    <article>
      <div
        className="flex items-center gap-2 font-elite uppercase"
        style={{
          fontSize: 9,
          letterSpacing: "0.32em",
          color: "var(--accent)",
        }}
      >
        <span
          className="w-[5px] h-[5px] rounded-full"
          style={{ background: "var(--accent)" }}
        />
        <span>{kicker}</span>
        <span
          className="flex-1 h-px"
          style={{ background: "rgba(232,225,211,0.12)" }}
        />
        <span style={{ color: "rgba(232,225,211,0.45)" }}>FILE {id}</span>
      </div>

      <h2
        className="font-fell whitespace-pre-line"
        style={{
          fontWeight: 700,
          fontSize: 28,
          lineHeight: 1.05,
          letterSpacing: "0.005em",
          margin: "12px 0 0",
          color: "var(--fg)",
        }}
      >
        {headline}
      </h2>

      <div className="mt-[14px]">
        {coverImage ? (
          <CoverPhoto src={coverImage} alt={headline} aspect="16/10" />
        ) : (
          <CoverPlaceholder kind={cover} aspect="16/10" status="in-progress" />
        )}
      </div>

      <div
        className="font-elite uppercase mt-[14px]"
        style={{
          fontSize: 9,
          letterSpacing: "0.22em",
          color: "rgba(232,225,211,0.55)",
        }}
      >
        {dateline}
      </div>

      <p
        className="italic mt-[6px]"
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: "rgba(232,225,211,0.85)",
        }}
      >
        {log}
      </p>

      <div className="mt-[14px] flex items-center gap-[10px]">
        <div
          className="flex-1 overflow-hidden"
          style={{ height: 2, background: "rgba(232,225,211,0.1)" }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "var(--accent)",
            }}
          />
        </div>
        <div
          className="font-elite uppercase text-right"
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "var(--accent)",
            minWidth: 40,
          }}
        >
          {progress}%
        </div>
      </div>

      <Link
        href="/board"
        className="block text-center mt-4 w-full font-elite uppercase"
        style={{
          padding: "12px 14px",
          background: "transparent",
          border: "1px solid rgba(232,225,211,0.35)",
          color: "var(--fg)",
          fontSize: 11,
          letterSpacing: "0.32em",
          fontWeight: 500,
        }}
      >
        Resume Investigation
      </Link>
    </article>
  );
}

type ArchiveData = {
  id: string;
  kicker: string;
  headline: string;
  log: string;
  dateline: string;
  cover: "desk" | "train" | "fire";
};

function ArchiveStory({ data }: { data: ArchiveData }) {
  const { id, kicker, headline, log, dateline, cover } = data;
  return (
    <article className="grid gap-3" style={{ gridTemplateColumns: "92px 1fr" }}>
      <CoverPlaceholder kind={cover} aspect="1/1" status="solved" />
      <div>
        <div
          className="flex items-center gap-1.5 font-elite uppercase"
          style={{
            fontSize: 8.5,
            letterSpacing: "0.3em",
            color: "rgba(232,225,211,0.55)",
          }}
        >
          <span>{kicker}</span>
          <span>·</span>
          <span style={{ color: "rgba(232,225,211,0.4)" }}>FILE {id}</span>
        </div>
        <h3
          className="font-fell whitespace-pre-line"
          style={{
            fontWeight: 600,
            fontSize: 18,
            lineHeight: 1.1,
            letterSpacing: "0.005em",
            margin: "6px 0 0",
            color: "rgba(232,225,211,0.85)",
          }}
        >
          {headline}
        </h3>
        <div
          className="font-elite uppercase mt-1.5"
          style={{
            fontSize: 8.5,
            letterSpacing: "0.22em",
            color: "rgba(232,225,211,0.45)",
          }}
        >
          {dateline}
        </div>
        <p
          className="italic mt-1.5"
          style={{
            fontSize: 12.5,
            lineHeight: 1.45,
            color: "rgba(232,225,211,0.6)",
          }}
        >
          {log}
        </p>
      </div>
    </article>
  );
}

function UpcomingRow({ data }: { data: { id: string; release: string; tag: string } }) {
  const { id, release, tag } = data;
  return (
    <div
      className="grid items-center gap-3"
      style={{
        gridTemplateColumns: "64px 1fr auto",
        padding: "10px 12px",
        border: "1px solid rgba(232,225,211,0.1)",
        background: "rgba(232,225,211,0.02)",
      }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 64,
          height: 64,
          background:
            "repeating-linear-gradient(45deg, rgba(232,225,211,0.05) 0 4px, transparent 4px 8px), #14110d",
          border: "1px solid rgba(232,225,211,0.08)",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect
            x="5" y="9" width="12" height="10"
            stroke="rgba(232,225,211,0.45)" strokeWidth="1.3"
            fill="rgba(20,17,13,0.6)"
          />
          <path
            d="M7 9V6.5a4 4 0 018 0V9"
            stroke="rgba(232,225,211,0.45)" strokeWidth="1.3" fill="none"
          />
        </svg>
      </div>
      <div>
        <div
          className="font-fell"
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "rgba(232,225,211,0.5)",
            letterSpacing: "0.05em",
          }}
        >
          FILE {id}
        </div>
        <div
          className="italic"
          style={{
            fontSize: 12.5,
            color: "rgba(232,225,211,0.35)",
            marginTop: 2,
          }}
        >
          {release}
        </div>
      </div>
      <div
        className="font-elite uppercase"
        style={{
          fontSize: 9,
          letterSpacing: "0.32em",
          color: "rgba(232,225,211,0.4)",
          border: "1px solid rgba(232,225,211,0.18)",
          padding: "4px 8px",
        }}
      >
        {tag}
      </div>
    </div>
  );
}

function CoverPhoto({ src, alt, aspect }: { src: string; alt: string; aspect: string }) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: aspect,
        background: "#1a1612",
        border: "1px solid rgba(232,225,211,0.12)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 30px rgba(0,0,0,0.7)" }}
      />
    </div>
  );
}

function CoverPlaceholder({
  kind,
  aspect,
  status,
}: {
  kind: "desk" | "train" | "fire";
  aspect: string;
  status: "in-progress" | "solved" | "abandoned";
}) {
  const dim = status === "abandoned" ? 0.4 : status === "solved" ? 0.65 : 1;
  const filter =
    status === "solved"
      ? "grayscale(0.7) brightness(0.85)"
      : status === "abandoned"
      ? "grayscale(1) brightness(0.7)"
      : "none";
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: aspect,
        background: "#1a1612",
        border: "1px solid rgba(232,225,211,0.12)",
        filter,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 120"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, opacity: dim }}
      >
        <defs>
          <pattern
            id={`hatch-${kind}`}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0" y1="0" x2="0" y2="6"
              stroke="rgba(232,225,211,0.07)" strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="200" height="120" fill="#1a1612" />
        <rect width="200" height="120" fill={`url(#hatch-${kind})`} />
        {kind === "desk" && (
          <g>
            <rect x="20" y="60" width="160" height="50" fill="rgba(232,225,211,0.08)" />
            <rect x="30" y="35" width="40" height="30" fill="rgba(232,225,211,0.06)" />
            <circle cx="150" cy="48" r="8" fill="rgba(201,165,72,0.35)" />
            <line x1="150" y1="56" x2="150" y2="68" stroke="rgba(232,225,211,0.18)" strokeWidth="1" />
            <rect
              x="100" y="62" width="20" height="20"
              fill="none" stroke="rgba(168,57,46,0.65)"
              strokeDasharray="3,2" strokeWidth="1"
            />
          </g>
        )}
        {kind === "train" && (
          <g>
            <rect x="0" y="58" width="200" height="3" fill="rgba(232,225,211,0.18)" />
            <rect x="0" y="62" width="200" height="3" fill="rgba(232,225,211,0.1)" />
            <rect x="40" y="30" width="120" height="32" fill="rgba(232,225,211,0.1)" />
            {[50, 80, 110, 140].map(x => (
              <rect key={x} x={x} y="36" width="20" height="14" fill="rgba(232,225,211,0.05)" />
            ))}
            <circle cx="60" cy="68" r="5" fill="rgba(232,225,211,0.18)" />
            <circle cx="140" cy="68" r="5" fill="rgba(232,225,211,0.18)" />
          </g>
        )}
        {kind === "fire" && (
          <g>
            <rect x="20" y="50" width="160" height="60" fill="rgba(232,225,211,0.06)" />
            <rect x="40" y="65" width="20" height="30" fill="rgba(20,16,12,0.9)" />
            <rect x="80" y="60" width="20" height="35" fill="rgba(20,16,12,0.9)" />
            <rect x="120" y="68" width="20" height="27" fill="rgba(20,16,12,0.9)" />
            <path
              d="M0 30 Q 50 20 100 28 T 200 26 L 200 50 L 0 50 Z"
              fill="rgba(168,57,46,0.18)"
            />
          </g>
        )}
      </svg>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 30px rgba(0,0,0,0.6)" }}
      />
      {status === "solved" && (
        <div
          className="absolute font-elite uppercase"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-12deg)",
            padding: "3px 8px",
            border: "1.5px solid rgba(232,225,211,0.55)",
            color: "rgba(232,225,211,0.78)",
            fontSize: 9,
            letterSpacing: "0.3em",
            fontWeight: 600,
            background: "rgba(14,12,10,0.5)",
          }}
        >
          Closed
        </div>
      )}
    </div>
  );
}
