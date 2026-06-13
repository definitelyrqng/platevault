import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import CompanyAdmin from "./CompanyAdmin";

export const dynamic = "force-dynamic";

function relativeDays(d: Date) {
  const ms = Date.now() - d.getTime();
  const days = Math.max(0, Math.floor(ms / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

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

function isMod(role: string) {
  return ["SUPERADMIN", "ADMIN", "MOD"].includes(role);
}

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const numericId = Number(rawId);

  const [company, currentUser] = await Promise.all([
    prisma.transportCompany.findFirst({
      where: { OR: [{ numericId: Number.isInteger(numericId) ? numericId : 0 }, { id: rawId }] },
      select: {
        id: true, numericId: true, name: true, country: true, city: true,
        description: true, website: true, createdAt: true,
        createdBy: { select: { username: true, numericId: true } },
        uploads: {
          where: { deletedAt: null, hidden: false },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true, numericId: true, plateText: true, imageUrl: true, country: true,
            brand: true, model: true, generation: true, createdAt: true,
            user: { select: { username: true, numericId: true } },
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
    }),
    getSessionUser(),
  ]);

  if (!company) return notFound();

  const modAccess = currentUser && isMod(currentUser.role);
  const spots = company.uploads;

  // Stats
  const brandCounts: Record<string, number> = {};
  const modelCounts: Record<string, number> = {};
  for (const s of spots) {
    if (s.brand) brandCounts[s.brand] = (brandCounts[s.brand] ?? 0) + 1;
    const mk = [s.brand, s.model].filter(Boolean).join(" ");
    if (mk) modelCounts[mk] = (modelCounts[mk] ?? 0) + 1;
  }
  const topBrands = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topModels = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-1 text-xs text-zinc-500">
        <a href="/companies" className="hover:text-zinc-300 transition-colors">Companies</a>
        <span className="mx-1.5 text-zinc-700">&#8250;</span>
        <span className="text-zinc-400">{company.name}</span>
      </div>

      <div className="mt-4 mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          {(company.city || company.country) && (
            <p className="mt-1 text-sm text-zinc-400">
              {[company.city, company.country].filter(Boolean).join(", ")}
            </p>
          )}
          {company.description && (
            <p className="mt-2 text-sm text-zinc-500 max-w-xl">{company.description}</p>
          )}
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-blue-400 hover:text-blue-300 transition-colors">
              {company.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          <p className="mt-2 text-xs text-zinc-600">
            Added by{" "}
            <a href={"/u/" + company.createdBy.numericId} className="hover:text-zinc-400 transition-colors">
              @{company.createdBy.username}
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-400">
            {spots.length} spot{spots.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Stats */}
      {spots.length > 0 && (topBrands.length > 0 || topModels.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2 mb-10">
          {topBrands.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">By brand</p>
              <div className="space-y-2">
                {topBrands.map(([brand, count]) => (
                  <div key={brand} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-xs text-zinc-300 truncate">{brand}</span>
                        <span className="text-xs text-zinc-500 shrink-0 tabular-nums">{count}</span>
                      </div>
                      <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded-full bg-zinc-500 transition-all"
                          style={{ width: (count / spots.length * 100) + "%" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {topModels.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">By model</p>
              <div className="space-y-2">
                {topModels.map(([model, count]) => (
                  <div key={model} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-xs text-zinc-300 truncate">{model}</span>
                        <span className="text-xs text-zinc-500 shrink-0 tabular-nums">{count}</span>
                      </div>
                      <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded-full bg-zinc-600 transition-all"
                          style={{ width: (count / spots.length * 100) + "%" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mod edit panel */}
      {modAccess && (
        <div className="mb-8">
          <CompanyAdmin company={{
            id: company.id,
            name: company.name,
            country: company.country,
            city: company.city,
            description: company.description,
            website: company.website,
          }} />
        </div>
      )}

      {/* Spots grid */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-4">
          Spotted plates ({spots.length})
        </p>
        {spots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 py-12 text-center">
            <p className="text-sm text-zinc-600">No spots linked to this company yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spots.map((u) => (
              <div key={u.id}
                className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-zinc-600 transition-colors">
                <a href={"/spot/" + u.numericId} className="absolute inset-0 z-0" aria-label={u.plateText} />
                <div className="relative bg-zinc-950 aspect-video overflow-hidden">
                  <img src={u.imageUrl} alt={u.plateText + " plate"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy" />
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div>
                    <div className="font-mono text-lg font-bold tracking-widest text-zinc-100">{u.plateText}</div>
                    {[u.brand, u.model].filter(Boolean).length > 0 && (
                      <div className="text-xs text-zinc-400 mt-0.5">{[u.brand, u.model].filter(Boolean).join(" ")}</div>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-zinc-800">
                    <a href={"/u/" + u.user.numericId}
                      className="relative z-10 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                      @{u.user.username}
                    </a>
                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                      <span>{relativeDays(u.createdAt)}</span>
                      <span>&#10084; {u._count.likes}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
