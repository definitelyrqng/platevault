"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  targetId: string;       // DB id (cuid)
  targetUsername: string;
  targetRole: string;
  isBanned: boolean;
  banExpiresAt: string | null;
  actorRole: string;
};

const ROLE_OPTIONS = [
  { value: "USER",  label: "User" },
  { value: "MOD",   label: "Moderator" },
  { value: "ADMIN", label: "Admin" },
];

export default function UserAdminPanel({
  targetId,
  targetUsername,
  targetRole,
  isBanned,
  banExpiresAt,
  actorRole,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Ban state
  const [banMode, setBanMode] = useState<"tban" | "pban" | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState("7");
  const [banning, setBanning] = useState(false);
  const [unbanning, setUnbanning] = useState(false);

  // Role state
  const [selectedRole, setSelectedRole] = useState(targetRole);
  const [savingRole, setSavingRole] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function clearMessages() { setError(""); setSuccess(""); }

  async function handleBan() {
    setBanning(true); clearMessages();
    try {
      const body: Record<string, unknown> = { reason: banReason || null };
      if (banMode === "tban") body.days = Number(banDays);

      const res = await fetch(`/api/admin/users/${targetId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed."); return; }
      setSuccess(banMode === "tban" ? `@${targetUsername} temp-banned for ${banDays} days.` : `@${targetUsername} permanently banned.`);
      setBanMode(null); setBanReason("");
      router.refresh();
    } finally { setBanning(false); }
  }

  async function handleUnban() {
    setUnbanning(true); clearMessages();
    try {
      const res = await fetch(`/api/admin/users/${targetId}/ban`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed."); return; }
      setSuccess(`@${targetUsername} has been unbanned.`);
      router.refresh();
    } finally { setUnbanning(false); }
  }

  async function handleRoleChange() {
    if (selectedRole === targetRole) return;
    setSavingRole(true); clearMessages();
    try {
      const res = await fetch(`/api/admin/users/${targetId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed."); setSelectedRole(targetRole); return; }
      setSuccess(`Role updated to ${selectedRole}.`);
      router.refresh();
    } finally { setSavingRole(false); }
  }

  const canSetAdmin = actorRole === "SUPERADMIN";
  const roleOptions = canSetAdmin ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value !== "ADMIN");

  return (
    <div className="rounded-2xl border border-amber-900/40 bg-amber-950/10 p-4 mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-400"
      >
        <span>⚙ User Admin Panel</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-5">

          {/* Role */}
          <div>
            <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Rank</div>
            <div className="flex gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              >
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <button
                onClick={handleRoleChange}
                disabled={savingRole || selectedRole === targetRole}
                className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-40"
              >
                {savingRole ? "Saving…" : "Apply"}
              </button>
            </div>
          </div>

          {/* Ban */}
          <div>
            <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Ban</div>

            {isBanned ? (
              <div className="space-y-2">
                <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-300">
                  Currently banned{banExpiresAt ? ` until ${new Date(banExpiresAt).toLocaleDateString("en-GB")}` : " permanently"}.
                </div>
                <button
                  onClick={handleUnban}
                  disabled={unbanning}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
                >
                  {unbanning ? "Lifting ban…" : "Lift ban"}
                </button>
              </div>
            ) : (
              <>
                {!banMode && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setBanMode("tban"); clearMessages(); }}
                      className="flex-1 rounded-xl border border-amber-900/50 bg-amber-950/20 py-2 text-xs font-medium text-amber-400 hover:bg-amber-950/40"
                    >
                      Temp ban
                    </button>
                    <button
                      onClick={() => { setBanMode("pban"); clearMessages(); }}
                      className="flex-1 rounded-xl border border-red-900/50 bg-red-950/20 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40"
                    >
                      Perm ban
                    </button>
                  </div>
                )}

                {banMode && (
                  <div className="space-y-2">
                    {banMode === "tban" && (
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Duration (days)</label>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={banDays}
                          onChange={(e) => setBanDays(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Reason (shown to user)</label>
                      <textarea
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder="e.g. Repeated rule violations, spam…"
                        maxLength={500}
                        rows={2}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600 resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setBanMode(null); setBanReason(""); }}
                        className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBan}
                        disabled={banning}
                        className="flex-1 rounded-xl border border-red-900/50 bg-red-950/50 py-2 text-xs font-medium text-red-300 hover:bg-red-950 disabled:opacity-50"
                      >
                        {banning ? "Banning…" : banMode === "tban" ? `Ban for ${banDays}d` : "Ban permanently"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {error   && <p className="text-xs text-red-400">{error}</p>}
          {success && <p className="text-xs text-emerald-400">{success}</p>}
        </div>
      )}
    </div>
  );
}
