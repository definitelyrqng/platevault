export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
            <span className="text-sm font-semibold">PV</span>
          </div>
          <div>
            <div className="text-lg font-semibold leading-none">PlateVault</div>
            <div className="text-xs text-zinc-400">
              Modern license plate spotting
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <a
            href="/upload"
            className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
          >
            Upload
          </a>
          <span className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-400">
            Sign in (soon)
          </span>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-14 pt-6">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Spot. Tag. Archive.
        </h1>

        <p className="mt-3 max-w-2xl text-zinc-400">
          A modern license plate spotting gallery inspired by real-world plate
          culture. Upload photos, browse by registration, and explore country-accurate
          plate types — without clutter.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {/* Upload */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="text-sm text-zinc-400">Upload</div>
            <div className="mt-1 text-lg font-semibold">Spot a license plate</div>
            <p className="mt-2 text-sm text-zinc-400">
              Choose a country, select the correct plate type, upload a photo —
              done in seconds.
            </p>
            <a
              href="/upload"
              className="mt-4 inline-flex rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
            >
              Upload a spot
            </a>
          </div>

          {/* Browse */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="text-sm text-zinc-400">Browse</div>
            <div className="mt-1 text-lg font-semibold">Explore by plate</div>
            <p className="mt-2 text-sm text-zinc-400">
              Find vehicles by registration number, country, plate type, and tags
              (search coming soon).
            </p>
            <span className="mt-4 inline-flex rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-300">
              Browse gallery (soon)
            </span>
          </div>

          {/* Rules */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="text-sm text-zinc-400">Rules</div>
            <div className="mt-1 text-lg font-semibold">Respect privacy</div>
            <p className="mt-2 text-sm text-zinc-400">
              Broad locations only — “Karlsplatz, Munich” is fine. No street names
              or exact addresses.
            </p>
            <span className="mt-4 inline-flex rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-300">
              Community-first
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
