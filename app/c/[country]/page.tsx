import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import LikeButton from "./LikeButton";

const COUNTRY_META: Record<string, { flag: string; name: string }> = {
  albania: { flag: "🇦🇱", name: "Albania" },
  germany: { flag: "🇩🇪", name: "Germany" },
  italy:   { flag: "🇮🇹", name: "Italy" },
  kosovo:  { flag: "🇽🇰", name: "Kosovo" },
  greece:  { flag: "🇬🇷", name: "Greece" },
};

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
  const meta = COUNTRY_META[country];

  const [uploads, currentUser] = await Promise.all([
    prisma.upload.findMany({
      where: { country, deletedAt: null },
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
        _count: { select: { likes: true } },
      },
    }),
    getCurrentUser(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-3xl mb-1">{meta?.flag ?? "🏳️"}</div>
          <h1 className="text-2xl font-semibold">{meta?.name ?? country}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {uploads.length === 0
              ? "No spots yet — be the first to upload!"
              : `${uploads.length} spot${uploads.length === 1 ? "" : "s"} archived`}
          </p>
        </div>
        <a href="/upload" className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white shrink-0">
          + Upload
        </a>
      </div>

      {uploads.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 text-2xl">
            {meta?.flag ?? "🏳️"}
          </div>
          <div className="mt-4 text-sm font-medium text-zinc-200">No spots yet</div>
          <p className="mt-1 text-xs text-zinc-500">Be the first to upload a plate from {meta?.name ?? country}.</p>
          <a href="/upload" className="mt-4 inline-flex rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white">
            Upload now
          </a>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {uploads.map((u) => {
            const isOwner = currentUser?.id === u.userId;
            const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
            return (
              <a
                key={u.id}
                href={`/spot/${u.numericId}`}
                className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-zinc-600 transition-colors"
              >
                <div className="relative bg-zinc-950 aspect-video overflow-hidden">
                  <img
                    src={u.imageUrl}
                    alt={`${u.plateText} plate`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-lg font-bold tracking-widest text-zinc-100">{u.plateText}</div>
                      {carLabel && <div className="text-xs text-zinc-400 mt-0.5">{carLabel}</div>}
                    </div>
                    {u.plateType && (
                      <span className="shrink-0 rounded-full border border-zinc-800 bg-zinc-950/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
                        {u.plateType.replace(/-/g, " ")}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-zinc-800">
                    <a
                      href={`/u/${u.user.numericId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      @{u.user.username}
                    </a>
                    <div className="flex items-center gap-2">
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
              </a>
            );
          })}
        </div>
      )}
    </main>
  );
}
