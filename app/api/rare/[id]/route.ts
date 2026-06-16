import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSessionUserWithBanCheck } from "@/app/lib/banCheck";

// GET  /api/rare/[id]  → { count, voted }
// POST /api/rare/[id]  → cast vote
// DELETE /api/rare/[id] → remove vote

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = Number(id);

  const upload = await prisma.upload.findUnique({
    where: { numericId },
    select: { id: true },
  });
  if (!upload) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { user } = await getSessionUserWithBanCheck();

  const [count, existing] = await Promise.all([
    (prisma as any).rareVote.count({ where: { uploadId: upload.id } }),
    user
      ? (prisma as any).rareVote.findUnique({
          where: { userId_uploadId: { userId: user.id, uploadId: upload.id } },
        })
      : null,
  ]);

  return NextResponse.json({ count, voted: !!existing });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, banError } = await getSessionUserWithBanCheck();
  if (!user) return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
  if (banError) return NextResponse.json({ error: banError }, { status: 403 });

  const { id } = await params;
  const numericId = Number(id);

  const upload = await prisma.upload.findUnique({
    where: { numericId },
    select: { id: true },
  });
  if (!upload) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await (prisma as any).rareVote.create({
      data: { userId: user.id, uploadId: upload.id },
    });
    const count = await (prisma as any).rareVote.count({ where: { uploadId: upload.id } });
    return NextResponse.json({ count, voted: true });
  } catch {
    return NextResponse.json({ error: "Already voted" }, { status: 409 });
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

  const upload = await prisma.upload.findUnique({
    where: { numericId },
    select: { id: true },
  });
  if (!upload) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await (prisma as any).rareVote.deleteMany({
    where: { userId: user.id, uploadId: upload.id },
  });
  const count = await (prisma as any).rareVote.count({ where: { uploadId: upload.id } });
  return NextResponse.json({ count, voted: false });
}
