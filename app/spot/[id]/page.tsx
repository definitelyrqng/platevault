import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import SpotActions from "./SpotActions";
import CommentSection from "./CommentSection";
import AdminPanel from "./AdminPanel";
import ReportButton from "./ReportButton";
import RareButton from "@/app/components/RareButton";
import SaveToCollection from "@/app/components/SaveToCollection";
import ShareCardButton from "@/app/components/ShareCardButton";
import TagEditor from "./TagEditor";
import EditSpotDetails from "./EditSpotDetails";
import { tagById } from "@/app/lib/tags";
import { getAlbaniaRegion, ALBANIA_PLATE_TYPE_LABELS } from "@/app/lib/albaniaRegions";
import Flag from "@/app/components/Flag";
import { getCountryMeta } from "@/app/lib/countries";
import { AUSTRIA_PLATE_TYPE_LABELS } from "@/app/lib/austriaData";



function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-base">
      <span className="text-zinc-400 shrink-0">{label}</span>
      <span className="text-zinc-200 text-right">{value}</span>
    </div>
  );
}

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
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
        companyId: true,
        company: { select: { id: true, numericId: true, name: true, city: true, country: true } },
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
          <a href="/home" className="mt-6 inline-flex rounded-xl border border-indigo-900/40 bg-indigo-950/20 px-5 py-2.5 text-sm text-indigo-300 hover:bg-indigo-950/40 transition-colors">
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

  // ─── Rarity score ─────────────────────────────────────────────────────────
  const [sightingsCount, countryTotalSpots, rareVotesCount] = await Promise.all([
    // How many times has THIS plate text been spotted (including this spot)?
    prisma.upload.count({ where: { plateText: upload.plateText, country: upload.country, deletedAt: null } }),
    // How many spots total from this country?
    prisma.upload.count({ where: { country: upload.country, deletedAt: null, hidden: false } }),
    // Rare votes on this spot
    (prisma as any).rareVote.count({ where: { uploadId: upload.id } }),
  ]);

  // Compute rarity score 0-100
  // Fewer sightings = rarer. Each extra sighting -15 pts (capped at 0)
  const sightingPenalty = Math.min(75, (sightingsCount - 1) * 15);
  // Common country = less rare. Scale 0-20 based on country total (capped at 200 spots)
  const countryPenalty = Math.min(20, Math.floor((countryTotalSpots / 200) * 20));
  // Rare votes boost (up to +20)
  const rareBoost = Math.min(20, rareVotesCount * 2);

  const rarityScore = Math.max(0, Math.min(100, 80 - sightingPenalty - countryPenalty + rareBoost));

  const rarityLabel =
    rarityScore >= 80 ? { text: "Ultra Rare", color: "text-amber-300", bg: "bg-amber-950/30 border-amber-800/50", dot: "bg-amber-400" } :
    rarityScore >= 55 ? { text: "Rare",       color: "text-purple-300", bg: "bg-purple-950/30 border-purple-800/50", dot: "bg-purple-400" } :
    rarityScore >= 30 ? { text: "Uncommon",   color: "text-indigo-300", bg: "bg-indigo-950/30 border-indigo-800/50", dot: "bg-indigo-400" } :
                        { text: "Common",     color: "text-zinc-400",   bg: "bg-zinc-900/30 border-zinc-700/50",     dot: "bg-zinc-500" };

  // More from this country
  const moreFromCountry = await prisma.upload.findMany({
    where: { country: upload.country, deletedAt: null, hidden: false, NOT: { id: upload.id } },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true, numericId: true, plateText: true, imageUrl: true, brand: true, model: true,
      user: { select: { username: true } },
      _count: { select: { likes: true } },
    },
  });

  const meta = getCountryMeta(upload.country);

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
          <a href="/home" className="hover:text-indigo-300 transition-colors">Home</a>
          <span>›</span>
          <a href={`/c/${upload.country}`} className="hover:text-indigo-300 transition-colors inline-flex items-center gap-1"><Flag iso={meta.iso} />{meta.name}</a>
          {albaniaRegion && (
            <>
              <span>›</span>
              <span className="text-zinc-400">{albaniaRegion.city}</span>
            </>
          )}
          <span>›</span>
          <span className="font-mono text-zinc-300">{upload.plateText}</span>
          {otherSightings.length > 0 && (
            <span className="ml-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] text-indigo-400 font-medium">
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
                <span className="rounded-full bg-zinc-950/80 backdrop-blur border border-zinc-700 px-3 py-1 text-xs text-zinc-300 inline-flex items-center gap-1.5">
                  <Flag iso={meta.iso} />{meta.name}
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
                  {upload.brand && (
                    <a href={"/catalog/" + toSlug(upload.brand)} className="hover:text-blue-400 transition-colors">
                      {upload.brand}
                    </a>
                  )}
                  {upload.model && (
                    <a href={"/catalog/" + toSlug(upload.brand ?? "") + "/" + toSlug(upload.model)} className="hover:text-blue-400 transition-colors">
                      {upload.model}
                    </a>
                  )}
                  {upload.generation && (
                    <span className="text-zinc-400 text-base font-normal">{upload.generation}</span>
                  )}
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
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium border border-indigo-900/50 bg-indigo-950/20 text-indigo-300 hover:border-indigo-700/60 hover:bg-indigo-950/40 hover:text-indigo-200 transition-colors"
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
                    <img src={upload.user.avatarUrl} alt={upload.user.username} className="h-9 w-9 rounded-xl object-cover ring-2 ring-zinc-700 group-hover:ring-indigo-700/60 transition-all" />
                  ) : (
                    <div className="h-9 w-9 rounded-xl bg-zinc-800 grid place-items-center text-xs font-bold text-zinc-400 ring-2 ring-zinc-700 group-hover:ring-indigo-700/60 transition-all">
                      {upload.user.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors">@{upload.user.username}</div>
                    <div className="text-xs text-zinc-500">{relativeDays(upload.createdAt)}</div>
                  </div>
                </a>
              </div>

              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <SpotActions
                    uploadId={upload.id}
                    initialLikes={upload._count.likes}
                    hasLiked={hasLiked}
                    isOwner={isOwner}
                    isLoggedIn={!!currentUser}
                  />
                </div>
                <RareButton spotNumericId={upload.numericId} />
                <SaveToCollection spotNumericId={upload.numericId} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 text-xs text-zinc-500">
                <div className="flex gap-4">
                  <span>{upload._count.likes} like{upload._count.likes !== 1 ? "s" : ""}</span>
                  <span>{upload._count.comments} comment{upload._count.comments !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShareCardButton
                    imageUrl={upload.imageUrl}
                    plateText={upload.plateText}
                    countryName={meta.name}
                    carLabel={carLabel}
                  />
                  {currentUser && !isOwner && (
                    <ReportButton uploadNumericId={upload.numericId} />
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Details</div>
              <div className="flex items-start justify-between gap-3 text-base"><span className="text-zinc-400 shrink-0">Country</span><span className="inline-flex items-center gap-1.5 text-zinc-200"><Flag iso={meta.iso} />{meta.name}</span></div>
              {albaniaRegion && (
                <Detail label="Region" value={albaniaRegion.district} />
              )}
              {upload.location  && <Detail label="Location"   value={upload.location} />}
              {upload.plateType && <Detail label="Plate type" value={ALBANIA_PLATE_TYPE_LABELS[upload.plateType] ?? AUSTRIA_PLATE_TYPE_LABELS[upload.plateType] ?? upload.plateType.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())} />}
              {upload.badge      && <Detail label="Badge"      value={upload.badge} />}
              {upload.color      && <Detail label="Color"      value={upload.color} />}
              {upload.trim       && <Detail label="Trim"       value={upload.trim} />}
              {upload.company && (
                <div className="flex items-start justify-between gap-2 py-0.5">
                  <span className="text-xs text-zinc-500 shrink-0">Company</span>
                  <a href={"/companies/" + upload.company.numericId}
                    className="relative z-10 text-xs text-zinc-200 text-right hover:text-white transition-colors">
                    {upload.company.name}
                    {upload.company.city && <span className="text-zinc-500 ml-1">{upload.company.city}</span>}
                  </a>
                </div>
              )}
              {upload.generation && <Detail label="Generation" value={upload.generation} />}
              <div className="border-t border-zinc-800 pt-3">
                <Detail label="Date" value={fmt(upload.createdAt)} />
              </div>
              {isOwner && (
                <div className="border-t border-zinc-800 pt-3">
                  <EditSpotDetails
                    uploadId={upload.id}
                    initial={{
                      brand: upload.brand,
                      model: upload.model,
                      generation: upload.generation,
                      trim: upload.trim,
                      color: upload.color,
                      badge: upload.badge,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Rarity score */}
            <div className={`rounded-2xl border p-4 ${rarityLabel.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${rarityLabel.dot}`} />
                  <span className={`text-sm font-semibold ${rarityLabel.color}`}>{rarityLabel.text}</span>
                </div>
                <span className={`text-lg font-bold tabular-nums ${rarityLabel.color}`}>{rarityScore}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    rarityScore >= 80 ? "bg-amber-400" :
                    rarityScore >= 55 ? "bg-purple-400" :
                    rarityScore >= 30 ? "bg-indigo-400" : "bg-zinc-500"
                  }`}
                  style={{ width: `${rarityScore}%` }}
                />
              </div>
              <div className="mt-2 text-[10px] text-zinc-600 space-y-0.5">
                <div>{sightingsCount} sighting{sightingsCount !== 1 ? "s" : ""} · {rareVotesCount} rare vote{rareVotesCount !== 1 ? "s" : ""}</div>
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
                initialCompanyId={upload.companyId}
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
            <div className="flex items-center gap-3 mb-4">
              <div className="h-5 w-1 rounded-full bg-indigo-500" />
              <h2 className="text-lg font-semibold text-zinc-100">Multi Spots</h2>
              <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 text-xs text-indigo-400 font-medium">
                📍 {otherSightings.length} other sighting{otherSightings.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-sm text-zinc-400 mb-5">
              <span className="font-mono font-bold text-indigo-200">{upload.plateText}</span> has been spotted {otherSightings.length + 1} times in {meta.name} by the community.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {otherSightings.map((s) => (
                <a
                  key={s.numericId}
                  href={`/spot/${s.numericId}`}
                  className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-indigo-800/60 hover:shadow-md hover:shadow-indigo-950/40 transition-all"
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
                      <span className="text-xs text-zinc-400 group-hover:text-indigo-300 transition-colors">@{s.user.username}</span>
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

        {/* ─── More from this country ─── */}
        {moreFromCountry.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-5 w-1 rounded-full bg-indigo-500" />
                <h2 className="text-lg font-semibold text-zinc-100">More from {meta.name}</h2>
              </div>
              <a href={`/c/${upload.country}`} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Browse all →
              </a>
            </div>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              {moreFromCountry.map((s) => (
                <a
                  key={s.id}
                  href={`/spot/${s.numericId}`}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-indigo-800/60 hover:shadow-md hover:shadow-indigo-950/40 transition-all"
                >
                  <div className="aspect-video bg-zinc-950 overflow-hidden">
                    <img src={s.imageUrl} alt={s.plateText} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                  <div className="p-2.5">
                    <div className="font-mono text-xs font-bold tracking-widest text-zinc-300 group-hover:text-indigo-200 transition-colors truncate">{s.plateText}</div>
                    <div className="text-[10px] text-zinc-600 mt-0.5">♡ {s._count.likes}</div>
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
