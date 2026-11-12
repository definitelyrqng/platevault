import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { getMaintenanceSettings } from "@/app/lib/maintenance";
import { getCountryMeta } from "@/app/lib/countries";
import MaintenanceToggle from "./MaintenanceToggle";
import HiddenSpotActions from "./HiddenSpotActions";
import UserAdminPanel from "@/app/u/[id]/UserAdminPanel";
import PlateBadge from "@/app/components/PlateBadge";
import ReportsTab from "./ReportsTab";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

type Tab = "overview" | "reports" | "users" | "spots" | "site";

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

const ago = (d: Date) => {
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const m = Math.floor(days / 30);
  return m < 12 ? `${m}mo ago` : `${Math.floor(m / 12)}y ago`;
};

const ROLE_STYLE: Record<string, string> = {
  SUPERADMIN: "bg-amber-500/15 text-amber-300",
  ADMIN: "bg-violet-500/15 text-violet-300",
  MOD: "bg-sky-500/15 text-sky-300",
  USER: "bg-zinc-800 text-zinc-400",
};

function Stat({ label, value, href, tone }: { label: string; value: number; href?: string; tone?: "warn" }) {
  const inner = (
    <div className={`rounded-xl border p-4 transition-colors ${tone === "warn" && value > 0 ? "border-amber-800/50 bg-amber-950/20" : "border-zinc-800 bg-zinc-900/40"} ${href ? "hover:border-zinc-600" : ""}`}>
      <div className="text-2xl font-bold tabular-nums text-white">{value.toLocaleString()}</div>
      <div className="mt-0.5 text-xs text-zinc-500">{label}</div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; rs?: string; rc?: string; rp?: string }> }) {
  const user = await getSessionUser();
  if (!user || (user.role !== "SUPERADMIN" && user.role !== "ADMIN")) redirect("/");
  const isSuper = user.role === "SUPERADMIN";

  const sp = await searchParams;
  const openReports = await prisma.report.count({ where: { status: "OPEN" } });
  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "overview", label: "Overview", show: true },
    { id: "reports", label: openReports > 0 ? `Reports (${openReports})` : "Reports", show: true },
    { id: "users", label: "Users", show: true },
    { id: "spots", label: "Hidden spots", show: true },
    { id: "site", label: "Site", show: isSuper },
  ];
  const tab: Tab = tabs.find((t) => t.id === sp.tab && t.show)?.id ?? "overview";
  const q = (sp.q ?? "").trim().slice(0, 40);

  const now = new Date();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const activeBan = { bannedAt: { not: null }, OR: [{ banExpiresAt: null }, { banExpiresAt: { gt: now } }] };

  /* ── data per tab ── */
  let body: React.ReactNode = null;

  if (tab === "overview") {
    const [users, newUsers, banned, spots, newSpots, hidden, recent] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: activeBan }),
      prisma.upload.count({ where: { deletedAt: null } }),
      prisma.upload.count({ where: { deletedAt: null, createdAt: { gte: weekAgo } } }),
      prisma.upload.count({ where: { deletedAt: null, hidden: true } }),
      prisma.upload.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { numericId: true, plateText: true, plateType: true, country: true, hidden: true, createdAt: true, user: { select: { username: true } } },
      }),
    ]);
    body = (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Spots" value={spots} />
          <Stat label="New spots (7d)" value={newSpots} />
          <Stat label="Users" value={users} href="?tab=users" />
          <Stat label="New users (7d)" value={newUsers} />
          <Stat label="Open reports" value={openReports} href="?tab=reports" tone="warn" />
          <Stat label="Hidden spots" value={hidden} href="?tab=spots" tone="warn" />
          <Stat label="Banned users" value={banned} tone="warn" />
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-200">Latest uploads</h2>
          <ul className="divide-y divide-zinc-800/70 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
            {recent.map((s) => (
              <li key={s.numericId}>
                <a href={`/spot/${s.numericId}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-800/40">
                  <PlateBadge country={s.country} text={s.plateText} plateType={s.plateType} size="xs" />
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-400">
                    {getCountryMeta(s.country).name} · @{s.user.username}
                  </span>
                  {s.hidden && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">Hidden</span>}
                  <span className="shrink-0 text-xs text-zinc-600">{ago(s.createdAt)}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-200">Shortcuts</h2>
          <div className="flex flex-wrap gap-2">
            {[["/home", "Home"], ["/search", "Search"], ["/catalog", "Catalog"], ["/countries", "Countries"], ["/leaderboard", "Leaderboard"], ["/status", "Status page"]].map(([href, label]) => (
              <a key={href} href={href} className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white">{label} →</a>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (tab === "reports") {
    body = <ReportsTab rs={sp.rs} rc={sp.rc} rp={sp.rp} openCount={openReports} />;
  }

  if (tab === "users") {
    const users = await prisma.user.findMany({
      where: q ? { username: { contains: q, mode: "insensitive" } } : {},
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true, numericId: true, username: true, role: true, createdAt: true,
        bannedAt: true, banExpiresAt: true, banReason: true,
        _count: { select: { uploads: { where: { deletedAt: null } } } },
      },
    });
    body = (
      <div className="space-y-4">
        <form method="GET" role="search" className="flex max-w-md gap-2">
          <input type="hidden" name="tab" value="users" />
          <input name="q" defaultValue={q} placeholder="Find a user…" autoComplete="off"
            className="h-10 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm outline-none focus:border-indigo-500" />
          <button className="rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500">Search</button>
        </form>
        <p className="text-xs text-zinc-500">{q ? `Matching “${q}”` : "Newest members"} · showing {users.length}</p>

        <ul className="space-y-2">
          {users.map((u) => {
            const banned = !!u.bannedAt && (!u.banExpiresAt || u.banExpiresAt > now);
            const manageable = u.id !== user.id && u.role !== "SUPERADMIN" && (isSuper || u.role !== "ADMIN");
            return (
              <li key={u.id} className={`rounded-xl border bg-zinc-900/40 ${banned ? "border-red-900/60" : "border-zinc-800"}`}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 marker:hidden">
                    <a href={`/u/${u.numericId}`} className="text-sm font-medium text-zinc-100 hover:text-indigo-300">@{u.username}</a>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ROLE_STYLE[u.role] ?? ROLE_STYLE.USER}`}>{u.role.toLowerCase()}</span>
                    {banned && <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Banned</span>}
                    {banned && u.banReason && <span className="hidden min-w-0 max-w-[40%] truncate text-xs text-red-300/80 md:block" title={u.banReason}>“{u.banReason}”</span>}
                    <span className="ml-auto hidden text-xs text-zinc-500 sm:block">{u._count.uploads} spot{u._count.uploads === 1 ? "" : "s"} · joined {ago(u.createdAt)}</span>
                    {manageable && <span className="text-xs text-zinc-500 transition-transform group-open:rotate-180">▾</span>}
                  </summary>
                  {manageable && (
                    <div className="border-t border-zinc-800 px-4 pb-4">
                      <UserAdminPanel
                        targetId={u.id}
                        targetUsername={u.username}
                        targetRole={u.role}
                        isBanned={banned}
                        banExpiresAt={u.banExpiresAt?.toISOString() ?? null}
                        currentBanReason={u.banReason}
                        bannedAt={u.bannedAt?.toISOString() ?? null}
                        actorRole={user.role}
                        defaultOpen
                      />
                    </div>
                  )}
                </details>
              </li>
            );
          })}
          {users.length === 0 && <li className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">No users found.</li>}
        </ul>
      </div>
    );
  }

  if (tab === "spots") {
    const hidden = await prisma.upload.findMany({
      where: { deletedAt: null, hidden: true },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { id: true, numericId: true, plateText: true, plateType: true, country: true, imageUrl: true, createdAt: true, user: { select: { username: true } } },
    });
    body = (
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">Spots hidden from the public site. Restore them, or delete for good.</p>
        {hidden.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">Nothing is hidden right now. 🎉</div>
        ) : (
          <ul className="space-y-2">
            {hidden.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                <a href={`/spot/${s.numericId}`} className="shrink-0 overflow-hidden rounded-lg ring-1 ring-zinc-800">
                  <img src={s.imageUrl} alt="" className="h-14 w-20 object-cover" loading="lazy" />
                </a>
                <div className="min-w-0 flex-1">
                  <PlateBadge country={s.country} text={s.plateText} plateType={s.plateType} size="xs" />
                  <div className="mt-1 truncate text-xs text-zinc-500">{getCountryMeta(s.country).name} · @{s.user.username} · {ago(s.createdAt)}</div>
                </div>
                <HiddenSpotActions uploadId={s.id} canDelete />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (tab === "site" && isSuper) {
    const { maintenanceMode, maintenanceMsg } = await getMaintenanceSettings();
    body = (
      <section className="max-w-2xl space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200">Maintenance mode</h2>
        <MaintenanceToggle initialMode={maintenanceMode} initialMsg={maintenanceMsg} />
      </section>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">{isSuper ? "Super admin" : "Admin"}</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Admin panel</h1>
        </div>
        <p className="text-xs text-zinc-500">Signed in as @{user.username}</p>
      </div>

      <nav className="mb-8 flex flex-wrap gap-1 border-b border-zinc-800" aria-label="Admin sections">
        {tabs.filter((t) => t.show).map((t) => (
          <a key={t.id} href={`?tab=${t.id}`} aria-current={t.id === tab ? "page" : undefined}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              t.id === tab ? "border-indigo-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-200"}`}>
            {t.label}
          </a>
        ))}
      </nav>

      {body}
    </main>
  );
}
