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

// PATCH /api/catalog/brands/[id] - rename brand (superadmin only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPERADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  try {
    const brand = await (prisma as any).carBrand.update({
      where: { id: Number(id) },
      data: { name: name.trim() },
    });
    return NextResponse.json(brand);
  } catch {
    return NextResponse.json({ error: "Brand name already exists" }, { status: 409 });
  }
}

// DELETE /api/catalog/brands/[id] - delete brand (superadmin only)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPERADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await (prisma as any).carBrand.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
