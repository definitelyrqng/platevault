import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSessionUserWithBanCheck } from "@/app/lib/banCheck";

// POST  /api/follow/[id]  → follow user [id]
// DELETE /api/follow/[id] → unfollow
// GET   /api/follow/[id]  → { following: bool, followerCount, followingCount }

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = Number(id);

  const target = await prisma.user.findUnique({
    where: { numericId },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [followerCount, followingCount] = await Promise.all([
    (prisma as any).follow.count({ where: { followingId: target.id } }),
    (prisma as any).follow.count({ where: { followerId: target.id } }),
  ]);

  // Check if current user is following
  const { user } = await getSessionUserWithBanCheck();
  let following = false;
  if (user) {
    const exists = await (prisma as any).follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: target.id } },
    });
    following = !!exists;
  }

  return NextResponse.json({ following, followerCount, followingCount });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, banError } = await getSessionUserWithBanCheck();
  if (!user) return NextResponse.json({ error: "Sign in to follow." }, { status: 401 });
  if (banError) return NextResponse.json({ error: banError }, { status: 403 });

  const { id } = await params;
  const numericId = Number(id);

  const target = await prisma.user.findUnique({
    where: { numericId },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "Can't follow yourself." }, { status: 400 });

  try {
    await (prisma as any).follow.create({
      data: { followerId: user.id, followingId: target.id },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Already following" }, { status: 409 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await getSessionUserWithBanCheck();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numericId = Number(id);

  const target = await prisma.user.findUnique({
    where: { numericId },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await (prisma as any).follow.deleteMany({
    where: { followerId: user.id, followingId: target.id },
  });
  return NextResponse.json({ ok: true });
}
