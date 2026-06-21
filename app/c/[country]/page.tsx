import Flag from "@/app/components/Flag";
import { getCountryMeta } from "@/app/lib/countries";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import LikeButton from "./LikeButton";

function relativeDays(d: Date) {
  const ms = Date.now() - d.getTime();
  const days = Math.max(0, Math.floor(ms / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;
  return `${Math.floor(months / 12)} years ago`;
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: rawCountry } = await params;
  const country = rawCountry.toLowerCase();
  const meta = getCountryMeta(country);

  const [uploads, currentUser] = await Promise.all([
    prisma.upload.findMany({
      where: { country, deletedAt: null, hidden: false },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true,
        numericId: true,
        plateText: true,
        plateType: true,
        imageUrl: true,
        createdAt: true,
        userId: true,
        brand: true,
        model: true,
        user: { select: { username: true, numericId: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    getCurrentUser(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">

      {/* ─── Country hero header ─── */}
      <div className="relative rounded-2xl overflow-hidden border border-indigo-900/30 bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-zinc-900/40 px-7 py-7 mb-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_0%_50%,rgba(99,102,241,0.12),transparent)]" />
        <div className="relative flex items-end justify-between gap-4">
          <div>
            <div className="text-4xl mb-2"><Flag iso={meta?.iso ?? null} /></div>
            <h1 className="text-2xl font-bold text-zinc-50">{meta?.name ?? country}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {uploads.length === 0
                ? "No spots yet — be the first to upload!"
                : `${uploads.length} spot${uploads.length === 1 ? "" : "s"} archived`}
            </p>
          </div>
          <a href="/upload" className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-950/60">
            + Upload
          </a>
        </div>
      </div>

      {uploads.length === 0 ? (
        <div className="mt-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 text-2xl">
            <Flag iso={meta?.iso ?? null} />
          </div>
          <div className="mt-4 text-sm font-medium text-zinc-200">No spots yet</div>
          <p className="mt-1 text-xs text-zinc-500">Be the first to upload a plate from {meta?.name ?? country}.</p>
          <a href="/upload" className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">
            Upload now
          </a>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {uploads.map((u) => {
            const isOwner = currentUser?.id === u.userId;
            const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
            return (
              <div key={u.id} className="group relative rounded-2xl overflow-hidden border border-zinc-800/60 hover:border-indigo-700/50 hover:shadow-xl hover:shadow-indigo-950/30 transition-all">
                <a href={`/spot/${u.numericId}`} className="absolute inset-0 z-20" aria-label={u.plateText} />

                {/* Photo */}
                <div className="relative aspect-[4/5] overflow-hidden bg-zinc-950">
                  <img
                    src={u.imageUrl}
                    alt={`${u.plateText} plate`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/20 to-transparent" />

                  {/* Plate type badge */}
                  {u.plateType && (
                    <div className="absolute top-3 left-3 z-10 rounded-full bg-indigo-950/80 backdrop-blur border border-indigo-800/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-indigo-300">
                      {u.plateType.replace(/-/g, " ")}
                    </div>
                  )}

                  {/* Bottom overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <div className="font-mono text-base font-black tracking-widest text-white drop-shadow-lg leading-tight group-hover:text-indigo-200 transition-colors">
                      {u.plateText}
                    </div>
                    {carLabel && <div className="text-xs text-zinc-400 mt-0.5">{carLabel}</div>}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-t border-zinc-800/40">
                  <a href={`/u/${u.user.numericId}`} className="relative z-30 text-xs text-zinc-500 hover:text-indigo-300 transition-colors">
                    @{u.user.username}
                  </a>
                  <div className="relative z-30 flex items-center gap-2">
                    <span className="text-xs text-zinc-600">{relativeDays(u.createdAt)}</span>
                    <LikeButton
                      uploadId={u.id}
                      initialLikes={u._count.likes}
                      isOwner={isOwner}
                      isLoggedIn={!!currentUser}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
