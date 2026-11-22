import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import AddCompanyButton from "./AddCompanyButton";
import CompanyDirectory, { type CompanyCard } from "./CompanyDirectory";
import { distinctVehicles } from "@/app/lib/vehicles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Transport Companies",
  description: "Every transport company in the archive, with the vehicles spotted in its fleet.",
};

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, role: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

async function getCompanies(): Promise<CompanyCard[]> {
  const rows = await prisma.transportCompany.findMany({
    orderBy: { name: "asc" },
    select: {
      numericId: true, name: true, country: true, city: true,
      uploads: {
        where: { deletedAt: null, hidden: false },
        orderBy: { createdAt: "desc" },
        select: { id: true, country: true, plateText: true, tags: true, brand: true, imageUrl: true, createdAt: true },
      },
    },
  });
  return rows.map((c) => {
    const vehicles = distinctVehicles(c.uploads);              // a plate spotted several times is one vehicle
    const brandCount = new Map<string, number>();
    for (const v of vehicles) if (v.brand) brandCount.set(v.brand, (brandCount.get(v.brand) ?? 0) + 1);
    return {
      numericId: c.numericId, name: c.name, country: c.country, city: c.city,
      vehicles: vehicles.length,
      cover: c.uploads[0]?.imageUrl ?? null,
      brands: [...brandCount].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([b]) => b),
      lastSeen: c.uploads[0]?.createdAt.toISOString() ?? null,
    };
  });
}

export default async function CompaniesPage() {
  const [companies, currentUser] = await Promise.all([getCompanies(), getSessionUser()]);
  const isSuperAdmin = currentUser?.role === "SUPERADMIN";
  const totalVehicles = companies.reduce((n, c) => n + c.vehicles, 0);
  const withFleet = companies.filter((c) => c.vehicles > 0).length;
  const countries = new Set(companies.map((c) => c.country).filter(Boolean)).size;

  const stats = [
    { label: "Companies", value: companies.length },
    { label: "With vehicles", value: withFleet },
    { label: "Vehicles", value: totalVehicles },
    { label: "Countries", value: countries },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Directory</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">Transport companies</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">Bus operators, haulers, taxis and fleets — and every vehicle we have spotted in them.</p>
        </div>
        {isSuperAdmin && <AddCompanyButton />}
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 px-4 py-3">
            <div className="text-2xl font-bold tabular-nums text-zinc-50">{s.value}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      {companies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
          <p className="text-sm text-zinc-600">No companies yet. They can be added when uploading a spot.</p>
        </div>
      ) : (
        <CompanyDirectory companies={companies} />
      )}
    </main>
  );
}
