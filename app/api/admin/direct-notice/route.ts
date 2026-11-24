import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { getDirectNotice } from "@/app/lib/directNotice";

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
  return NextResponse.json(await getDirectNotice());
}

/** POST { enabled, title, text, link, linkText } — super admin only */
export async function POST(req: Request) {
  if (!(await getSuperAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const link = str(b.link, 200);
  if (link && !/^(\/|https?:\/\/)/.test(link)) return NextResponse.json({ error: "The link must start with / or https://" }, { status: 400 });
  const data = {
    directNoticeEnabled: Boolean(b.enabled),
    directNoticeTitle: str(b.title, 60),
    directNoticeText: str(b.text, 400),
    directNoticeLink: link,
    directNoticeLinkText: str(b.linkText, 40),
  };
  await prisma.siteSettings.upsert({ where: { id: "singleton" }, update: data, create: { id: "singleton", ...data } });
  return NextResponse.json(await getDirectNotice());
}
