import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import { tagById } from "@/app/lib/tags";

function fmtShort(d: Date) {
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const tagDef = tagById(tag);
  if (!tagDef) return notFound();

  const spots = await prisma.upload.findMany({
    where: { tags: { has: tag }, deletedAt: null, hidden: false },
    orderBy: { createdAt: "desc" },
    take: 96,
    select: {
      numericId: true,
      imageUrl: true,
      plateText: true,
      country: true,
      createdAt: true,
      user: { select: { username: true, numericId: true } },
      _count: { select: { likes: true } },
    },
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6">
          <a href="/home" className="hover:text-zinc-300">Home</a>
          <span>›</span>
          <span className="text-zinc-300">#{tagDef.label}</span>
        </div>

        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">{tagDef.group}</div>
          <h1 className="text-3xl font-bold">#{tagDef.label}</h1>
          <p className="mt-2 text-zinc-400 text-sm">{spots.length} spot{spots.length !== 1 ? "s" : ""} tagged</p>
        </div>

        {spots.length === 0 ? (
          <div className="text-center py-24 text-zinc-600">No spots with this tag yet.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {spots.map((s) => (
              <a
                key={s.numericId}
                href={`/spot/${s.numericId}`}
                className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-blue-800 transition-colors"
              >
                <div className="aspect-video bg-zinc-950 overflow-hidden">
                  <img
                    src={s.imageUrl}
                    alt={s.plateText}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-sm font-bold text-zinc-100">{s.plateText}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">@{s.user.username} · {fmtShort(s.createdAt)}</div>
                  </div>
                  <span className="text-xs text-zinc-500">♡ {s._count.likes}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
