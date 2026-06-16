import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// GET /api/leaderboard?tab=spots|likes|countries
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") ?? "spots";

  if (tab === "spots") {
    // Top uploaders by spot count
    const users = await prisma.user.findMany({
      where: { uploads: { some: { deletedAt: null } } },
      select: {
        numericId: true,
        username: true,
        avatarUrl: true,
        _count: { select: { uploads: true } },
      },
      orderBy: { uploads: { _count: "desc" } },
      take: 20,
    });
    return NextResponse.json({ users: users.map((u) => ({ ...u, value: u._count.uploads })) });
  }

  if (tab === "likes") {
    // Top users by total likes received
    const raw = await prisma.user.findMany({
      select: {
        numericId: true,
        username: true,
        avatarUrl: true,
        uploads: {
          where: { deletedAt: null },
          select: { _count: { select: { likes: true } } },
        },
      },
      take: 100,
    });
    const sorted = raw
      .map((u) => ({
        numericId: u.numericId,
        username: u.username,
        avatarUrl: u.avatarUrl,
        value: u.uploads.reduce((acc, up) => acc + up._count.likes, 0),
      }))
      .filter((u) => u.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
    return NextResponse.json({ users: sorted });
  }

  if (tab === "countries") {
    // Top users by distinct countries spotted
    const raw = await prisma.user.findMany({
      select: {
        numericId: true,
        username: true,
        avatarUrl: true,
        uploads: {
          where: { deletedAt: null, hidden: false },
          select: { country: true },
        },
      },
      take: 200,
    });
    const sorted = raw
      .map((u) => ({
        numericId: u.numericId,
        username: u.username,
        avatarUrl: u.avatarUrl,
        value: new Set(u.uploads.map((up) => up.country)).size,
      }))
      .filter((u) => u.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
    return NextResponse.json({ users: sorted });
  }

  return NextResponse.json({ users: [] });
}
