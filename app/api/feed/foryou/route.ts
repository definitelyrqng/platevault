import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { vehicleKey } from "@/app/lib/vehicles";

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

const POOL = 600;          // newest visible spots that are ranked on every request
const MAX_PAGES = 12;      // how deep the feed goes

/** Stable pseudo-random 0..1 for a (user, day, spot) so the order does not reshuffle between pages. */
function jitter(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
}

/** share of the user's taste that a value represents (0..1), from a frequency map */
function share(map: Map<string, number>, key: string | null | undefined, total: number): number {
  if (!key || !total) return 0;
  return (map.get(key) ?? 0) / total;
}

function bump(map: Map<string, number>, key: string | null | undefined, by = 1) {
  if (key) map.set(key, (map.get(key) ?? 0) + by);
}

// GET /api/feed/foryou?cursor=<offset>&limit=12
// Ranks the newest spots by: who you follow, the countries / brands / models / tags you like and spot yourself,
// how popular and how fresh a spot is. Skips what you already liked and your own spots, shows each plate once,
// and keeps one spotter from filling the page.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "12") || 12, 1), 30);
  const offset = Math.max(Number(searchParams.get("cursor") ?? "0") || 0, 0);

  const user = await getCurrentUser();

  const [pool, liked, own, follows] = await Promise.all([
    prisma.upload.findMany({
      where: { deletedAt: null, hidden: false, ...(user ? { NOT: { userId: user.id } } : {}) },
      orderBy: { numericId: "desc" },
      take: POOL,
      select: {
        id: true, numericId: true, plateText: true, plateType: true, country: true, tags: true,
        imageUrl: true, createdAt: true, brand: true, model: true, userId: true,
        user: { select: { username: true, numericId: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    user ? prisma.like.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: { uploadId: true, upload: { select: { country: true, brand: true, model: true, tags: true } } },
    }) : Promise.resolve([]),
    user ? prisma.upload.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { country: true, brand: true, model: true },
    }) : Promise.resolve([]),
    user ? prisma.follow.findMany({ where: { followerId: user.id }, select: { followingId: true } }) : Promise.resolve([]),
  ]);

  // ── taste profile: likes count fully, your own spots count half ──
  const countries = new Map<string, number>(), brands = new Map<string, number>(), models = new Map<string, number>(), tags = new Map<string, number>();
  let nLikes = 0;
  for (const l of liked) {
    const u = l.upload; if (!u) continue;
    nLikes++;
    bump(countries, u.country); bump(brands, u.brand);
    bump(models, u.brand && u.model ? `${u.brand} ${u.model}` : null);
    for (const t of u.tags ?? []) bump(tags, t);
  }
  for (const o of own) {
    nLikes += 0.5;
    bump(countries, o.country, 0.5); bump(brands, o.brand, 0.5);
    bump(models, o.brand && o.model ? `${o.brand} ${o.model}` : null, 0.5);
  }
  const likedIds = new Set(liked.map((l) => l.uploadId));
  const following = new Set(follows.map((f) => f.followingId));
  const personalised = !!user && (nLikes > 0 || following.size > 0);
  const day = Math.floor(Date.now() / 86_400_000);

  // ── score ──
  type Scored = { s: (typeof pool)[number]; score: number; reason: string | null };
  const seenPlate = new Set<string>();
  const scored: Scored[] = [];
  for (const s of pool) {
    if (likedIds.has(s.id)) continue;
    const vk = vehicleKey(s);
    if (seenPlate.has(vk)) continue;                           // each plate once (pool is newest first)
    seenPlate.add(vk);

    const ageDays = (Date.now() - s.createdAt.getTime()) / 86_400_000;
    const fresh = 3 * Math.exp(-ageDays / 10);
    const popular = Math.log1p(s._count.likes) * 1.2 + Math.log1p(s._count.comments) * 0.6;

    let score = fresh + popular;
    let reason: string | null = null;
    if (personalised) {
      const modelKey = s.brand && s.model ? `${s.brand} ${s.model}` : null;
      const fol = following.has(s.userId) ? 5 : 0;
      const cShare = share(countries, s.country, nLikes), bShare = share(brands, s.brand, nLikes), mShare = share(models, modelKey, nLikes);
      const tagHits = (s.tags ?? []).filter((t) => tags.has(t)).length;
      score += fol + cShare * 6 + bShare * 5 + mShare * 6 + Math.min(tagHits, 3) * 0.8;
      // the strongest signal becomes the label
      const cand: [number, string | null][] = [
        [fol, "From someone you follow"],
        [mShare * 6, modelKey ? `You like the ${modelKey}` : null],
        [bShare * 5, s.brand ? `You like ${s.brand}` : null],
        [cShare * 6, `More from ${s.country}`],
        [Math.min(tagHits, 3) * 0.8, tagHits ? "Matches tags you like" : null],
      ];
      const best = cand.sort((a, b) => b[0] - a[0])[0];
      reason = best[0] >= 0.8 ? best[1] : null;
    }
    score += jitter(`${user?.id ?? "guest"}:${day}:${s.id}`) * 1.2;   // a little variety, stable for the day
    scored.push({ s, score, reason });
  }

  // ── diversity: greedy pick, every extra spot from the same spotter / country in a row is worth less ──
  const left = scored.sort((a, b) => b.score - a.score);
  const ranked: Scored[] = [];
  const perUser = new Map<string, number>(), perCountry = new Map<string, number>();
  while (left.length && ranked.length < limit * MAX_PAGES) {
    let bestI = 0, bestV = -Infinity;
    const window = Math.min(left.length, 40);
    for (let i = 0; i < window; i++) {
      const c = left[i];
      const v = c.score * Math.pow(0.7, perUser.get(c.s.userId) ?? 0) * Math.pow(0.93, perCountry.get(c.s.country) ?? 0);
      if (v > bestV) { bestV = v; bestI = i; }
    }
    const [pick] = left.splice(bestI, 1);
    ranked.push(pick);
    perUser.set(pick.s.userId, (perUser.get(pick.s.userId) ?? 0) + 1);
    perCountry.set(pick.s.country, (perCountry.get(pick.s.country) ?? 0) + 1);
  }

  const page = ranked.slice(offset, offset + limit);
  const nextCursor = offset + limit < ranked.length ? String(offset + limit) : null;
  const top = (m: Map<string, number>, n: number) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);

  return NextResponse.json({
    spots: page.map(({ s, reason }) => ({ ...s, userId: undefined, reason })),
    nextCursor,
    personalised,
    loggedIn: !!user,
    topCountries: top(countries, 5),
    topBrands: top(brands, 5),
  });
}
