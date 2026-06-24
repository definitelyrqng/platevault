"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[calc(100vh-96px)] grid place-items-center px-6">
      <div className="text-center max-w-md">

        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-500 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
          500
        </div>

        <div className="font-mono text-6xl font-black tracking-widest text-zinc-800 mb-4 select-none">
          PV–500
        </div>

        <h1 className="text-2xl font-bold text-zinc-100 mb-2">
          Something went wrong on our end.
        </h1>
        <p className="text-sm text-zinc-500 leading-relaxed mb-8">
          We broke something. Not you — us. Our team is either already on it or completely unaware,
          but either way, try again and it'll probably be fine.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Try again
          </button>
          <a
            href="/home"
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 transition-colors"
          >
            Go home
          </a>
        </div>

        {error.digest && (
          <p className="mt-8 font-mono text-xs text-zinc-700">
            ref: {error.digest}
          </p>
        )}

        <p className="mt-3 text-xs text-zinc-700">
          Still broken?{" "}
          <a href="/contact" className="text-zinc-600 hover:text-indigo-400 transition-colors underline underline-offset-2">
            Let us know
          </a>
          .
        </p>

      </div>
    </main>
  );
}
