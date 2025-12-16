import { siteStatus, statusInfo } from "../status-config";

function StatusBadge() {
  const s = statusInfo[siteStatus];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ${s.text} ${s.ring}`}>
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${s.dotBg} opacity-60`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${s.dotBg}`} />
      </span>
      {s.label}
    </span>
  );
}

export default function ComingSoon() {
  const s = statusInfo[siteStatus];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 grid place-items-center px-6">
      <div className="w-full max-w-xl text-center">
        <div className="text-3xl font-semibold tracking-tight">PlateVault</div>
        <p className="mt-3 text-zinc-400">
          Spot. Tag. Archive.
        </p>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-left">
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs uppercase tracking-wider text-zinc-500">
              Status
            </div>
            <StatusBadge />
          </div>

          <div className="mt-3 text-lg font-medium">{s.headline}</div>
          <p className="mt-2 text-sm text-zinc-400">{s.description}</p>

          <div className="mt-5">
            <a
              href="/status"
              className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              View status page →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
