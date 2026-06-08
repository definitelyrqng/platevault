const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

type Color = number;
const C = {
  green:  0x22c55e,
  red:    0xef4444,
  orange: 0xf97316,
  yellow: 0xeab308,
  blue:   0x6366f1,
  purple: 0xa855f7,
  gray:   0x71717a,
};

interface Field { name: string; value: string; inline?: boolean }

interface LogPayload {
  title: string;
  color: Color;
  fields: Field[];
  thumbnail?: string; // image URL
}

/** Fire-and-forget — never awaited in hot paths */
export function logToDiscord(payload: LogPayload): void {
  if (!WEBHOOK) return;

  const body = JSON.stringify({
    embeds: [
      {
        title: payload.title,
        color: payload.color,
        fields: payload.fields.map((f) => ({
          name:   f.name,
          value:  String(f.value).slice(0, 1024) || "—",
          inline: f.inline ?? false,
        })),
        ...(payload.thumbnail ? { thumbnail: { url: payload.thumbnail } } : {}),
        footer:    { text: "PlateVault" },
        timestamp: new Date().toISOString(),
      },
    ],
  });

  // Best-effort — swallow all errors so logging never breaks the API
  fetch(WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body })
    .catch(() => {});
}

/* ─── Pre-built event helpers ─── */

export function logNewUser(u: { username: string; email: string }) {
  logToDiscord({
    title: "👤 New user registered",
    color: C.green,
    fields: [
      { name: "Username", value: `@${u.username}`, inline: true },
      { name: "Email",    value: u.email,           inline: true },
    ],
  });
}

export function logNewUpload(u: {
  username: string;
  plateText: string;
  country: string;
  location?: string | null;
  imageUrl: string;
  numericId: number;
}) {
  logToDiscord({
    title: "📸 New spot uploaded",
    color: C.blue,
    thumbnail: u.imageUrl,
    fields: [
      { name: "Plate",    value: u.plateText,                                      inline: true },
      { name: "Country",  value: u.country.charAt(0).toUpperCase() + u.country.slice(1), inline: true },
      { name: "Uploader", value: `@${u.username}`,                                 inline: true },
      { name: "Location", value: u.location ?? "—",                                inline: true },
      { name: "Link",     value: `https://platevault.app/spot/${u.numericId}`,      inline: false },
    ],
  });
}

export function logBan(opts: {
  actorUsername: string;
  targetUsername: string;
  reason: string | null;
  days: number | null;
}) {
  logToDiscord({
    title: "🔨 User banned",
    color: C.red,
    fields: [
      { name: "Target",   value: `@${opts.targetUsername}`, inline: true },
      { name: "By",       value: `@${opts.actorUsername}`,  inline: true },
      { name: "Duration", value: opts.days ? `${opts.days} day(s)` : "Permanent", inline: true },
      { name: "Reason",   value: opts.reason ?? "No reason given", inline: false },
    ],
  });
}

export function logUnban(opts: { actorUsername: string; targetUsername: string }) {
  logToDiscord({
    title: "✅ User unbanned",
    color: C.green,
    fields: [
      { name: "Target", value: `@${opts.targetUsername}`, inline: true },
      { name: "By",     value: `@${opts.actorUsername}`,  inline: true },
    ],
  });
}

export function logRoleChange(opts: {
  actorUsername: string;
  targetUsername: string;
  oldRole: string;
  newRole: string;
}) {
  logToDiscord({
    title: "🔑 Role changed",
    color: C.purple,
    fields: [
      { name: "Target",   value: `@${opts.targetUsername}`, inline: true },
      { name: "By",       value: `@${opts.actorUsername}`,  inline: true },
      { name: "Old role", value: opts.oldRole,              inline: true },
      { name: "New role", value: opts.newRole,              inline: true },
    ],
  });
}

export function logVisibilityChange(opts: {
  actorUsername: string;
  plateText: string;
  hidden: boolean;
  reason: string | null;
  numericId?: number;
}) {
  logToDiscord({
    title: opts.hidden ? "🙈 Spot hidden" : "👁️ Spot unhidden",
    color: opts.hidden ? C.orange : C.yellow,
    fields: [
      { name: "Plate",  value: opts.plateText,           inline: true },
      { name: "By",     value: `@${opts.actorUsername}`, inline: true },
      { name: "Reason", value: opts.reason ?? "No reason given", inline: false },
      ...(opts.numericId
        ? [{ name: "Link", value: `https://platevault.app/spot/${opts.numericId}`, inline: false }]
        : []),
    ],
  });
}

export function logUploadDelete(opts: {
  actorUsername: string;
  plateText: string;
  ownerUsername: string;
  reason: string | null;
}) {
  logToDiscord({
    title: "🗑️ Spot deleted",
    color: C.red,
    fields: [
      { name: "Plate",  value: opts.plateText,            inline: true },
      { name: "Owner",  value: `@${opts.ownerUsername}`,  inline: true },
      { name: "By",     value: `@${opts.actorUsername}`,  inline: true },
      { name: "Reason", value: opts.reason ?? "No reason given", inline: false },
    ],
  });
}

export function logContactMessage(opts: { email: string; message: string }) {
  logToDiscord({
    title: "📬 New contact message",
    color: C.gray,
    fields: [
      { name: "Reply to", value: opts.email,   inline: false },
      { name: "Message",  value: opts.message, inline: false },
    ],
  });
}
