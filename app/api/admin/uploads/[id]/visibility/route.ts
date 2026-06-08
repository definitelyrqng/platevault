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

function canModerate(role: string) {
  return ["SUPERADMIN", "ADMIN", "MOD"].includes(role);
}

// PATCH — hide or show an upload
// Body: { hidden: boolean, reason?: string }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getSessionUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canModerate(actor.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const hidden = body.hidden === true;
  const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim().slice(0, 280) : null;

  const upload = await prisma.upload.findUnique({
    where: { id },
    select: { id: true, userId: true, plateText: true },
  });
  if (!upload) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.upload.update({ where: { id }, data: { hidden } });

  // Notify the uploader when their content is hidden
  if (hidden) {
    await prisma.notification.create({
      data: {
        userId:  upload.userId,
        type:    "UPLOAD_FLAGGED",
        title:   `Your spot ${upload.plateText} has been hidden`,
        message: reason ?? "Your spot has been hidden by a moderator pending review.",
        url:     null,
      },
    });
  }

  return NextResponse.json({ ok: true, hidden });
}
