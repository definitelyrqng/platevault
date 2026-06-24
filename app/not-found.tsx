"use client";

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-96px)] grid place-items-center px-6">
      <div className="text-center max-w-md">

        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-500 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          404
        </div>

        <div className="font-mono text-6xl font-black tracking-widest text-zinc-800 mb-4 select-none">
          PV–404
        </div>

        <h1 className="text-2xl font-bold text-zinc-100 mb-2">
          This plate isn't in the vault.
        </h1>
        <p className="text-sm text-zinc-500 leading-relaxed mb-8">
          The page you're looking for doesn't exist, was moved, or you typed something cursed into the address bar.
          Either way — it's not here.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/home"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Back to spotting
          </a>
          <a
            href="/search"
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 transition-colors"
          >
            Search plates
          </a>
        </div>

        <p className="mt-10 text-xs text-zinc-700">
          If you think this is a mistake, it probably isn't. But feel free to{" "}
          <a href="/contact" className="text-zinc-600 hover:text-indigo-400 transition-colors underline underline-offset-2">
            tell us anyway
          </a>
          .
        </p>

      </div>
    </main>
  );
}
