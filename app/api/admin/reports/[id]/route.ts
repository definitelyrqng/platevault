import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

async function getStaff() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, role: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  const r = session.user.role;
  return r === "SUPERADMIN" || r === "ADMIN" || r === "MOD" ? session.user : null;
}

/** PATCH { action: "resolve" | "reopen" } */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { action } = await req.json().catch(() => ({ action: "" }));
  if (action !== "resolve" && action !== "reopen") return NextResponse.json({ error: "Bad action" }, { status: 400 });
  await prisma.report.update({
    where: { id },
    data: action === "resolve"
      ? { status: "DONE", resolvedAt: new Date(), resolvedById: staff.id }
      : { status: "OPEN", resolvedAt: null, resolvedById: null },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.report.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
