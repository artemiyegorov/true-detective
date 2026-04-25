import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-neutral-950 text-neutral-100">
      <div className="max-w-xl space-y-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Case File #247</p>
        <h1 className="text-4xl font-serif">Death at the Bakery</h1>
        <p className="text-neutral-400">
          Five people had reasons. One of them did it. Build your case.
        </p>
        <div className="pt-4 flex flex-col gap-3 items-center">
          <Link
            href="/chat/tom"
            className="rounded-md bg-neutral-100 text-neutral-900 px-5 py-2.5 text-sm font-medium hover:bg-white transition"
          >
            Interview: Tom Brennan →
          </Link>
          <p className="text-xs text-neutral-600">Slice 1 — single-NPC chat with voice</p>
        </div>
      </div>
    </main>
  );
}
