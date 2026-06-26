import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

async function getSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, role: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  if (session.user.role !== "SUPERADMIN") return null;
  return session.user;
}

async function getOrCreateSettings() {
  return prisma.siteSettings.upsert({
    where:  { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

export async function GET() {
  const settings = await getOrCreateSettings();
  return NextResponse.json({
    maintenanceMode: settings.maintenanceMode,
    maintenanceMsg:  settings.maintenanceMsg,
  });
}

export async function POST(req: NextRequest) {
  const actor = await getSuperAdmin();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const settings = await prisma.siteSettings.upsert({
    where:  { id: "singleton" },
    update: {
      ...(typeof body.maintenanceMode === "boolean" ? { maintenanceMode: body.maintenanceMode } : {}),
      ...(typeof body.maintenanceMsg  === "string"  ? { maintenanceMsg:  body.maintenanceMsg  } : {}),
    },
    create: { id: "singleton" },
  });

  return NextResponse.json({
    maintenanceMode: settings.maintenanceMode,
    maintenanceMsg:  settings.maintenanceMsg,
  });
}
