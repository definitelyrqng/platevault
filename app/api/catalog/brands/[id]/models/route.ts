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

// GET /api/catalog/brands/[id]/models — list models for a brand
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const models = await (prisma as any).carModel.findMany({
    where: { brandId: Number(id) },
    orderBy: { name: "asc" },
    include: { generations: { orderBy: { name: "asc" } } },
  });
  return NextResponse.json(models);
}

// POST /api/catalog/brands/[id]/models — add model to brand (superadmin only)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPERADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  try {
    const model = await (prisma as any).carModel.create({
      data: { name: name.trim(), brandId: Number(id) },
    });
    return NextResponse.json(model, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Model already exists for this brand" }, { status: 409 });
  }
}
