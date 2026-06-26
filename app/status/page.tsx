import { statusInfo } from "../status-config";
import { getMaintenanceSettings } from "@/app/lib/maintenance";

const SERVICES = [
  { name: "Website",         key: "web" },
  { name: "Image uploads",   key: "uploads" },
  { name: "Database",        key: "db" },
  { name: "Authentication",  key: "auth" },
];

export default async function StatusPage() {
  const { maintenanceMode } = await getMaintenanceSettings();
  const siteStatus = maintenanceMode ? "maintenance" : "online";
  const s = statusInfo[siteStatus];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-12">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">PlateVault</div>
            <h1 className="text-2xl font-semibold">System Status</h1>
          </div>
          <a
            href="/home"
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-300 hover:border-indigo-800/60 hover:text-indigo-300 hover:bg-indigo-950/20 transition-colors"
          >
            Back to PlateVault
          </a>
        </div>

        {/* Overall status banner */}
        <div className={`rounded-2xl border p-6 mb-6 ${
          siteStatus === "online"
            ? "border-emerald-900/40 bg-emerald-950/10"
            : siteStatus === "maintenance"
            ? "border-amber-900/40 bg-amber-950/10"
            : "border-red-900/40 bg-red-950/10"
        }`}>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${s.dotBg} opacity-50`} />
              <span className={`relative inline-flex h-3 w-3 rounded-full ${s.dotBg}`} />
            </span>
            <span className={`text-sm font-semibold ${s.text}`}>{s.label}</span>
          </div>
          <div className="mt-3 text-lg font-semibold">{s.headline}</div>
          <p className="mt-1 text-sm text-zinc-400">{s.description}</p>
        </div>

        {/* Per-service rows */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800">
          {SERVICES.map((svc) => (
            <div key={svc.key} className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-zinc-200">{svc.name}</span>
              <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ${s.text} ${s.ring}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${s.dotBg}`} />
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Having issues? Reach out on our community channels.
        </p>

      </div>
    </main>
  );
}
