import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { getSessionUserWithBanCheck } from "@/app/lib/banCheck";

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, username: true, numericId: true, role: true, avatarUrl: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

function canModerate(role: string) {
  return role === "SUPERADMIN" || role === "ADMIN" || role === "MOD";
}

export async function POST(req: Request) {
  const { user: banUser, banError } = await getSessionUserWithBanCheck();
  if (!banUser) return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  if (banError) return NextResponse.json({ error: banError }, { status: 403 });
  const user = await getSessionUser(); // need full fields for comment response
  if (!user) return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });

  const { uploadId, content } = await req.json();
  if (!uploadId || !content?.trim()) {
    return NextResponse.json({ error: "Missing content." }, { status: 400 });
  }

  const trimmed = String(content).trim().slice(0, 1000);
  if (trimmed.length < 1) return NextResponse.json({ error: "Comment is empty." }, { status: 400 });

  // Check upload exists and get owner for notification
  const upload = await prisma.upload.findUnique({
    where: { id: uploadId, deletedAt: null },
    select: { id: true, userId: true, plateText: true, numericId: true },
  });
  if (!upload) return NextResponse.json({ error: "Spot not found." }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { uploadId, userId: user.id, content: trimmed },
    select: { id: true, content: true, createdAt: true, user: { select: { username: true, numericId: true, avatarUrl: true } } },
  });

  // Notify the upload owner (skip if commenting on own spot)
  if (upload.userId !== user.id) {
    await prisma.notification.create({
      data: {
        userId:  upload.userId,
        type:    "COMMENT",
        title:   `@${user.username} commented on your spot`,
        message: trimmed.slice(0, 100) + (trimmed.length > 100 ? "…" : ""),
        url:     `/spot/${upload.numericId}`,
      },
    });
  }

  return NextResponse.json({
    comment: {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      username: comment.user.username,
      numericId: comment.user.numericId,
      avatarUrl: comment.user.avatarUrl ?? null,
    },
  }, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canModerate(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing comment id" }, { status: 400 });

  const comment = await prisma.comment.findUnique({ where: { id }, select: { id: true } });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
