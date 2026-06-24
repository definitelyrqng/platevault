/**
 * PlateVault Discord logging
 * All events fire-and-forget unless they need delivery confirmation.
 * Use DISCORD_WEBHOOK_URL for a catch-all channel.
 * Optionally set per-category webhooks to split into separate channels:
 *   DISCORD_WEBHOOK_MODERATION  — bans, role changes, visibility, deletions
 *   DISCORD_WEBHOOK_UPLOADS     — new spots, edits
 *   DISCORD_WEBHOOK_AUTH        — signups, logins
 */

const W = {
  default:    process.env.DISCORD_WEBHOOK_URL,
  moderation: process.env.DISCORD_WEBHOOK_MODERATION ?? process.env.DISCORD_WEBHOOK_URL,
  uploads:    process.env.DISCORD_WEBHOOK_UPLOADS    ?? process.env.DISCORD_WEBHOOK_URL,
  auth:       process.env.DISCORD_WEBHOOK_AUTH       ?? process.env.DISCORD_WEBHOOK_URL,
};

// ── Colour palette ─────────────────────────────────────────────────────────────
const C = {
  green:   0x22c55e,   // signup, unban, restore
  teal:    0x14b8a6,   // road trips
  blue:    0x6366f1,   // new upload
  indigo:  0x4f46e5,   // owner edit
  yellow:  0xeab308,   // admin edit, company changes
  orange:  0xf97316,   // hide spot
  purple:  0xa855f7,   // role change, profile update
  red:     0xef4444,   // delete, ban
  gray:    0x71717a,   // login, contact
  pink:    0xec4899,   // comment
  rose:    0xf43f5e,   // failed login, comment delete
};

type Channel = keyof typeof W;
interface Field { name: string; value: string; inline?: boolean }

interface Embed {
  title:      string;
  color:      number;
  fields?:    Field[];
  thumbnail?: string;
  description?: string;
  footer?:    { text: string };
  timestamp?: string;
}

// ── Core send ─────────────────────────────────────────────────────────────────

async function send(
  channel: Channel,
  embed: Embed,
  opts: { mention?: boolean } = {}
): Promise<void> {
  const url = W[channel] ?? W.default;
  if (!url) return;

  const body = JSON.stringify({
    ...(opts.mention ? { content: "@here" } : {}),
    embeds: [{
      title:       embed.title,
      color:       embed.color,
      description: embed.description,
      fields:      (embed.fields ?? []).map((f) => ({
        name:   f.name,
        value:  String(f.value).slice(0, 1024) || "—",
        inline: f.inline ?? false,
      })),
      ...(embed.thumbnail ? { thumbnail: { url: embed.thumbnail } } : {}),
      footer:    embed.footer ?? { text: "PlateVault" },
      timestamp: new Date().toISOString(),
    }],
  });

  await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }).catch(() => {});
}

/** Fire-and-forget */
function log(channel: Channel, embed: Embed, opts?: { mention?: boolean }): void {
  void send(channel, embed, opts);
}

