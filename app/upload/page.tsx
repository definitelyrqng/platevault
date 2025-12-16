export default function UploadPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">Upload a license plate</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Select a country to continue. Each country has its own upload form and
          plate types.
        </p>

        <div className="mt-8 grid gap-4">
          <a
            href="/upload/albania"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-600"
          >
            <div className="text-lg font-semibold">🇦🇱 Albania</div>
            <div className="mt-1 text-sm text-zinc-400">
              Cars, motorcycles, trailers — modern Albanian plates
            </div>
          </a>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 opacity-50">
            <div className="text-lg font-semibold">🇩🇪 Germany</div>
            <div className="mt-1 text-sm text-zinc-400">
              Coming soon
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
