import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { logBan, logUnban } from "@/app/lib/discord";

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, role: true, username: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

function canModerate(role: string) {
  return role === "SUPERADMIN" || role === "ADMIN";
}

// POST — ban a user
// Body: { reason?: string, days?: number }  (days null/omitted = perm ban)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getSessionUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canModerate(actor.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: targetId } = await params;
  const body = await req.json().catch(() => ({}));

  const reason = typeof body.reason === "string" && body.reason.trim()
    ? body.reason.trim().slice(0, 500) : null;
  const days = typeof body.days === "number" && body.days > 0 ? body.days : null;

  // Fetch target to check they're not a higher role
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, username: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Role hierarchy protection
  if (target.role === "SUPERADMIN") return NextResponse.json({ error: "Cannot ban a Super Admin" }, { status: 403 });
  if (target.role === "ADMIN" && actor.role !== "SUPERADMIN") return NextResponse.json({ error: "Only Super Admin can ban Admins" }, { status: 403 });

  const now = new Date();
  const banExpiresAt = days ? new Date(now.getTime() + days * 86_400_000) : null;

  await prisma.user.update({
    where: { id: targetId },
    data: { bannedAt: now, banExpiresAt, banReason: reason },
  });

  // Notify the banned user
  await prisma.notification.create({
    data: {
      userId: targetId,
      type: "SYSTEM",
      title: days ? `You have been temporarily banned (${days}d)` : "You have been permanently banned",
      message: reason ?? "Your account has been restricted by a moderator.",
    },
  });

  await logBan({ actorUsername: actor.username, targetUsername: target.username, reason, days });

  return NextResponse.json({ ok: true });
}

// DELETE — unban a user
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getSessionUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canModerate(actor.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: targetId } = await params;

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { username: true },
  });

  await prisma.user.update({
    where: { id: targetId },
    data: { bannedAt: null, banExpiresAt: null, banReason: null },
  });

  await prisma.notification.create({
    data: {
      userId: targetId,
      type: "SYSTEM",
      title: "Your ban has been lifted",
      message: "Your account has been restored. Welcome back.",
    },
  });

  await logUnban({ actorUsername: actor.username, targetUsername: target?.username ?? targetId });

  return NextResponse.json({ ok: true });
}
