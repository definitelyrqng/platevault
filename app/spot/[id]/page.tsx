import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import SpotActions from "./SpotActions";
import CommentSection from "./CommentSection";
import SpotModPanel from "./SpotModPanel";
import ReportButton from "./ReportButton";
import SaveToCollection from "@/app/components/SaveToCollection";
import ShareCardButton from "@/app/components/ShareCardButton";
import TimeAgo from "@/app/components/TimeAgo";
import GenerationLink from "@/app/components/GenerationLink";
import { codeSlug, platformOf } from "@/app/lib/chassis";
import EditSpotDetails from "./EditSpotDetails";
import { DescriptionText } from "@/app/components/DescriptionInput";
import PinButton from "@/app/components/PinButton";
import AddToRoadTripButton from "./AddToRoadTripButton";
import { tagById } from "@/app/lib/tags";
import { getAlbaniaRegion } from "@/app/lib/albaniaRegions";
import { plateTypeLabel } from "@/app/lib/plateTypes";
import Flag from "@/app/components/Flag";
import PlateBadge, { formatPlateText } from "@/app/components/PlateBadge";
import SpotCard from "@/app/components/SpotCard";
import { getCountryMeta } from "@/app/lib/countries";
import { GERMANY_REGIONS, GERMANY_FEDERAL_BD, GERMANY_BP_VEHICLE_TYPES, GERMANY_BW_BRANCHES } from "@/app/lib/germanyData";
import { CZECH_REGIONS_2001, CZECH_REGIONS_1960, CZECH_REGION_NUMS } from "@/app/lib/czechData";

function getGermanyDistrict(regionCode: string | null): string | null {
  if (!regionCode) return null;
  return GERMANY_REGIONS.find((r) => r.code === regionCode.toUpperCase())?.name ?? null;
}

// For federal plates: decode the embedded number from the plate text
function getGermanyFederalInfo(plateText: string, plateType: string | null): string | null {
  if (!plateType) return null;
  const numMatch = plateText.match(/(?:BD|BP|BW)\s+(\d+)/i);
  const num = numMatch ? parseInt(numMatch[1], 10) : null;
  if (plateType === "de-federal-bd") {
    if (num === null) return "Federal Ministry Vehicles (BD)";
    const agency = GERMANY_FEDERAL_BD.find((a) => a.num === num);
    return agency ? `${agency.short} — ${agency.name}` : `BD ${num}`;
  }
  if (plateType === "de-federal-bp") {
    if (num === null) return "Federal Police (BP)";
    const vtype = GERMANY_BP_VEHICLE_TYPES.find((v) => v.code === num);
    return vtype ? `Federal Police · ${vtype.label}` : `Federal Police · BP ${num}`;
  }
  if (plateType === "de-federal-bw") {
    if (num === null) return "Federal Waterways (BW)";
    const branch = GERMANY_BW_BRANCHES.find((b) => b.num === num);
    return branch ? `Federal Waterways · ${branch.name} (${branch.city})` : `Federal Waterways · BW ${num}`;
  }
  if (plateType === "de-federal-thw") return "Federal Relief (THW)";
  return null;
}

