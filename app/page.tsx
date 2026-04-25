import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 noir-vignette noir-grain">
      <div className="max-w-xl space-y-6 text-center">
        <p className="font-elite text-xs uppercase tracking-[0.4em] text-neutral-500">Case File #247</p>
        <h1 className="font-fell text-5xl text-neutral-100">Death at the Bakery</h1>
        <p className="font-fell italic text-neutral-400 text-lg">
          Five people had reasons. One of them did it. Build your case.
        </p>
        <div className="pt-4 grid gap-3">
          <Link
            href="/board"
            className="rounded-md bg-neutral-100 text-neutral-900 px-5 py-2.5 font-elite uppercase tracking-wider text-sm hover:bg-white transition"
          >
            Open the board →
          </Link>
          <p className="font-elite text-[10px] uppercase tracking-[0.3em] text-neutral-700 pt-2">
            people · places · clues
          </p>
        </div>
      </div>
    </main>
  );
}
