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

// GET /api/catalog/models/[id]/generations — list generations for a model
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const generations = await (prisma as any).carGeneration.findMany({
    where: { modelId: Number(id) },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(generations);
}

// POST /api/catalog/models/[id]/generations — add generation (superadmin only)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPERADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  try {
    const gen = await (prisma as any).carGeneration.create({
      data: { name: name.trim(), modelId: Number(id) },
    });
    return NextResponse.json(gen, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Generation already exists for this model" }, { status: 409 });
  }
}
