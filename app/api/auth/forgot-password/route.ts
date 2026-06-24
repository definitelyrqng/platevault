import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/app/lib/prisma";
import { sendPasswordResetEmail } from "@/app/lib/email";
import { logPasswordResetRequest } from "@/app/lib/discord";

// Always return 200 — never reveal whether an email exists (prevents enumeration)
const OK = NextResponse.json({ ok: true });

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return OK;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true, email: true },
    });

    if (!user) return OK; // silent — don't reveal non-existence

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // Generate a secure token
    const token     = randomBytes(48).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const sent = await sendPasswordResetEmail({
      to:       user.email,
      username: user.username,
      token,
    });

    logPasswordResetRequest({ username: user.username, email: user.email, sent });

    return OK;
  } catch (e) {
    console.error("[forgot-password]", e);
    return OK; // still 200 — never expose internals
  }
}
