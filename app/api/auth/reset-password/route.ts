import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/app/lib/prisma";
import { logPasswordResetUsed } from "@/app/lib/discord";

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

function isStrongPassword(p: string) {
  return (
    p.length >= PASSWORD_MIN &&
    p.length <= PASSWORD_MAX &&
    /[a-z]/.test(p) &&
    /[A-Z]/.test(p) &&
    /[0-9]/.test(p) &&
    /[^A-Za-z0-9]/.test(p)
  );
}

export async function POST(req: Request) {
  try {
    const body     = await req.json().catch(() => ({}));
    const token    = typeof body.token    === "string" ? body.token.trim()    : "";
    const password = typeof body.password === "string" ? body.password        : "";

    if (!token)    return NextResponse.json({ error: "Missing token."    }, { status: 400 });
    if (!password) return NextResponse.json({ error: "Missing password." }, { status: 400 });

    if (!isStrongPassword(password)) {
      return NextResponse.json({
        error: "Password must be 8–72 chars and include uppercase, lowercase, number, and special character.",
      }, { status: 400 });
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: {
        id: true, expiresAt: true, usedAt: true,
        user: { select: { id: true, username: true } },
      },
    });

    if (!record)               return NextResponse.json({ error: "Invalid or expired link." }, { status: 400 });
    if (record.usedAt)         return NextResponse.json({ error: "This link has already been used." }, { status: 400 });
    if (record.expiresAt < new Date()) return NextResponse.json({ error: "This link has expired. Request a new one." }, { status: 400 });

    const hash = await bcrypt.hash(password, 12);

    // Update password + mark token used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.user.id },
        data:  { password: hash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data:  { usedAt: new Date() },
      }),
      // Invalidate all sessions so attacker can't stay logged in
      prisma.session.deleteMany({ where: { userId: record.user.id } }),
    ]);

    logPasswordResetUsed({ username: record.user.username });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[reset-password]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
