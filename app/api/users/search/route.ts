import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// GET /api/users/search?q=aya&limit=5
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? "5"), 10);

  if (!q || q.length < 1) return NextResponse.json({ users: [] });

  const users = await prisma.user.findMany({
    where: { username: { contains: q, mode: "insensitive" } },
    select: { numericId: true, username: true, avatarUrl: true },
    take: limit,
    orderBy: { username: "asc" },
  });

  return NextResponse.json({ users });
}
