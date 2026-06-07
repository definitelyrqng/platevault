import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

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

function canAdmin(role: string) {
  return role === "SUPERADMIN" || role === "ADMIN";
}

// PATCH — edit car details (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAdmin(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const opt = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 60) : null);

  const upload = await prisma.upload.update({
    where: { id },
    data: {
      brand:      opt(body.brand),
      model:      opt(body.model),
      generation: opt(body.generation),
      trim:       opt(body.trim),
      color:      opt(body.color),
    },
    select: { id: true, brand: true, model: true, generation: true, trim: true, color: true },
  });

  return NextResponse.json({ upload });
}

// DELETE — soft-delete (admin only)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAdmin(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  await prisma.upload.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
