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

// PATCH /api/catalog/generations/[id] - rename generation (superadmin only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPERADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  try {
    // Fetch the old name + model/brand so we can update Upload strings too
    const existing = await (prisma as any).carGeneration.findUnique({
      where: { id: Number(id) },
      include: { model: { include: { brand: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const oldName   = existing.name as string;
    const modelName = existing.model?.name as string | undefined;
    const brandName = existing.model?.brand?.name as string | undefined;
    const newName   = name.trim();

    // Rename the CarGeneration record
    const gen = await (prisma as any).carGeneration.update({
      where: { id: Number(id) },
      data: { name: newName },
    });

    // Update all Upload rows that were tagged with the old generation name
    if (oldName !== newName && modelName && brandName) {
      await prisma.upload.updateMany({
        where: { brand: brandName, model: modelName, generation: oldName },
        data: { generation: newName },
      });
    }

    return NextResponse.json(gen);
  } catch {
    return NextResponse.json({ error: "Generation name already exists for this model" }, { status: 409 });
  }
}

// DELETE /api/catalog/generations/[id] - delete generation (superadmin only)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPERADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await (prisma as any).carGeneration.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
