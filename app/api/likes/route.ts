import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to like." }, { status: 401 });

  const { uploadId } = await req.json();
  if (!uploadId) return NextResponse.json({ error: "Missing uploadId" }, { status: 400 });

  // Block self-liking
  const upload = await prisma.upload.findUnique({ where: { id: uploadId }, select: { userId: true } });
  if (!upload) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (upload.userId === user.id) return NextResponse.json({ error: "Can't like your own spot." }, { status: 403 });

  try {
    await prisma.like.create({ data: { userId: user.id, uploadId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Already liked" }, { status: 409 });
  }
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { uploadId } = await req.json();
  if (!uploadId) return NextResponse.json({ error: "Missing uploadId" }, { status: 400 });

  await prisma.like.deleteMany({ where: { userId: user.id, uploadId } });
  return NextResponse.json({ ok: true });
}
