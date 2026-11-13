import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { getAnnouncement } from "@/app/lib/announcement";

async function getSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, role: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user.role === "SUPERADMIN" ? session.user : null;
}

export async function GET() {
  return NextResponse.json(await getAnnouncement());
}

/** POST { enabled, label, text, link, linkText, days, showAgain } — super admin only */
export async function POST(req: Request) {
  if (!(await getSuperAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));

  const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const link = str(b.link, 200);
  if (link && !/^(\/|https?:\/\/)/.test(link)) {
    return NextResponse.json({ error: "The link must start with / or https://" }, { status: 400 });
  }
  const days = Math.min(365, Math.max(0, Math.floor(Number(b.days) || 0)));

  const data = {
    announcementEnabled: Boolean(b.enabled),
    announcementLabel: str(b.label, 20),
    announcementText: str(b.text, 300),
    announcementLink: link,
    announcementLinkText: str(b.linkText, 40),
    announcementDays: days,
  };
  const prev = await prisma.siteSettings.findUnique({ where: { id: "singleton" }, select: { announcementVersion: true } });
  const version = (prev?.announcementVersion ?? 1) + (b.showAgain ? 1 : 0);

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: { ...data, announcementVersion: version },
    create: { id: "singleton", ...data, announcementVersion: version },
  });
  return NextResponse.json(await getAnnouncement());
}
