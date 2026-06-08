import { NextResponse } from "next/server";

const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

export async function POST(req: Request) {
  if (!WEBHOOK) {
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

  // Awaited — fire-and-forget gets killed on Vercel before it completes
  const res = await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: "📬 New contact message",
        color: 0x71717a,
        fields: [
          { name: "Reply to", value: email,   inline: false },
          { name: "Message",  value: message, inline: false },
        ],
        footer:    { text: "PlateVault" },
        timestamp: new Date().toISOString(),
      }],
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to send. Try again later." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
