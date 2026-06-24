/**
 * PlateVault Email Utility
 * Uses Resend (https://resend.com) — set RESEND_API_KEY in your .env
 * Install: npm install resend
 */

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — email not sent");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "PlateVault <digest@platevault.app>",
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[email] Resend error:", err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}

// ── Password reset ────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(opts: {
  to:       string;
  username: string;
  token:    string;
}): Promise<boolean> {
  const app = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "https://platevault.app";
  const resetUrl = `${app}/reset-password?token=${opts.token}`;
  return sendEmail({
    to:      opts.to,
    subject: "Reset your PlateVault password",
    html:    buildResetHtml({ username: opts.username, resetUrl }),
  });
}

function buildResetHtml(opts: { username: string; resetUrl: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Reset your PlateVault password</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">

        <!-- Wordmark -->
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#e4e4e7;">
            Plate<span style="color:#6366f1;">Vault</span>
          </span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:36px 32px;">

          <!-- Icon -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding-bottom:24px;">
              <div style="display:inline-block;background:#1e1b4b;border:1px solid #312e81;border-radius:12px;padding:14px;">
                <span style="font-size:28px;">🔑</span>
              </div>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f4f4f5;text-align:center;">Reset your password</p>
          <p style="margin:0 0 28px;font-size:14px;color:#71717a;text-align:center;line-height:1.6;">
            Hey @${opts.username}, we got a request to reset your PlateVault password.<br />
            This link expires in <strong style="color:#a1a1aa;">1 hour</strong>.
          </p>

          <!-- Button -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding-bottom:28px;">
              <a href="${opts.resetUrl}"
                 style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;padding:13px 32px;">
                Reset Password →
              </a>
            </td></tr>
          </table>

          <hr style="border:none;border-top:1px solid #27272a;margin:0 0 20px;" />

          <p style="margin:0 0 6px;font-size:12px;color:#52525b;text-align:center;">If the button doesn't work, copy this link:</p>
          <p style="margin:0;font-size:11px;color:#6366f1;word-break:break-all;text-align:center;">${opts.resetUrl}</p>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#3f3f46;line-height:1.6;">
            If you didn't request this, you can safely ignore this email. Your password will not change.
          </p>
          <p style="margin:10px 0 0;font-size:12px;color:#3f3f46;">
            📬 This is a no-reply address — don't reply here.<br />
            Got a question? Use <a href="https://platevault.app/contact" style="color:#6366f1;text-decoration:none;">platevault.app/contact</a> instead.
          </p>
          <p style="margin:8px 0 0;font-size:11px;color:#27272a;">© PlateVault · platevault.app</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function digestHtml({
  username,
  weekLabel,
  topSpots,
  hotSpots,
  streakCurrent,
  challengesDone,
  challengesTotal,
  unsubUrl,
}: {
  username: string;
  weekLabel: string;
  topSpots: { numericId: number; plateText: string; country: string; imageUrl: string; likes: number }[];
  hotSpots: { numericId: number; plateText: string; country: string; imageUrl: string; likes: number }[];
  streakCurrent: number;
  challengesDone: number;
  challengesTotal: number;
  unsubUrl: string;
}): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://platevault.app";

  const spotCard = (s: typeof topSpots[0]) => `
    <a href="${base}/spot/${s.numericId}" style="display:block;text-decoration:none;color:inherit;margin-bottom:12px;border-radius:12px;border:1px solid #27272a;overflow:hidden;background:#18181b;">
      <img src="${s.imageUrl}" alt="${s.plateText}" style="width:100%;height:140px;object-fit:cover;display:block;" />
      <div style="padding:10px 12px;">
        <div style="font-family:monospace;font-size:14px;font-weight:700;color:#f4f4f5;letter-spacing:0.08em;">${s.plateText}</div>
        <div style="font-size:11px;color:#71717a;margin-top:2px;">${s.country.charAt(0).toUpperCase() + s.country.slice(1)} · ❤️ ${s.likes}</div>
      </div>
    </a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PlateVault Weekly Digest</title></head>
<body style="background:#09090b;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px;padding:8px 20px;">
        <span style="font-size:18px;font-weight:800;color:#fff;letter-spacing:0.05em;">PV</span>
      </div>
      <h1 style="margin:16px 0 4px;font-size:22px;font-weight:700;color:#f4f4f5;">Your Weekly Digest</h1>
      <p style="margin:0;font-size:13px;color:#71717a;">${weekLabel} · Hi @${username}! 👋</p>
    </div>

    <!-- Stats -->
    <div style="display:flex;gap:12px;margin-bottom:24px;">
      ${streakCurrent > 0 ? `
      <div style="flex:1;border-radius:12px;border:1px solid #451a03;background:#1c0a00;padding:14px;text-align:center;">
        <div style="font-size:22px;">🔥</div>
        <div style="font-size:18px;font-weight:700;color:#fbbf24;margin-top:4px;">${streakCurrent}</div>
        <div style="font-size:11px;color:#92400e;">day streak</div>
      </div>` : ""}
      <div style="flex:1;border-radius:12px;border:1px solid #1e1b4b;background:#0f0e2a;padding:14px;text-align:center;">
        <div style="font-size:22px;">🎯</div>
        <div style="font-size:18px;font-weight:700;color:#818cf8;margin-top:4px;">${challengesDone}/${challengesTotal}</div>
        <div style="font-size:11px;color:#4338ca;">challenges</div>
      </div>
    </div>

    ${hotSpots.length > 0 ? `
    <!-- Hot Spots -->
    <div style="margin-bottom:24px;">
      <h2 style="font-size:15px;font-weight:600;color:#f4f4f5;margin:0 0 12px;display:flex;align-items:center;gap:8px;">
        🔥 Hot Spots This Week
      </h2>
      ${hotSpots.slice(0, 3).map(spotCard).join("")}
    </div>` : ""}

    ${topSpots.length > 0 ? `
    <!-- Your Spots -->
    <div style="margin-bottom:24px;">
      <h2 style="font-size:15px;font-weight:600;color:#f4f4f5;margin:0 0 12px;">
        📷 Your Recent Spots
      </h2>
      ${topSpots.slice(0, 3).map(spotCard).join("")}
    </div>` : ""}

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${base}/home" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:12px;">
        View PlateVault →
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #27272a;padding-top:20px;text-align:center;font-size:11px;color:#52525b;">
      <p>You're receiving this because you're a PlateVault member.</p>
      <p><a href="${unsubUrl}" style="color:#4f46e5;">Unsubscribe from digest emails</a></p>
    </div>
  </div>
</body>
</html>`;
}
