import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSessionUserWithBanCheck } from "@/app/lib/banCheck";

// GET    /api/collections/[id]  → collection detail + items
// PATCH  /api/collections/[id]  → update name/description/isPublic
// DELETE /api/collections/[id]  → delete collection

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = Number(id);

  const collection = await (prisma as any).collection.findUnique({
    where: { numericId },
    include: {
      user: { select: { username: true, numericId: true, avatarUrl: true } },
      _count: { select: { items: true } },
      items: {
        orderBy: { addedAt: "desc" },
        include: {
          upload: {
            select: {
              id: true, numericId: true, plateText: true, country: true,
              imageUrl: true, brand: true, model: true, createdAt: true,
              _count: { select: { likes: true } },
            },
          },
        },
      },
    },
  });

  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check visibility
  if (!collection.isPublic) {
    const { user } = await getSessionUserWithBanCheck();
    if (!user || user.id !== collection.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json({ collection });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await getSessionUserWithBanCheck();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numericId = Number(id);

  const existing = await (prisma as any).collection.findUnique({ where: { numericId } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const updated = await (prisma as any).collection.update({
    where: { numericId },
    data: {
      ...(body.name !== undefined ? { name: body.name.trim().slice(0, 80) } : {}),
      ...(body.description !== undefined ? { description: body.description.trim().slice(0, 280) || null } : {}),
      ...(body.isPublic !== undefined ? { isPublic: body.isPublic } : {}),
    },
  });

  return NextResponse.json({ collection: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await getSessionUserWithBanCheck();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numericId = Number(id);

  const existing = await (prisma as any).collection.findUnique({ where: { numericId } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await (prisma as any).collection.delete({ where: { numericId } });
  return NextResponse.json({ ok: true });
}
