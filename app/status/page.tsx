import { siteStatus, statusInfo } from "../status-config";

export default function StatusPage() {
  const s = statusInfo[siteStatus];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 grid place-items-center px-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold tracking-tight">PlateVault Status</div>
            <p className="mt-2 text-sm text-zinc-400">
              Live status for the site and core services.
            </p>
          </div>

          <a
            href="/coming-soon"
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
          >
            Back
          </a>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-medium">Website</div>

            <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ${s.text} ${s.ring}`}>
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${s.dotBg} opacity-60`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${s.dotBg}`} />
              </span>
              {s.label}
            </div>
          </div>

          <div className="mt-3 text-lg font-medium">{s.headline}</div>
          <p className="mt-2 text-sm text-zinc-400">{s.description}</p>

          <div className="mt-6 border-t border-zinc-800 pt-5">
            <div className="text-xs uppercase tracking-wider text-zinc-500">Last updated</div>
            <div className="mt-2 text-sm text-zinc-300">
              {new Date().toLocaleString()}
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              (This timestamp updates when the page is loaded.)
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
