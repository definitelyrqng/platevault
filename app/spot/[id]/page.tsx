import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import SpotActions from "./SpotActions";
import CommentSection from "./CommentSection";
import AdminPanel from "./AdminPanel";
import ReportButton from "./ReportButton";
import TagEditor from "./TagEditor";
import { tagById } from "@/app/lib/tags";
import { getAlbaniaRegion, ALBANIA_PLATE_TYPE_LABELS } from "@/app/lib/albaniaRegions";

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

function fmtShort(d: Date) {
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

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
    select: { expiresAt: true, user: { select: { id: true, username: true, role: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export default async function SpotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) return notFound();

  const [upload, currentUser] = await Promise.all([
    prisma.upload.findFirst({
      where: { numericId, deletedAt: null },
      select: {
        id: true,
        numericId: true,
        plateText: true,
        plateType: true,
        country: true,
        imageUrl: true,
        brand: true,
        model: true,
        generation: true,
        trim: true,
        color: true,
        location: true,
        plateRegion: true,
        badge: true,
        tags: true,
        hidden: true,
        createdAt: true,
        userId: true,
        user: { select: { username: true, numericId: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
        likes: { select: { userId: true } },
        comments: {
          where: {},
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { username: true, id: true, numericId: true, avatarUrl: true } },
          },
        },
      },
    }),
    getCurrentUser(),
  ]);

  if (!upload) return notFound();

  // Hidden spot — non-mods see a placeholder instead of a 404
  const isMod_ = currentUser?.role === "SUPERADMIN" || currentUser?.role === "ADMIN" || currentUser?.role === "MOD";
  if (upload.hidden && !isMod_) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h1 className="text-xl font-semibold">This spot has been hidden</h1>
          <p className="mt-3 text-zinc-400 text-sm">This content has been temporarily hidden by a moderator pending review.</p>
          <a href="/home" className="mt-6 inline-flex rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900">
            ← Back to PlateVault
          </a>
        </div>
      </main>
    );
  }

  // Other sightings of the same plate
  const otherSightings = await prisma.upload.findMany({
    where: { plateText: upload.plateText, country: upload.country, deletedAt: null, NOT: { id: upload.id } },
    orderBy: { createdAt: "asc" },
    take: 12,
    select: {
      numericId: true,
      imageUrl: true,
      createdAt: true,
      user: { select: { username: true, numericId: true, avatarUrl: true } },
      _count: { select: { likes: true } },
    },
  });

  const meta = COUNTRY_META[upload.country] ?? { flag: "🏳️", name: upload.country };

  // Albania region lookup
  const albaniaRegion = upload.country === "albania" && upload.plateRegion
    ? getAlbaniaRegion(upload.plateRegion)
    : undefined;

  const isOwner = currentUser?.id === upload.userId;
  const hasLiked = upload.likes.some((l) => l.userId === currentUser?.id);
  const isAdmin = currentUser?.role === "SUPERADMIN" || currentUser?.role === "ADMIN";
  const isMod = isAdmin || currentUser?.role === "MOD";

  const carLabel = [upload.brand, upload.model].filter(Boolean).join(" ");
  const fullCarLabel = [upload.brand, upload.model, upload.generation].filter(Boolean).join(" ");

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6">
          <a href="/home" className="hover:text-zinc-300">Home</a>
          <span>›</span>
          <a href={`/c/${upload.country}`} className="hover:text-zinc-300">{meta.flag} {meta.name}</a>
          {albaniaRegion && (
            <>
              <span>›</span>
              <span className="text-zinc-400">{albaniaRegion.city}</span>
            </>
          )}
          <span>›</span>
          <span className="font-mono text-zinc-300">{upload.plateText}</span>
          {otherSightings.length > 0 && (
            <span className="ml-1 rounded-full bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-[10px] text-blue-400 font-medium">
              📍 {otherSightings.length + 1} sightings
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* ─── Left: image + comments ─── */}
          <div className="space-y-5">

            {/* Hero image */}
            <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl">
              <img
                src={upload.imageUrl}
                alt={`${upload.plateText} — ${meta.name}`}
                className="w-full object-contain max-h-[65vh]"
              />
              {/* Overlay badges */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="rounded-full bg-zinc-950/80 backdrop-blur border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                  {meta.flag} {meta.name}
                </span>
                <span className="rounded-full bg-zinc-950/80 backdrop-blur border border-zinc-700 px-3 py-1 text-xs font-mono font-bold text-zinc-100 tracking-widest">
                  {upload.plateText}
                </span>
              </div>
            </div>

            {/* Car name */}
            {fullCarLabel && (
              <div className="text-center space-y-0.5">
                <div className="text-xl font-semibold text-zinc-100 flex items-center justify-center gap-2 flex-wrap">
                  {fullCarLabel}
                  {upload.badge && (
                    <span className="rounded-md bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-sm font-mono text-zinc-300">
                      {upload.badge}
                    </span>
                  )}
                </div>
                {upload.trim && (
                  <div className="text-sm text-zinc-400">{upload.trim}</div>
                )}
              </div>
            )}

            {/* Tags */}
            {upload.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {upload.tags.map((tag) => {
                  const def = tagById(tag);
                  if (!def) return null;
                  return (
                    <a
                      key={tag}
                      href={"/tags/" + tag}
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium border border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors"
                    >
                      #{def.label}
                    </a>
                  );
                })}
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
                avatarUrl: c.user.avatarUrl ?? null,
                isOwn: c.user.id === currentUser?.id,
              }))}
              isLoggedIn={!!currentUser}
              isMod={isMod}
            />
          </div>

          {/* ─── Right: sidebar ─── */}
          <aside className="space-y-4">

            {/* Spotter card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex items-center gap-3 mb-4">
                <a href={`/u/${upload.user.numericId}`} className="flex items-center gap-3 group">
                  {upload.user.avatarUrl ? (
                    <img src={upload.user.avatarUrl} alt={upload.user.username} className="h-9 w-9 rounded-xl object-cover ring-2 ring-zinc-700 group-hover:ring-zinc-500 transition-all" />
                  ) : (
                    <div className="h-9 w-9 rounded-xl bg-zinc-800 grid place-items-center text-xs font-bold text-zinc-400 ring-2 ring-zinc-700">
                      {upload.user.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">@{upload.user.username}</div>
                    <div className="text-xs text-zinc-500">{relativeDays(upload.createdAt)}</div>
                  </div>
                </a>
              </div>

              <SpotActions
                uploadId={upload.id}
                initialLikes={upload._count.likes}
                hasLiked={hasLiked}
                isOwner={isOwner}
                isLoggedIn={!!currentUser}
              />
              <div className="mt-3 flex items-center justify-between gap-4 text-xs text-zinc-500">
                <div className="flex gap-4">
                  <span>{upload._count.likes} like{upload._count.likes !== 1 ? "s" : ""}</span>
                  <span>{upload._count.comments} comment{upload._count.comments !== 1 ? "s" : ""}</span>
                </div>
                {currentUser && !isOwner && (
                  <ReportButton uploadNumericId={upload.numericId} />
                )}
              </div>
            </div>

            {/* Details */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Details</div>
              <Detail label="Country"    value={`${meta.flag} ${meta.name}`} />
              {albaniaRegion && (
                <Detail label="Region" value={albaniaRegion.district} />
              )}
              {upload.location  && <Detail label="Location"   value={upload.location} />}
              {upload.plateType && <Detail label="Plate type" value={ALBANIA_PLATE_TYPE_LABELS[upload.plateType] ?? upload.plateType.replace(/-/g, " ")} />}
              {upload.badge      && <Detail label="Badge"      value={upload.badge} />}
              {upload.color      && <Detail label="Color"      value={upload.color} />}
              {upload.trim       && <Detail label="Trim"       value={upload.trim} />}
              {upload.generation && <Detail label="Generation" value={upload.generation} />}
              <div className="border-t border-zinc-800 pt-3">
                <Detail label="Date" value={fmt(upload.createdAt)} />
              </div>
            </div>

            {/* Tag editor - mod+ */}
            {isMod && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Tags</div>
                <TagEditor uploadId={upload.id} initialTags={upload.tags} />
              </div>
            )}

            {/* Admin panel */}
            {isAdmin && (
              <AdminPanel
                uploadId={upload.id}
                initialBrand={upload.brand ?? ""}
                initialModel={upload.model ?? ""}
                initialGeneration={upload.generation ?? ""}
                initialTrim={upload.trim ?? ""}
                initialColor={upload.color ?? ""}
                initialBadge={upload.badge ?? ""}
                initialHidden={upload.hidden}
              />
            )}

            {!isAdmin && !upload.brand && !upload.model && (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-4 text-xs text-zinc-500">
                Car details not filled in yet. Admins can add brand, model, generation &amp; trim.
              </div>
            )}
          </aside>
        </div>

        {/* ─── Multi Spot section ─── */}
        {otherSightings.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-lg font-semibold">📍 Multi Spots</h2>
              <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-xs text-blue-400 font-medium">
                {otherSightings.length} other sighting{otherSightings.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-sm text-zinc-400 mb-5">
              <span className="font-mono font-bold text-zinc-200">{upload.plateText}</span> has been spotted {otherSightings.length + 1} times in {meta.name} by the community.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {otherSightings.map((s) => (
                <a
                  key={s.numericId}
                  href={`/spot/${s.numericId}`}
                  className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-blue-800 transition-colors"
                >
                  <div className="aspect-video bg-zinc-950 overflow-hidden">
                    <img
                      src={s.imageUrl}
                      alt={upload.plateText}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {s.user.avatarUrl ? (
                        <img src={s.user.avatarUrl} alt={s.user.username} className="h-6 w-6 rounded-lg object-cover" />
                      ) : (
                        <div className="h-6 w-6 rounded-lg bg-zinc-800 grid place-items-center text-[9px] font-bold text-zinc-500">
                          {s.user.username.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs text-zinc-400">@{s.user.username}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>{fmtShort(s.createdAt)}</span>
                      <span>♡ {s._count.likes}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

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
