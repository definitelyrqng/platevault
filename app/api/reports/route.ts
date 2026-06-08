import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { sendReport } from "@/app/lib/discord";

const VALID_CATEGORIES = ["inappropriate", "incorrect", "missing_model", "other"] as const;

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

  if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }
  if (!Number.isInteger(uploadNumericId) || uploadNumericId < 1) {
    return NextResponse.json({ error: "Invalid spot." }, { status: 400 });
  }

  const upload = await prisma.upload.findUnique({
    where: { numericId: uploadNumericId },
    select: { id: true, plateText: true, imageUrl: true, numericId: true, deletedAt: true },
  });
  if (!upload || upload.deletedAt) {
    return NextResponse.json({ error: "Spot not found." }, { status: 404 });
  }

  const ok = await sendReport({
    reporterUsername: user.username,
    plateText:        upload.plateText,
    numericId:        upload.numericId,
    imageUrl:         upload.imageUrl,
    category,
    details,
  });

  if (!ok) {
    return NextResponse.json({ error: "Failed to send report. Try again later." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
