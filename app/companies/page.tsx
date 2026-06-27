import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import AddCompanyButton from "./AddCompanyButton";

export const dynamic = "force-dynamic";

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

async function getCompanies() {
  return prisma.transportCompany.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true, numericId: true, name: true, country: true, city: true,
      _count: { select: { uploads: true } },
    },
  });
}

export default async function CompaniesPage() {
  const [companies, currentUser] = await Promise.all([getCompanies(), getSessionUser()]);
  const isSuperAdmin = currentUser?.role === "SUPERADMIN";

  const byLetter: Record<string, typeof companies> = {};
  for (const c of companies) {
    const letter = c.name[0].toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : "#";
    byLetter[key] = byLetter[key] ?? [];
    byLetter[key].push(c);
  }
  const letters = Object.keys(byLetter).sort();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
                        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Directory</p>
          </div>
          <h1 className="text-3xl font-black text-zinc-50">Transport Companies</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {companies.length} compan{companies.length !== 1 ? "ies" : "y"} in the database
          </p>
        </div>
        {isSuperAdmin && <AddCompanyButton />}
      </div>

      {companies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
          <p className="text-sm text-zinc-600">No companies yet. They can be added when uploading a spot.</p>
        </div>
      ) : (
        <>
          {/* Letter jump links */}
          <div className="flex flex-wrap gap-1.5 mb-8">
            {letters.map((l) => (
              <a key={l} href={"#letter-" + l}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs font-mono text-zinc-400 hover:border-indigo-800/60 hover:bg-indigo-950/20 hover:text-indigo-300 transition-colors">
                {l}
              </a>
            ))}
          </div>

          {/* Alphabetical sections */}
          <div className="space-y-8">
            {letters.map((letter) => (
              <section key={letter} id={"letter-" + letter}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-base font-bold text-indigo-400 w-6">{letter}</span>
                  <div className="flex-1 border-t border-zinc-800" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {byLetter[letter].map((c) => (
                    <a
                      key={c.id}
                      href={"/companies/" + c.numericId}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 hover:border-indigo-800/60 hover:bg-indigo-950/20 hover:shadow-sm hover:shadow-indigo-950/40 transition-all"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-200 group-hover:text-indigo-200 truncate transition-colors">
                          {c.name}
                        </div>
                        {(c.city || c.country) && (
                          <div className="text-xs text-zinc-500 truncate mt-0.5">
                            {[c.city, c.country].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                      {c._count.uploads > 0 && (
                        <span className="shrink-0 rounded-full border border-indigo-900/40 bg-indigo-950/20 px-2 py-0.5 text-xs text-indigo-400 tabular-nums">
                          {c._count.uploads} spot{c._count.uploads !== 1 ? "s" : ""}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
