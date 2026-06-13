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

function isMod(role: string) {
  return ["SUPERADMIN", "ADMIN", "MOD"].includes(role);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const company = await prisma.transportCompany.findFirst({
    where: { OR: [{ id }, { numericId: Number(id) || 0 }] },
    select: {
      id: true, numericId: true, name: true, country: true, city: true,
      description: true, website: true, createdAt: true,
      createdBy: { select: { username: true, numericId: true } },
      _count: { select: { uploads: true } },
    },
  });
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ company });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isMod(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const name    = String(body.name    ?? "").trim().slice(0, 120) || undefined;
  const country = String(body.country ?? "").trim().slice(0, 60)  || null;
  const city    = String(body.city    ?? "").trim().slice(0, 80)  || null;
  const desc    = String(body.description ?? "").trim().slice(0, 500) || null;
  const website = String(body.website ?? "").trim().slice(0, 200) || null;

  const company = await prisma.transportCompany.update({
    where: { id },
    data: { ...(name ? { name } : {}), country, city, description: desc, website },
    select: { id: true, numericId: true, name: true, country: true, city: true, description: true, website: true },
  });
  return NextResponse.json({ company });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isMod(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.transportCompany.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
