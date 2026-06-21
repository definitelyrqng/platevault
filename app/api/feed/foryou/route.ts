import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

// GET /api/feed/foryou?cursor=&limit=12
// Personalised feed ranked by countries + brands the user likes most.
// Falls back to hot/recent for logged-out users.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "12"), 30);
  const cursor = searchParams.get("cursor") ?? undefined;

  const user = await getCurrentUser();

  if (!user) {
    // Guest: return recent popular spots
    const spots = await prisma.upload.findMany({
      where: {
        deletedAt: null,
        hidden: false,
        ...(cursor ? { numericId: { lt: Number(cursor) } } : {}),
      },
      orderBy: [{ likes: { _count: "desc" } }, { numericId: "desc" }],
      take: limit + 1,
      select: {
        id: true, numericId: true, plateText: true, country: true,
        imageUrl: true, createdAt: true, brand: true, model: true,
        user: { select: { username: true, numericId: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    const hasMore = spots.length > limit;
    const items = hasMore ? spots.slice(0, limit) : spots;
    return NextResponse.json({ spots: items, nextCursor: hasMore ? String(items[items.length - 1].numericId) : null, personalised: false });
  }

  // Get user's liked uploads to extract top countries + brands
  const likedUploads = await prisma.like.findMany({
    where: { userId: user.id },
    select: { upload: { select: { country: true, brand: true } } },
    take: 200,
    orderBy: { createdAt: "desc" },
  });

  // Score countries and brands by frequency
  const countryScore: Record<string, number> = {};
  const brandScore: Record<string, number> = {};
  for (const l of likedUploads) {
    const c = l.upload?.country;
    const b = l.upload?.brand;
    if (c) countryScore[c] = (countryScore[c] ?? 0) + 1;
    if (b) brandScore[b] = (brandScore[b] ?? 0) + 1;
  }

  const topCountries = Object.entries(countryScore).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
  const topBrands = Object.entries(brandScore).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

  // Also get followed users' uploads as a signal
  const follows = await (prisma as any).follow.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  }) as { followingId: string }[];
  const followingIds = follows.map((f: { followingId: string }) => f.followingId);

  // Build OR conditions: prefer followed users AND top countries/brands
  const orConditions: any[] = [];
  if (followingIds.length > 0) orConditions.push({ userId: { in: followingIds } });
  if (topCountries.length > 0) orConditions.push({ country: { in: topCountries } });
  if (topBrands.length > 0) orConditions.push({ brand: { in: topBrands } });

  const whereClause: any = {
    deletedAt: null,
    hidden: false,
    NOT: { userId: user.id }, // don't show own spots
    ...(cursor ? { numericId: { lt: Number(cursor) } } : {}),
    ...(orConditions.length > 0 ? { OR: orConditions } : {}),
  };

  const spots = await prisma.upload.findMany({
    where: whereClause,
    orderBy: { numericId: "desc" },
    take: limit + 1,
    select: {
      id: true, numericId: true, plateText: true, country: true,
      imageUrl: true, createdAt: true, brand: true, model: true,
      user: { select: { username: true, numericId: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  const hasMore = spots.length > limit;
  const items = hasMore ? spots.slice(0, limit) : spots;

  return NextResponse.json({
    spots: items,
    nextCursor: hasMore ? String(items[items.length - 1].numericId) : null,
    personalised: true,
    topCountries,
    topBrands,
  });
}