function getCzechRegion(plateRegion: string | null, plateType: string | null): string | null {
  if (!plateRegion) return null;
  // 2001-system: single letter
  if (plateRegion.length === 1) {
    return CZECH_REGIONS_2001.find((r) => r.code === plateRegion.toUpperCase())?.name ?? null;
  }
  // Sport/oldtimer numeric: "01"–"14"
  if (/^\d{2}$/.test(plateRegion)) {
    return CZECH_REGION_NUMS.find((r) => r.code === plateRegion)?.name ?? null;
  }
  // 1960-system: two-letter district
  return CZECH_REGIONS_1960.find((r) => r.code === plateRegion.toUpperCase())?.name ?? null;
}



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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) return {};
  const spot = await prisma.upload.findFirst({
    where: { numericId, deletedAt: null },
    select: { plateText: true, country: true, brand: true, model: true, imageUrl: true, user: { select: { username: true } } },
  });
  if (!spot) return {};
  const label = [spot.plateText, spot.brand, spot.model].filter(Boolean).join(" · ");
  const countryUpper = spot.country.toUpperCase();
  const title = `${spot.plateText} (${countryUpper})`;
  const desc = `${label} — spotted by @${spot.user.username} on PlateVault.`;
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, images: spot.imageUrl ? [{ url: spot.imageUrl }] : [] },
    twitter: { card: "summary_large_image", title, description: desc, images: spot.imageUrl ? [spot.imageUrl] : [] },
  };
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
        description: true,
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

  // Everything below is independent — fetch it all at once instead of one query after another
  const isOwnerEarly = currentUser?.id === upload.userId;
  const [otherSightings, moreFromCountry, moreFromModel, ownerPinned] = await Promise.all([
  // Other sightings of the same plate
  prisma.upload.findMany({
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
  }),

  // More from this country
  prisma.upload.findMany({
    where: { country: upload.country, deletedAt: null, hidden: false, NOT: { id: upload.id } },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true, numericId: true, plateText: true, plateType: true, imageUrl: true, brand: true, model: true,
      user: { select: { username: true } },
      _count: { select: { likes: true } },
    },
  }),

  // More from same car model (if brand+model known)
  (upload.brand && upload.model)
    ? prisma.upload.findMany({
        where: {
          brand: upload.brand,
          model: upload.model,
          deletedAt: null,
          hidden: false,
          NOT: { id: upload.id },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true, numericId: true, plateText: true, plateType: true, imageUrl: true,
          country: true, brand: true, model: true,
          _count: { select: { likes: true } },
        },
      })
    : Promise.resolve([]),

  // The owner's pinned spots (only needed on their own spot)
  isOwnerEarly
    ? prisma.user.findUnique({ where: { id: currentUser!.id }, select: { pinnedSpotIds: true } })
    : Promise.resolve(null),
  ]);

  const meta = getCountryMeta(upload.country);

  // Albania region lookup
  const albaniaRegion = upload.country === "albania" && upload.plateRegion
    ? getAlbaniaRegion(upload.plateRegion)
    : undefined;

  // Germany district lookup
  const germanyDistrict = upload.country === "germany"
    ? getGermanyDistrict(upload.plateRegion)
    : null;

  // Germany federal info (BD/BP/BW/THW — number in plate text)
  const germanyFederal = upload.country === "germany" && upload.plateType?.startsWith("de-federal-")
    ? getGermanyFederalInfo(upload.plateText, upload.plateType)
    : null;

  // Czech region lookup
  const czechRegion = upload.country === "czech"
    ? getCzechRegion(upload.plateRegion, upload.plateType)
    : null;

  const isOwner = currentUser?.id === upload.userId;
  const hasLiked = upload.likes.some((l) => l.userId === currentUser?.id);
  const ownerPinnedIds = ownerPinned?.pinnedSpotIds ?? [];
  const isCurrentlyPinned = ownerPinnedIds.includes(upload.id);
  const isAdmin = currentUser?.role === "SUPERADMIN" || currentUser?.role === "ADMIN";
  const isMod = isAdmin || currentUser?.role === "MOD";

  const carLabel = [upload.brand, upload.model].filter(Boolean).join(" ");
  const fullCarLabel = [upload.brand, upload.model, upload.generation].filter(Boolean).join(" ");
  const plateTypeName = plateTypeLabel(upload.country, upload.plateType);

  return (
    <main className="text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">

        {/* ─── Title bar: plate number + quick links (PlatesMania style) ─── */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-zinc-800/60 pb-4">
          <h1 className="font-plate text-3xl tracking-wide text-white sm:text-4xl">
            {formatPlateText(upload.country, upload.plateText)}
          </h1>
          <nav className="flex items-center gap-2 text-sm text-zinc-500">
            <a href={`/c/${upload.country}`} className="transition-colors hover:text-white">{meta.name} gallery</a>
            <span className="text-zinc-700">/</span>
            <a href="/search" className="transition-colors hover:text-white">Search</a>
            <span className="text-zinc-700">/</span>
            <a href="/upload" className="transition-colors hover:text-white">Upload</a>
          </nav>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_310px]">
          {/* ─── Left: spot + comments ─── */}
          <div className="space-y-6">

            <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
              {/* Country / region header */}
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/70 px-4 py-2.5 sm:px-5">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <a href={`/c/${upload.country}`} className="inline-flex items-center gap-2 font-semibold text-zinc-100 transition-colors hover:text-indigo-300">
                    <Flag iso={meta.iso} /> {meta.name}
                  </a>
                  {[albaniaRegion?.city, germanyDistrict, germanyFederal, czechRegion].filter(Boolean).map((r) => (
                    <span key={r as string} className="text-zinc-500">· {r}</span>
                  ))}
                </div>
                {otherSightings.length > 0 && (
                  <a href="#multispots" className="rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-0.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/25">
                    Spotted {otherSightings.length + 1}×
                  </a>
                )}
              </header>

              <div className="px-3 pb-7 pt-3 sm:px-5 sm:pt-5">
                {/* Photo */}
                <div className="overflow-hidden rounded-xl bg-black">
                  <img
                    src={upload.imageUrl}
                    alt={`${upload.plateText} — ${meta.name}`}
                    className="mx-auto max-h-[70vh] w-full object-contain"
                  />
                </div>

                {/* Vehicle, plate, place & date — centred */}
                <div className="mt-6 flex flex-col items-center text-center">
                  <h2 className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-2xl font-semibold tracking-tight text-zinc-100">
                    {fullCarLabel ? (
                      <>
                        {upload.brand && (
                          <a href={"/catalog/" + toSlug(upload.brand)} className="transition-colors hover:text-indigo-400">
                            {upload.brand}
                          </a>
                        )}
                        {upload.model && (
                          <a href={"/catalog/" + toSlug(upload.brand ?? "") + "/" + toSlug(upload.model)} className="transition-colors hover:text-indigo-400">
                            {upload.model}
                          </a>
                        )}
                        {upload.badge && (
                          <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-sm text-zinc-300">
                            {upload.badge}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-zinc-500">Unknown vehicle</span>
                    )}
                  </h2>
                  {(upload.generation || upload.trim) && (
                    <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-zinc-400">
                      {upload.generation && upload.brand && upload.model ? (
                        /* one link, shown exactly as named — opens every {model} on that platform */
                        <GenerationLink name={upload.generation} brandSlug={toSlug(upload.brand)} modelSlug={toSlug(upload.model)} />
                      ) : upload.generation}
                      {upload.generation && upload.trim && <span className="text-zinc-600">·</span>}
                      {upload.trim}
                    </div>
                  )}

                  {/* The plate — big and centred */}
                  <div className="mt-6 max-w-full">
                    <div className="hidden sm:block">
                      <PlateBadge country={upload.country} text={upload.plateText} plateType={upload.plateType} size="xl" />
                    </div>
                    <div className="sm:hidden">
                      <PlateBadge country={upload.country} text={upload.plateText} plateType={upload.plateType} size="lg" />
                    </div>
                  </div>

                  {upload.location && (
                    <div className="mt-4 text-sm text-zinc-400">{upload.location}</div>
                  )}

                  {upload.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                      {upload.tags.map((tag) => {
                        const def = tagById(tag);
                        if (!def) return null;
                        return (
                          <a
                            key={tag}
                            href={"/tags/" + tag}
                            className="rounded-full border border-indigo-900/50 bg-indigo-950/20 px-2.5 py-0.5 text-xs font-medium text-indigo-300 transition-colors hover:border-indigo-700/60 hover:bg-indigo-950/40 hover:text-indigo-200"
                          >
                            #{def.label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </article>

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
                <a href={`/u/${upload.user.numericId}`} className="group shrink-0" aria-label={`@${upload.user.username}`}>
                  {upload.user.avatarUrl ? (
                    <img src={upload.user.avatarUrl} alt={upload.user.username} className="h-9 w-9 rounded-xl object-cover ring-2 ring-zinc-700 group-hover:ring-indigo-700/60 transition-all" />
                  ) : (
                    <div className="h-9 w-9 rounded-xl bg-zinc-800 grid place-items-center text-xs font-bold text-zinc-400 ring-2 ring-zinc-700 group-hover:ring-indigo-700/60 transition-all">
                      {upload.user.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </a>
                <div className="min-w-0">
                  <a href={`/u/${upload.user.numericId}`} className="block text-sm font-medium text-zinc-200 hover:text-indigo-300 transition-colors">@{upload.user.username}</a>
                  {/* hover shows the exact upload time (DD:MM:YYYY HH:MM:SS, viewer's timezone) */}
                  <TimeAgo iso={upload.createdAt.toISOString()} label={relativeDays(upload.createdAt)} className="text-xs text-zinc-500" />
                </div>
              </div>

              {/* Main action row */}
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
                <SaveToCollection spotNumericId={upload.numericId} />
              </div>
              {/* Owner actions row */}
              {isOwner && (
                <div className="flex gap-2 mt-2">
                  <PinButton uploadId={upload.id} initialPinned={isCurrentlyPinned} pinnedCount={ownerPinnedIds.length} />
                  <AddToRoadTripButton uploadId={upload.id} uploadNumericId={upload.numericId} />
                </div>
              )}
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

              {/* Quick links */}
              <ul className="mt-4 space-y-1.5 border-t border-zinc-800 pt-4 text-sm">
                <li>
                  <a href={`/c/${upload.country}`} className="flex items-center gap-2 text-zinc-300 transition-colors hover:text-white">
                    <Flag iso={meta.iso} size="sm" /> {meta.name} gallery
                  </a>
                </li>
                {upload.plateType && plateTypeName && (
                  <li>
                    <a href={`/c/${upload.country}?type=${encodeURIComponent(upload.plateType)}`} className="flex items-center gap-2 text-zinc-300 transition-colors hover:text-white">
                      <span className="w-4 text-center text-zinc-500">▤</span> {plateTypeName} plates
                    </a>
                  </li>
                )}
                {upload.brand && upload.model && (
                  <li>
                    <a href={"/catalog/" + toSlug(upload.brand) + "/" + toSlug(upload.model)} className="flex items-center gap-2 text-zinc-300 transition-colors hover:text-white">
                      <span className="w-4 text-center text-zinc-500">◈</span> All {carLabel}
                    </a>
                  </li>
                )}
                {upload.brand && upload.model && upload.generation && platformOf(upload.generation) && (
                  <li>
                    <a href={"/catalog/" + toSlug(upload.brand) + "/" + toSlug(upload.model) + "?platform=" + codeSlug(platformOf(upload.generation)!)}
                      className="flex items-center gap-2 text-zinc-300 transition-colors hover:text-white">
                      <span className="w-4 text-center text-zinc-500">⚙</span> All {upload.model} {platformOf(upload.generation)}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Details */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Details</div>
              <div className="flex items-start justify-between gap-3 text-base"><span className="text-zinc-400 shrink-0">Country</span><span className="inline-flex items-center gap-1.5 text-zinc-200"><Flag iso={meta.iso} />{meta.name}</span></div>
              {albaniaRegion && (
                <Detail label="Region" value={albaniaRegion.district} />
              )}
              {germanyDistrict && (
                <Detail label="District" value={germanyDistrict} />
              )}
              {germanyFederal && (
                <Detail label="Federal" value={germanyFederal} />
              )}
              {czechRegion && (
                <Detail label="Region" value={czechRegion} />
              )}
              {/* ── Description ── */}
              {upload.description && (
                <div className="border-t border-zinc-800/60 pt-3">
                  <DescriptionText text={upload.description} />
                </div>
              )}

              {upload.location  && <Detail label="Location"   value={upload.location} />}
              {plateTypeName && <Detail label="Plate type" value={plateTypeName} />}
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
                      description: upload.description ?? null,
                    }}
                  />
                </div>
              )}
            </div>

            {/* One moderation panel per spot (mods: hide + tags; admins: everything) */}
            {isMod && (
              <SpotModPanel
                uploadId={upload.id}
                role={currentUser!.role as "SUPERADMIN" | "ADMIN" | "MOD"}
                initialHidden={upload.hidden}
                initial={{
                  plateText: upload.plateText,
                  plateType: upload.plateType ?? "",
                  plateRegion: upload.plateRegion ?? "",
                  country: upload.country,
                  location: upload.location ?? "",
                  description: upload.description ?? "",
                  brand: upload.brand ?? "",
                  model: upload.model ?? "",
                  generation: upload.generation ?? "",
                  trim: upload.trim ?? "",
                  color: upload.color ?? "",
                  badge: upload.badge ?? "",
                  companyId: upload.companyId,
                  tags: upload.tags,
                }}
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
          <section id="multispots" className="mt-12 scroll-mt-20">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-zinc-100">Multi Spots</h2>
              <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 text-xs text-indigo-400 font-medium">
                📍 {otherSightings.length} other sighting{otherSightings.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-sm text-zinc-400 mb-5">
              <span className="font-mono font-bold text-indigo-200">{upload.plateText}</span> has been spotted {otherSightings.length + 1} times in {meta.name} by the community.
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {otherSightings.map((s) => (
                <SpotCard
                  key={s.numericId}
                  showFlag={false}
                  spot={{ ...s, plateText: upload.plateText, plateType: upload.plateType, country: upload.country, brand: upload.brand, model: upload.model }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── More from this country ─── */}
        {/* ─── More from same car model ─── */}
        {moreFromModel.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-zinc-100 mb-4">More {upload.brand} {upload.model}</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
              {moreFromModel.map((s) => (
                <SpotCard key={s.id} spot={s} />
              ))}
            </div>
          </section>
        )}

        {/* ─── More from this country ─── */}
        {moreFromCountry.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-zinc-100">More from {meta?.name ?? upload.country}</h2>
              </div>
              <a href={`/c/${upload.country}`} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Browse all →
              </a>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
              {moreFromCountry.map((s) => (
                <SpotCard key={s.id} showFlag={false} spot={{ ...s, country: upload.country }} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