/** Awaitable — use in admin actions where delivery matters */
async function logAsync(channel: Channel, embed: Embed, opts?: { mention?: boolean }): Promise<void> {
  await send(channel, embed, opts);
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export function logNewUser(u: { username: string; email: string }) {
  log("auth", {
    title:  "👤 New user registered",
    color:  C.green,
    fields: [
      { name: "Username", value: `@${u.username}`, inline: true },
      { name: "Email",    value: u.email,           inline: true },
    ],
  });
}

export function logLogin(u: { username: string; ip?: string | null }) {
  log("auth", {
    title:  "🔓 User logged in",
    color:  C.gray,
    fields: [
      { name: "Username", value: `@${u.username}`,    inline: true },
      { name: "IP",       value: u.ip ?? "unknown",   inline: true },
    ],
  });
}

export function logFailedLogin(opts: { identifier: string; ip?: string | null }) {
  log("auth", {
    title:  "🚨 Failed login attempt",
    color:  C.rose,
    fields: [
      { name: "Identifier", value: opts.identifier,       inline: true },
      { name: "IP",         value: opts.ip ?? "unknown",  inline: true },
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export function logNewUpload(u: {
  username:  string;
  plateText: string;
  country:   string;
  plateType?: string | null;
  location?: string | null;
  imageUrl:  string;
  numericId: number;
}) {
  const country = u.country.charAt(0).toUpperCase() + u.country.slice(1);
  log("uploads", {
    title:     "📸 New spot uploaded",
    color:     C.blue,
    thumbnail: u.imageUrl,
    fields: [
      { name: "Plate",      value: u.plateText,                               inline: true },
      { name: "Country",    value: country,                                    inline: true },
      { name: "Uploader",   value: `@${u.username}`,                           inline: true },
      { name: "Plate type", value: u.plateType ?? "—",                         inline: true },
      { name: "Location",   value: u.location ?? "—",                          inline: true },
      { name: "🔗 Link",    value: `https://platevault.app/spot/${u.numericId}`, inline: false },
    ],
  });
}

export function logUploadEditOwner(opts: {
  username:  string;
  plateText: string;
  numericId: number;
  changes:   string;
}) {
  log("uploads", {
    title:  "✏️ Spot edited by owner",
    color:  C.indigo,
    fields: [
      { name: "Plate",   value: opts.plateText,                                    inline: true },
      { name: "By",      value: `@${opts.username}`,                               inline: true },
      { name: "Changes", value: opts.changes,                                       inline: false },
      { name: "🔗 Link", value: `https://platevault.app/spot/${opts.numericId}`,    inline: false },
    ],
  });
}

export function logUploadEdit(opts: {
  actorUsername: string;
  ownerUsername: string;
  plateText:     string;
  numericId:     number;
  changes:       string;
}) {
  log("moderation", {
    title:  "✏️ Spot edited by admin",
    color:  C.yellow,
    fields: [
      { name: "Plate",   value: opts.plateText,                                    inline: true },
      { name: "Owner",   value: `@${opts.ownerUsername}`,                           inline: true },
      { name: "By",      value: `@${opts.actorUsername}`,                           inline: true },
      { name: "Changes", value: opts.changes,                                       inline: false },
      { name: "🔗 Link", value: `https://platevault.app/spot/${opts.numericId}`,    inline: false },
    ],
  });
}

export function logUploadDelete(opts: {
  actorUsername: string;
  plateText:     string;
  ownerUsername: string;
  reason:        string | null;
}) {
  log("moderation", {
    title:  "🗑️ Spot deleted",
    color:  C.red,
    fields: [
      { name: "Plate",  value: opts.plateText,                       inline: true },
      { name: "Owner",  value: `@${opts.ownerUsername}`,             inline: true },
      { name: "By",     value: `@${opts.actorUsername}`,             inline: true },
      { name: "Reason", value: opts.reason ?? "No reason given",     inline: false },
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────────────────────────────────────────

export function logComment(opts: {
  username:  string;
  plateText: string;
  numericId: number;
  content:   string;
}) {
  log("uploads", {
    title:  "💬 New comment",
    color:  C.pink,
    fields: [
      { name: "By",      value: `@${opts.username}`,                           inline: true },
      { name: "On",      value: opts.plateText,                                 inline: true },
      { name: "Comment", value: opts.content.slice(0, 300),                     inline: false },
      { name: "🔗 Link", value: `https://platevault.app/spot/${opts.numericId}`, inline: false },
    ],
  });
}

export function logCommentDelete(opts: {
  actorUsername: string;
  commentId:     string;
  content:       string;
  plateText:     string;
  numericId:     number;
}) {
  log("moderation", {
    title:  "🗑️ Comment deleted by mod",
    color:  C.rose,
    fields: [
      { name: "By",      value: `@${opts.actorUsername}`,                        inline: true },
      { name: "Plate",   value: opts.plateText,                                  inline: true },
      { name: "Content", value: opts.content.slice(0, 300),                      inline: false },
      { name: "🔗 Link", value: `https://platevault.app/spot/${opts.numericId}`,  inline: false },
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MODERATION
// ─────────────────────────────────────────────────────────────────────────────

export function logVisibilityChange(opts: {
  actorUsername: string;
  plateText:     string;
  hidden:        boolean;
  reason:        string | null;
  numericId?:    number;
}) {
  log("moderation", {
    title:  opts.hidden ? "🙈 Spot hidden" : "👁️ Spot restored",
    color:  opts.hidden ? C.orange : C.green,
    fields: [
      { name: "Plate",  value: opts.plateText,                       inline: true },
      { name: "By",     value: `@${opts.actorUsername}`,             inline: true },
      { name: "Reason", value: opts.reason ?? "No reason given",     inline: false },
      ...(opts.numericId
        ? [{ name: "🔗 Link", value: `https://platevault.app/spot/${opts.numericId}`, inline: false }]
        : []),
    ],
  });
}

export async function logBan(opts: {
  actorUsername:  string;
  targetUsername: string;
  reason:         string | null;
  days:           number | null;
}): Promise<void> {
  await logAsync("moderation", {
    title:  "🔨 User banned",
    color:  C.red,
    fields: [
      { name: "Target",   value: `@${opts.targetUsername}`,                    inline: true },
      { name: "By",       value: `@${opts.actorUsername}`,                     inline: true },
      { name: "Duration", value: opts.days ? `${opts.days} day(s)` : "Permanent", inline: true },
      { name: "Reason",   value: opts.reason ?? "No reason given",             inline: false },
    ],
  });
}

export async function logUnban(opts: { actorUsername: string; targetUsername: string }): Promise<void> {
  await logAsync("moderation", {
    title:  "✅ User unbanned",
    color:  C.green,
    fields: [
      { name: "Target", value: `@${opts.targetUsername}`, inline: true },
      { name: "By",     value: `@${opts.actorUsername}`,  inline: true },
    ],
  });
}

export function logRoleChange(opts: {
  actorUsername:  string;
  targetUsername: string;
  oldRole:        string;
  newRole:        string;
}) {
  log("moderation", {
    title:  "🔑 Role changed",
    color:  C.purple,
    fields: [
      { name: "Target",   value: `@${opts.targetUsername}`, inline: true },
      { name: "By",       value: `@${opts.actorUsername}`,  inline: true },
      { name: "Old role", value: opts.oldRole,              inline: true },
      { name: "New role", value: opts.newRole,              inline: true },
    ],
  });
}

/** Reports use @here and are always awaited so we know delivery status */
export async function sendReport(opts: {
  reporterUsername: string;
  plateText:        string;
  numericId:        number;
  imageUrl:         string;
  category:         string;
  details:          string;
}): Promise<boolean> {
  const url = W.moderation ?? W.default;
  if (!url) return false;

  const emoji: Record<string, string> = {
    inappropriate: "🔞",
    incorrect:     "❌",
    missing_model: "🚗",
    other:         "💬",
  };

  const body = JSON.stringify({
    content: "@here",
    embeds: [{
      title:     `${emoji[opts.category] ?? "📢"} Spot reported`,
      color:     C.red,
      thumbnail: { url: opts.imageUrl },
      fields: [
        { name: "Plate",    value: opts.plateText,                                       inline: true },
        { name: "Reporter", value: `@${opts.reporterUsername}`,                          inline: true },
        { name: "Category", value: opts.category.replace(/_/g, " "),                    inline: true },
        { name: "Details",  value: opts.details || "No details provided",               inline: false },
        { name: "🔗 Link",  value: `https://platevault.app/spot/${opts.numericId}`,     inline: false },
      ],
      footer:    { text: "PlateVault Report System" },
      timestamp: new Date().toISOString(),
    }],
  });

  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
    return res.ok;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export function logProfileUpdate(opts: { username: string; fields: string[] }) {
  log("auth", {
    title:  "👤 Profile updated",
    color:  C.purple,
    fields: [
      { name: "User",    value: `@${opts.username}`,    inline: true },
      { name: "Updated", value: opts.fields.join(", "), inline: true },
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPANIES
// ─────────────────────────────────────────────────────────────────────────────

export function logCompanyCreate(opts: {
  actorUsername: string;
  name:          string;
  country:       string | null;
  city:          string | null;
  numericId:     number;
}) {
  log("default", {
    title:  "🏢 Company created",
    color:  C.teal,
    fields: [
      { name: "Name",    value: opts.name,                  inline: true },
      { name: "Country", value: opts.country ?? "—",        inline: true },
      { name: "City",    value: opts.city    ?? "—",        inline: true },
      { name: "By",      value: `@${opts.actorUsername}`,   inline: true },
      { name: "🔗 Link", value: `https://platevault.app/company/${opts.numericId}`, inline: false },
    ],
  });
}

export function logCompanyEdit(opts: {
  actorUsername: string;
  name:          string;
  numericId:     number;
  changes:       string;
}) {
  log("default", {
    title:  "✏️ Company edited",
    color:  C.yellow,
    fields: [
      { name: "Company", value: opts.name,                  inline: true },
      { name: "By",      value: `@${opts.actorUsername}`,   inline: true },
      { name: "Changes", value: opts.changes,               inline: false },
      { name: "🔗 Link", value: `https://platevault.app/company/${opts.numericId}`, inline: false },
    ],
  });
}

export function logCompanyDelete(opts: {
  actorUsername: string;
  name:          string;
}) {
  log("moderation", {
    title:  "🗑️ Company deleted",
    color:  C.red,
    fields: [
      { name: "Company", value: opts.name,                inline: true },
      { name: "By",      value: `@${opts.actorUsername}`, inline: true },
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ROAD TRIPS
// ─────────────────────────────────────────────────────────────────────────────

export function logRoadTripCreate(opts: {
  username:  string;
  name:      string;
  numericId: number;
}) {
  log("default", {
    title:  "🗺️ Road trip created",
    color:  C.teal,
    fields: [
      { name: "Name", value: opts.name,              inline: true },
      { name: "By",   value: `@${opts.username}`,    inline: true },
    ],
  });
}

export function logRoadTripDelete(opts: {
  username:  string;
  name:      string;
}) {
  log("default", {
    title:  "🗑️ Road trip deleted",
    color:  C.gray,
    fields: [
      { name: "Name", value: opts.name,           inline: true },
      { name: "By",   value: `@${opts.username}`, inline: true },
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH — PASSWORD RESET
// ─────────────────────────────────────────────────────────────────────────────

export function logPasswordResetRequest(opts: { username: string; email: string; sent: boolean }) {
  log("auth", {
    title:  "🔑 Password reset requested",
    color:  C.indigo,
    fields: [
      { name: "User",  value: `@${opts.username}`, inline: true },
      { name: "Email", value: opts.email,           inline: true },
      { name: "Email sent", value: opts.sent ? "✅ Yes" : "❌ Failed", inline: true },
    ],
  });
}

export function logPasswordResetUsed(opts: { username: string }) {
  log("auth", {
    title:  "✅ Password successfully reset",
    color:  C.green,
    fields: [
      { name: "User", value: `@${opts.username}`, inline: true },
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT
// ─────────────────────────────────────────────────────────────────────────────

export function logContactMessage(opts: { email: string; message: string }) {
  log("default", {
    title:  "📬 Contact message",
    color:  C.gray,
    fields: [
      { name: "Reply to", value: opts.email,                    inline: false },
      { name: "Message",  value: opts.message.slice(0, 900),    inline: false },
    ],
  });
}
