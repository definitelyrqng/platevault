import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSessionUserWithBanCheck } from "@/app/lib/banCheck";

// GET /api/feed?cursor=&limit=12
// Returns spots from people the current user follows
export async function GET(req: Request) {
  const { user } = await getSessionUserWithBanCheck();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "12"), 30);
  const cursor = searchParams.get("cursor") ?? undefined;

  // Get the IDs of everyone this user follows
  const follows = await (prisma as any).follow.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  }) as { followingId: string }[];

  const followingIds = follows.map((f) => f.followingId);

  if (followingIds.length === 0) {
    return NextResponse.json({ spots: [], nextCursor: null });
  }

  const spots = await prisma.upload.findMany({
    where: {
      userId: { in: followingIds },
      deletedAt: null,
      hidden: false,
      ...(cursor ? { numericId: { lt: Number(cursor) } } : {}),
    },
    orderBy: { numericId: "desc" },
    take: limit + 1,
    select: {
      id: true,
      numericId: true,
      plateText: true,
      country: true,
      imageUrl: true,
      createdAt: true,
      brand: true,
      model: true,
      user: { select: { username: true, numericId: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  const hasMore = spots.length > limit;
  const items = hasMore ? spots.slice(0, limit) : spots;
  const nextCursor = hasMore ? String(items[items.length - 1].numericId) : null;

  return NextResponse.json({ spots: items, nextCursor });
}
