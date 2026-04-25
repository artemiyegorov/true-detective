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
        <div className="pt-4 grid gap-3">
          <Link
            href="/map"
            className="rounded-md bg-neutral-100 text-neutral-900 px-5 py-2.5 text-sm font-medium hover:bg-white transition"
          >
            Open the case map →
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/chat/tom"
              className="rounded-md bg-neutral-900 ring-1 ring-neutral-800 px-4 py-2 text-sm hover:bg-neutral-800 transition"
            >
              Interview Tom
            </Link>
            <Link
              href="/chat/sarah"
              className="rounded-md bg-neutral-900 ring-1 ring-neutral-800 px-4 py-2 text-sm hover:bg-neutral-800 transition"
            >
              Interview Sarah
            </Link>
          </div>
          <p className="text-xs text-neutral-600 pt-2">
            slice 1 demo · Tom + Sarah · map · 5 locations
          </p>
        </div>
      </div>
    </main>
  );
}
