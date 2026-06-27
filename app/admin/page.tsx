import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { getMaintenanceSettings } from "@/app/lib/maintenance";
import MaintenanceToggle from "./MaintenanceToggle";

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, username: true, role: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPERADMIN") redirect("/");

  const { maintenanceMode, maintenanceMsg } = await getMaintenanceSettings();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div>
        <p className="text-xs font-mono text-indigo-400 tracking-widest mb-1">SUPERADMIN</p>
        <h1 className="text-3xl font-black text-zinc-100">Admin Panel</h1>
        <p className="text-sm text-zinc-500 mt-1">Only you can see this. Handle with care.</p>
      </div>

      {/* Maintenance */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono text-zinc-500 tracking-widest uppercase">Site Status</h2>
        <MaintenanceToggle initialMode={maintenanceMode} initialMsg={maintenanceMsg} />
      </section>

      {/* Quick links */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono text-zinc-500 tracking-widest uppercase">Quick Links</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/home",      label: "Home feed" },
            { href: "/search",    label: "Search" },
            { href: "/catalog",   label: "Catalog" },
            { href: "/upload",    label: "Upload" },
            { href: "/status",    label: "Status page" },
            { href: "/leaderboard", label: "Leaderboard" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors"
            >
              {label} →
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
