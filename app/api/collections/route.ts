import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSessionUserWithBanCheck } from "@/app/lib/banCheck";

// GET  /api/collections          → list own collections (or ?userId=numericId for public)
// POST /api/collections          → create new collection

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get("userId");

  if (userIdParam) {
    // Public profile — show public collections
    const target = await prisma.user.findUnique({
      where: { numericId: Number(userIdParam) },
      select: { id: true },
    });
    if (!target) return NextResponse.json({ collections: [] });

    const collections = await (prisma as any).collection.findMany({
      where: { userId: target.id, isPublic: true },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { items: true } },
        items: { take: 3, orderBy: { addedAt: "desc" }, include: { upload: { select: { imageUrl: true, numericId: true } } } },
      },
    });
    return NextResponse.json({ collections });
  }

  const { user } = await getSessionUserWithBanCheck();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const collections = await (prisma as any).collection.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { items: true } },
      items: { take: 3, orderBy: { addedAt: "desc" }, include: { upload: { select: { imageUrl: true, numericId: true } } } },
    },
  });

  return NextResponse.json({ collections });
}

export async function POST(req: Request) {
  const { user, banError } = await getSessionUserWithBanCheck();
  if (!user) return NextResponse.json({ error: "Sign in to create collections." }, { status: 401 });
  if (banError) return NextResponse.json({ error: banError }, { status: 403 });

  const body = await req.json();
  const name = (body.name ?? "").trim().slice(0, 80);
  const description = (body.description ?? "").trim().slice(0, 280) || null;
  const isPublic = body.isPublic !== false;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const collection = await (prisma as any).collection.create({
    data: { userId: user.id, name, description, isPublic },
  });

  return NextResponse.json({ collection }, { status: 201 });
}
