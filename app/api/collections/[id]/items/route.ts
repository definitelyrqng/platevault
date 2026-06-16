import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSessionUserWithBanCheck } from "@/app/lib/banCheck";

// POST   /api/collections/[id]/items  → add spot (body: { uploadNumericId })
// DELETE /api/collections/[id]/items  → remove spot (body: { uploadNumericId })

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, banError } = await getSessionUserWithBanCheck();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (banError) return NextResponse.json({ error: banError }, { status: 403 });

  const { id } = await params;
  const numericId = Number(id);

  const collection = await (prisma as any).collection.findUnique({ where: { numericId } });
  if (!collection || collection.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const upload = await prisma.upload.findUnique({
    where: { numericId: Number(body.uploadNumericId) },
    select: { id: true },
  });
  if (!upload) return NextResponse.json({ error: "Spot not found" }, { status: 404 });

  try {
    await (prisma as any).collectionItem.create({
      data: { collectionId: collection.id, uploadId: upload.id },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Already in collection" }, { status: 409 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await getSessionUserWithBanCheck();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numericId = Number(id);

  const collection = await (prisma as any).collection.findUnique({ where: { numericId } });
  if (!collection || collection.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const upload = await prisma.upload.findUnique({
    where: { numericId: Number(body.uploadNumericId) },
    select: { id: true },
  });
  if (!upload) return NextResponse.json({ error: "Spot not found" }, { status: 404 });

  await (prisma as any).collectionItem.deleteMany({
    where: { collectionId: collection.id, uploadId: upload.id },
  });

  return NextResponse.json({ ok: true });
}
