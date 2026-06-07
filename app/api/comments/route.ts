import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, username: true, numericId: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });

  const { uploadId, content } = await req.json();
  if (!uploadId || !content?.trim()) {
    return NextResponse.json({ error: "Missing content." }, { status: 400 });
  }

  const trimmed = String(content).trim().slice(0, 1000);
  if (trimmed.length < 1) return NextResponse.json({ error: "Comment is empty." }, { status: 400 });

  // Check upload exists
  const upload = await prisma.upload.findUnique({ where: { id: uploadId, deletedAt: null }, select: { id: true } });
  if (!upload) return NextResponse.json({ error: "Spot not found." }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { uploadId, userId: user.id, content: trimmed },
    select: { id: true, content: true, createdAt: true, user: { select: { username: true, numericId: true } } },
  });

  return NextResponse.json({
    comment: {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      username: comment.user.username,
      numericId: comment.user.numericId,
    },
  }, { status: 201 });
}
