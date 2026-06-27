import { notFound } from "next/navigation";
import Flag from "@/app/components/Flag";
import { getCountryMeta } from "@/app/lib/countries";

async function getCollection(numericId: number) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/collections/${numericId}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()).collection;
}

function relativeDays(d: Date | string) {
  const ms = Date.now() - new Date(d).getTime();
  const days = Math.max(0, Math.floor(ms / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) return notFound();

  const collection = await getCollection(numericId);
  if (!collection) return notFound();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <a
          href={`/u/${collection.user.numericId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
        >
          ← @{collection.user.username}
        </a>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-black text-zinc-50">{collection.name}</h1>
            {!collection.isPublic && (
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">private</span>
            )}
          </div>
          {collection.description && (
            <p className="ml-4 text-sm text-zinc-400">{collection.description}</p>
          )}
          <div className="ml-4 mt-2 flex items-center gap-3 flex-wrap">
            <p className="text-xs text-zinc-600">{collection._count.items} spots · by @{collection.user.username}</p>
            <div className="flex gap-2 ml-auto">
              <a
                href={`/api/collections/export?id=${numericId}&format=csv`}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:border-indigo-700/60 hover:text-indigo-300 transition-colors"
              >
                ↓ CSV
              </a>
              <a
                href={`/api/collections/export?id=${numericId}&format=json`}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:border-indigo-700/60 hover:text-indigo-300 transition-colors"
              >
                ↓ JSON
              </a>
            </div>
          </div>
        </div>

        {collection.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center">
            <div className="text-4xl">🗂️</div>
            <p className="mt-4 text-sm text-zinc-400">This collection is empty.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collection.items.map((item: any) => {
              const u = item.upload;
              const meta = getCountryMeta(u.country);
              const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
              return (
                <a
                  key={u.id}
                  href={`/spot/${u.numericId}`}
                  className="group rounded-2xl overflow-hidden border border-zinc-800/60 hover:border-indigo-600/60 hover:shadow-xl hover:shadow-indigo-950/40 hover:-translate-y-0.5 transition-all block bg-zinc-900/50"
                >
                  <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <img src={u.imageUrl} alt={u.plateText}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-2 right-2"><Flag iso={meta.iso} /></div>
                  </div>
                  <div className="px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-bold tracking-widest text-zinc-100 group-hover:text-indigo-200 transition-colors truncate">{u.plateText}</span>
                      {u._count.likes > 0 && <span className="text-xs text-rose-400 font-semibold shrink-0">♥ {u._count.likes}</span>}
                    </div>
                    {carLabel && <div className="text-xs text-zinc-500 mt-0.5 truncate">{carLabel}</div>}
                    <div className="mt-2 text-xs text-zinc-600">{relativeDays(u.createdAt)}</div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
