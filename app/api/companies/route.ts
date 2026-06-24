import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { logCompanyCreate } from "@/app/lib/discord";

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q       = searchParams.get("q")?.trim() ?? "";
  const country = searchParams.get("country")?.trim() ?? "";
  const take    = Math.min(Number(searchParams.get("take") ?? "50"), 200);

  const companies = await prisma.transportCompany.findMany({
    where: {
      ...(q       ? { name:    { contains: q,       mode: "insensitive" } } : {}),
      ...(country ? { country: { equals:   country, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
    take,
    select: {
      id: true, numericId: true, name: true, country: true, city: true,
      _count: { select: { uploads: true } },
    },
  });
  return NextResponse.json({ companies });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const name    = String(body.name    ?? "").trim().slice(0, 120);
  const country = String(body.country ?? "").trim().slice(0, 60)  || null;
  const city    = String(body.city    ?? "").trim().slice(0, 80)  || null;
  const desc    = String(body.description ?? "").trim().slice(0, 500) || null;
  const website = String(body.website ?? "").trim().slice(0, 200) || null;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const existing = await prisma.transportCompany.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true, numericId: true, name: true, country: true, city: true },
  });
  if (existing) return NextResponse.json({ company: existing, existed: true });

  const company = await prisma.transportCompany.create({
    data: { name, country, city, description: desc, website, createdById: user.id },
    select: { id: true, numericId: true, name: true, country: true, city: true },
  });

  // Need username for log — re-fetch with username
  const actor = await prisma.user.findUnique({ where: { id: user.id }, select: { username: true } });
  logCompanyCreate({ actorUsername: actor?.username ?? "?", name: company.name, country: company.country, city: company.city, numericId: company.numericId });

  return NextResponse.json({ company }, { status: 201 });
}
