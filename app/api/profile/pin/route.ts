import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, userId: true, user: { select: { id: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

// POST /api/profile/pin  { uploadId: string }  → pin the spot
// DELETE /api/profile/pin  { uploadId: string }  → unpin

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const uploadId = typeof body.uploadId === "string" ? body.uploadId : null;
  if (!uploadId) return NextResponse.json({ error: "uploadId required" }, { status: 400 });

  // Verify the upload belongs to this user
  const upload = await prisma.upload.findFirst({ where: { id: uploadId, userId: user.id, deletedAt: null } });
  if (!upload) return NextResponse.json({ error: "Not found or not yours" }, { status: 404 });

  const currentUser = await prisma.user.findUnique({ where: { id: user.id }, select: { pinnedSpotIds: true } });
  const pinned = currentUser?.pinnedSpotIds ?? [];

  if (pinned.includes(uploadId)) return NextResponse.json({ pinned });
  if (pinned.length >= 3) return NextResponse.json({ error: "Maximum 3 pins" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { pinnedSpotIds: { push: uploadId } },
    select: { pinnedSpotIds: true },
  });
  return NextResponse.json({ pinned: updated.pinnedSpotIds });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const uploadId = typeof body.uploadId === "string" ? body.uploadId : null;
  if (!uploadId) return NextResponse.json({ error: "uploadId required" }, { status: 400 });

  const currentUser = await prisma.user.findUnique({ where: { id: user.id }, select: { pinnedSpotIds: true } });
  const pinned = (currentUser?.pinnedSpotIds ?? []).filter((id) => id !== uploadId);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { pinnedSpotIds: { set: pinned } },
    select: { pinnedSpotIds: true },
  });
  return NextResponse.json({ pinned: updated.pinnedSpotIds });
}
