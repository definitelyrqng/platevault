export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 pb-14 pt-6">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        Spot. Tag. Archive.
      </h1>

      <p className="mt-3 max-w-2xl text-zinc-400">
        A modern license plate spotting gallery inspired by real-world plate
        culture. Upload photos, browse by registration, and explore
        country-accurate plate types — without clutter.
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
    </main>
  );
}
