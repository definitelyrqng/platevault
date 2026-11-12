import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { sendReport } from "@/app/lib/discord";
import { isReportCategory } from "@/app/lib/reports";

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, username: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to report." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const uploadNumericId = Number(body.uploadNumericId);
  const category = String(body.category ?? "");
  const details = String(body.details ?? "").trim().slice(0, 500);

  if (!isReportCategory(category)) return NextResponse.json({ error: "Pick a reason." }, { status: 400 });
  if (!Number.isInteger(uploadNumericId) || uploadNumericId < 1) return NextResponse.json({ error: "Invalid spot." }, { status: 400 });
  if (category === "other" && details.length < 3) return NextResponse.json({ error: "Please say what is wrong." }, { status: 400 });

  const upload = await prisma.upload.findUnique({
    where: { numericId: uploadNumericId },
    select: { id: true, plateText: true, imageUrl: true, numericId: true, deletedAt: true },
  });
  if (!upload || upload.deletedAt) return NextResponse.json({ error: "Spot not found." }, { status: 404 });

  // Not the same report twice, and not a flood
  const [same, today] = await Promise.all([
    prisma.report.findFirst({ where: { uploadId: upload.id, reporterId: user.id, category, status: "OPEN" }, select: { id: true } }),
    prisma.report.count({ where: { reporterId: user.id, createdAt: { gte: new Date(Date.now() - 86_400_000) } } }),
  ]);
  if (same) return NextResponse.json({ ok: true, duplicate: true });
  if (today >= 15) return NextResponse.json({ error: "Too many reports today — please try again tomorrow." }, { status: 429 });

  await prisma.report.create({ data: { uploadId: upload.id, reporterId: user.id, category, details } });

  // The report is saved either way; Discord is the "reminder" for the team
  await sendReport({
    reporterUsername: user.username,
    plateText:        upload.plateText,
    numericId:        upload.numericId,
    imageUrl:         upload.imageUrl,
    category,
    details,
  });

  return NextResponse.json({ ok: true });
}
