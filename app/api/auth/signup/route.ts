import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { prisma } from "@/app/lib/prisma";

function isValidUsername(username: string) {
  // 3–20 chars, letters/numbers/underscore/dot
  return /^[a-zA-Z0-9._]{3,20}$/.test(username);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password: string) {
  // min 8, needs upper/lower/number/special
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: "Username must be 3–20 chars (letters, numbers, . or _)." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be 8+ chars and include uppercase, lowercase, number, and special character.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username or email already in use." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { username, email, password: passwordHash },
      select: { id: true, username: true, email: true },
    });

    // create session + cookie
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

    await prisma.session.create({
      data: { token, userId: user.id, expiresAt },
    });

    const res = NextResponse.json({ user }, { status: 201 });

    res.cookies.set({
      name: "pv_session",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Signup failed." }, { status: 500 });
  }
}
