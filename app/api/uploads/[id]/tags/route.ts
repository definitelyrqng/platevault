import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { sanitizeTags } from "@/app/lib/tags";

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, role: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

function isMod(role: string) {
  return role === "SUPERADMIN" || role === "ADMIN" || role === "MOD";
}

// PATCH /api/uploads/[id]/tags  — mod+ only, replaces tags
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isMod(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const tags = sanitizeTags(body.tags);

  const upload = await prisma.upload.findUnique({ where: { id }, select: { id: true } });
  if (!upload) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.upload.update({ where: { id }, data: { tags } });
  return NextResponse.json({ ok: true, tags });
}
