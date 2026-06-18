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

// PATCH /api/catalog/models/[id] - rename model (superadmin only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPERADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  try {
    const model = await (prisma as any).carModel.update({
      where: { id: Number(id) },
      data: { name: name.trim() },
    });
    return NextResponse.json(model);
  } catch {
    return NextResponse.json({ error: "Model name already exists for this brand" }, { status: 409 });
  }
}

// DELETE /api/catalog/models/[id] - delete model (superadmin only)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPERADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await (prisma as any).carModel.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
