import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

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
  const companies = await getCompanies();

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
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Directory</p>
        <h1 className="text-3xl font-bold">Transport Companies</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {companies.length} compan{companies.length !== 1 ? "ies" : "y"} in the database
        </p>
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
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs font-mono text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors">
                {l}
              </a>
            ))}
          </div>

          {/* Alphabetical sections */}
          <div className="space-y-8">
            {letters.map((letter) => (
              <section key={letter} id={"letter-" + letter}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-lg font-bold text-zinc-300 w-6">{letter}</span>
                  <div className="flex-1 border-t border-zinc-800" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {byLetter[letter].map((c) => (
                    <a
                      key={c.id}
                      href={"/companies/" + c.numericId}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 hover:border-zinc-600 hover:bg-zinc-900/70 transition-all"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-200 group-hover:text-white truncate transition-colors">
                          {c.name}
                        </div>
                        {(c.city || c.country) && (
                          <div className="text-xs text-zinc-500 truncate mt-0.5">
                            {[c.city, c.country].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                      {c._count.uploads > 0 && (
                        <span className="shrink-0 text-xs text-zinc-500 tabular-nums">
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
