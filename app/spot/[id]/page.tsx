import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import SpotActions from "./SpotActions";
import CommentSection from "./CommentSection";

const COUNTRY_META: Record<string, { flag: string; name: string }> = {
  albania: { flag: "🇦🇱", name: "Albania" },
  germany: { flag: "🇩🇪", name: "Germany" },
  italy:   { flag: "🇮🇹", name: "Italy" },
  kosovo:  { flag: "🇽🇰", name: "Kosovo" },
  greece:  { flag: "🇬🇷", name: "Greece" },
};

function fmt(d: Date) {
  return d.toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, username: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export default async function SpotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [upload, currentUser] = await Promise.all([
    prisma.upload.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        plateText: true,
        plateType: true,
        country: true,
        imageUrl: true,
        brand: true,
        model: true,
        generation: true,
        trim: true,
        color: true,
        createdAt: true,
        userId: true,
        user: { select: { username: true, numericId: true } },
        _count: { select: { likes: true, comments: true } },
        likes: { select: { userId: true } },
        comments: {
          where: {},
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { username: true, id: true, numericId: true } },
          },
        },
      },
    }),
    getCurrentUser(),
  ]);

  if (!upload) return notFound();

  const meta = COUNTRY_META[upload.country] ?? { flag: "🏳️", name: upload.country };
  const isOwner = currentUser?.id === upload.userId;
  const hasLiked = upload.likes.some((l) => l.userId === currentUser?.id);

  const carLabel = [upload.brand, upload.model, upload.generation].filter(Boolean).join(" ");

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-8">

        {/* Back link */}
        <a href={`/c/${upload.country}`} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-6">
          ← {meta.flag} {meta.name}
        </a>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* ─── Left: image + info ─── */}
          <div className="space-y-4">
            {/* Hero image */}
            <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800">
              <img
                src={upload.imageUrl}
                alt={`${upload.plateText} — ${meta.name}`}
                className="w-full object-contain max-h-[60vh]"
              />
            </div>

            {/* Plate badge */}
            <div className="flex items-center justify-center">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-white to-zinc-100 shadow-md ring-1 ring-zinc-300 px-1">
                <div className="flex items-stretch">
                  <div className="flex flex-col items-center justify-center bg-blue-700 px-3 py-3 text-white">
                    <span className="text-[8px] font-bold leading-none tracking-wider">EU</span>
                    <span className="mt-1 text-sm font-extrabold leading-none">
                      {meta.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-center px-5 py-3">
                    <span className="font-mono text-3xl font-black tracking-[0.2em] text-zinc-900">
                      {upload.plateText}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Car name if available */}
            {carLabel && (
              <div className="text-center">
                <div className="text-xl font-semibold text-zinc-100">{carLabel}</div>
                {upload.generation && upload.trim && (
                  <div className="text-sm text-zinc-400 mt-0.5">{upload.trim}</div>
                )}
              </div>
            )}

            {/* Comments */}
            <CommentSection
              uploadId={upload.id}
              initialComments={upload.comments.map((c) => ({
                id: c.id,
                content: c.content,
                createdAt: c.createdAt.toISOString(),
                username: c.user.username,
                numericId: c.user.numericId,
                isOwn: c.user.id === currentUser?.id,
              }))}
              isLoggedIn={!!currentUser}
            />
          </div>

          {/* ─── Right: sidebar info ─── */}
          <aside className="space-y-4">
            {/* Like + stats */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <SpotActions
                uploadId={upload.id}
                initialLikes={upload._count.likes}
                hasLiked={hasLiked}
                isOwner={isOwner}
                isLoggedIn={!!currentUser}
              />
              <div className="mt-3 flex gap-4 text-sm text-zinc-400">
                <span>{upload._count.likes} like{upload._count.likes !== 1 ? "s" : ""}</span>
                <span>{upload._count.comments} comment{upload._count.comments !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Details */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
              <div className="text-xs uppercase tracking-wider text-zinc-500">Details</div>

              <Detail label="Country" value={`${meta.flag} ${meta.name}`} />
              {upload.plateType && <Detail label="Plate type" value={upload.plateType.replace(/-/g, " ")} />}
              {upload.color && <Detail label="Color" value={upload.color} />}
              {upload.trim && <Detail label="Trim" value={upload.trim} />}
              {upload.generation && <Detail label="Generation" value={upload.generation} />}

              <div className="border-t border-zinc-800 pt-3 space-y-3">
                <Detail label="Spotted by" value={`@${upload.user.username}`} href={`/u/${upload.user.numericId}`} />
                <Detail label="Date" value={fmt(upload.createdAt)} />
              </div>
            </div>

            {/* Missing car info nudge */}
            {!upload.brand && !upload.model && (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-4 text-xs text-zinc-500">
                Car details not filled in yet. Admins can add brand, model, generation & trim.
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Detail({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-zinc-500 shrink-0">{label}</span>
      {href ? (
        <a href={href} className="text-zinc-200 hover:text-white truncate font-medium">{value}</a>
      ) : (
        <span className="text-zinc-200 truncate capitalize">{value}</span>
      )}
    </div>
  );
}
