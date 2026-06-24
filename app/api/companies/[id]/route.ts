import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { logCompanyEdit, logCompanyDelete } from "@/app/lib/discord";

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

function isAdmin(role: string) {
  return role === "SUPERADMIN" || role === "ADMIN";
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
  if (!isAdmin(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const name    = String(body.name    ?? "").trim().slice(0, 120) || undefined;
  const country = String(body.country ?? "").trim().slice(0, 60)  || null;
  const city    = String(body.city    ?? "").trim().slice(0, 80)  || null;
  const desc    = String(body.description ?? "").trim().slice(0, 500) || null;
  const website = String(body.website ?? "").trim().slice(0, 200) || null;

  const before = await prisma.transportCompany.findUnique({
    where: { id },
    select: { name: true, country: true, city: true, website: true },
  });

  const company = await prisma.transportCompany.update({
    where: { id },
    data: { ...(name ? { name } : {}), country, city, description: desc, website },
    select: { id: true, numericId: true, name: true, country: true, city: true, description: true, website: true },
  });

  const actor = await prisma.user.findUnique({ where: { id: user.id }, select: { username: true } });
  const changes = [
    before?.name    !== company.name    && `Name: ${before?.name} → ${company.name}`,
    before?.country !== company.country && `Country: ${before?.country ?? "—"} → ${company.country ?? "—"}`,
    before?.city    !== company.city    && `City: ${before?.city ?? "—"} → ${company.city ?? "—"}`,
    before?.website !== company.website && `Website: ${before?.website ?? "—"} → ${company.website ?? "—"}`,
  ].filter(Boolean).join("\n") || "No changes";
  logCompanyEdit({ actorUsername: actor?.username ?? "?", name: company.name, numericId: company.numericId, changes });

  return NextResponse.json({ company });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.transportCompany.findUnique({ where: { id }, select: { name: true } });
  await prisma.transportCompany.delete({ where: { id } });

  const actor = await prisma.user.findUnique({ where: { id: user.id }, select: { username: true } });
  logCompanyDelete({ actorUsername: actor?.username ?? "?", name: existing?.name ?? id });

  return NextResponse.json({ ok: true });
}
