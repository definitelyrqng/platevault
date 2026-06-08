import { NextResponse } from "next/server";
import { logContactMessage } from "@/app/lib/discord";

export async function POST(req: Request) {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    return NextResponse.json({ error: "Contact unavailable." }, { status: 503 });
  }

  const body = await req.json();
  const email = (body.email ?? "").trim().slice(0, 254);
  const message = (body.message ?? "").trim().slice(0, 2000);

  if (!email || !message) {
    return NextResponse.json({ error: "Email and message are required." }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  logContactMessage({ email, message });

  return NextResponse.json({ ok: true });
}
