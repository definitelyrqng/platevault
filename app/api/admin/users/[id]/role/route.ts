import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { logRoleChange } from "@/app/lib/discord";

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

const ALLOWED_ROLES = ["USER", "MOD", "ADMIN"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

// PATCH — change a user's role
// Body: { role: "USER" | "MOD" | "ADMIN" }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getSessionUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: targetId } = await params;
  const body = await req.json().catch(() => ({}));
  const newRole = body.role as AllowedRole;

  if (!ALLOWED_ROLES.includes(newRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, username: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Role hierarchy:
  // - SUPERADMIN can set anyone to USER/MOD/ADMIN (but not SUPERADMIN — that's CLI only)
  // - ADMIN can set USER↔MOD only
  if (target.role === "SUPERADMIN") return NextResponse.json({ error: "Cannot change Super Admin role" }, { status: 403 });

  if (actor.role === "SUPERADMIN") {
    // can set any allowed role
  } else if (actor.role === "ADMIN") {
    if (newRole === "ADMIN") return NextResponse.json({ error: "Only Super Admin can promote to Admin" }, { status: 403 });
    if (target.role === "ADMIN") return NextResponse.json({ error: "Only Super Admin can demote Admins" }, { status: 403 });
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.user.update({ where: { id: targetId }, data: { role: newRole } });

  const roleLabel: Record<AllowedRole, string> = { USER: "User", MOD: "Moderator", ADMIN: "Admin" };
  await prisma.notification.create({
    data: {
      userId: targetId,
      type: "SYSTEM",
      title: `Your role has been updated to ${roleLabel[newRole]}`,
      message: "Your PlateVault rank has been changed by an administrator.",
    },
  });

  logRoleChange({
    actorUsername:  actor.username,
    targetUsername: target.username,
    oldRole:        target.role,
    newRole,
  });

  return NextResponse.json({ ok: true, role: newRole });
}
