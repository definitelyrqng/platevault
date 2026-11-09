"use client";

import { useEffect, useRef, useState } from "react";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/lib/uploadthing";
import ImageCropModal from "@/app/components/ImageCropModal";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

type Me = {
  numericId: number;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
};

type UploadStatus = "idle" | "uploading" | "saved" | "error";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_PICK_MB = 25; // raw file limit before cropping (the cropped result is small)

// ─── Image picker: pick → crop → upload immediately ─────────────────────────

function ImagePicker({
  kind,
  label,
  hint,
  currentUrl,
  aspectRatio,
  onSaved,
}: {
  kind: "avatarUploader" | "bannerUploader";
  label: string;
  hint: string;
  currentUrl: string | null;
  aspectRatio: number;
  onSaved: (url: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [status, setStatus]   = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError]     = useState("");
  const lastCropped = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isBanner = aspectRatio > 1;

  useEffect(() => { setPreview(currentUrl); }, [currentUrl]);

  const { startUpload } = useUploadThing(kind, {
    onUploadProgress: (p) => setProgress(p),
    onUploadError: (e) => setError(e.message || "Upload failed."),
  });

  function pick(f: File) {
    setError("");
    if (!ACCEPT.split(",").includes(f.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (f.size > MAX_PICK_MB * 1024 * 1024) {
      setError(`That image is over ${MAX_PICK_MB} MB — please pick a smaller one.`);
      return;
    }
    setRawFile(f);
  }

  async function upload(file: File) {
    lastCropped.current = file;
    const previous = preview;
    const local = URL.createObjectURL(file);
    setPreview(local);
    setStatus("uploading");
    setProgress(0);
    setError("");

    try {
      const res = await startUpload([file]);
      // startUpload resolves to undefined on failure (onUploadError has the reason)
      const url = res?.[0]?.serverData?.url ?? res?.[0]?.ufsUrl;
      if (!url) throw new Error("");
      setStatus("saved");
      onSaved(url);
    } catch (e) {
      setStatus("error");
      setPreview(previous);
      setError((cur) => cur || (e instanceof Error && e.message) || "Upload failed — please try again.");
    } finally {
      URL.revokeObjectURL(local);
    }
  }

  function onCropConfirm(cropped: File) {
    setRawFile(null);
    void upload(cropped);
  }

  const busy = status === "uploading";

  return (
    <>
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <div>
            <span className="block text-sm font-medium text-zinc-200">{label}</span>
            <span className="block text-xs text-zinc-500">{hint}</span>
          </div>
          {status === "saved" && <span className="shrink-0 text-xs font-medium text-emerald-400">✓ Saved</span>}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={`group relative block overflow-hidden border border-zinc-700 bg-zinc-900 transition-colors hover:border-zinc-500 disabled:cursor-wait ${
            isBanner ? "aspect-[3/1] w-full rounded-xl" : "h-28 w-28 rounded-2xl"
          }`}
        >
          {preview ? (
            <img src={preview} alt={label} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
              📷 Upload {label.toLowerCase()}
            </span>
          )}

          {/* Hover hint */}
          {!busy && preview && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-medium text-white opacity-0 transition group-hover:bg-black/50 group-hover:opacity-100">
              Change {label.toLowerCase()}
            </span>
          )}

          {/* Upload progress */}
          {busy && (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-xs font-medium text-white">
              Uploading… {progress}%
              <span className="h-1 w-2/3 overflow-hidden rounded-full bg-white/20">
                <span className="block h-full bg-indigo-500 transition-[width]" style={{ width: `${progress}%` }} />
              </span>
            </span>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ""; }}
        />

        {error && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-red-400">
            <span>✗ {error}</span>
            {status === "error" && lastCropped.current && (
              <button type="button" onClick={() => lastCropped.current && upload(lastCropped.current)}
                className="rounded-md border border-red-900/60 px-2 py-0.5 font-medium text-red-300 hover:bg-red-950/40">
                Try again
              </button>
            )}
            {error.includes("log in") && (
              <a href="/login?next=/settings/profile" className="font-medium text-red-300 underline">Log in</a>
            )}
          </div>
        )}
      </div>

      {rawFile && (
        <ImageCropModal
          file={rawFile}
          aspectRatio={aspectRatio}
          label={label}
          onConfirm={onCropConfirm}
          onCancel={() => setRawFile(null)}
          onError={(msg) => { setRawFile(null); setError(msg); }}
        />
      )}
    </>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function EditProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/users/me/profile", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setMe(d.user);
          setBio(d.user.bio ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveBio(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setErr("");
    setSaved(false);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not save your bio.");
      }
      setSaved(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
      </main>
    );
  }

  if (!me) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center text-zinc-100">
        <div className="text-center">
          <p className="text-zinc-400">You need to be logged in to edit your profile.</p>
          <a href="/login?next=/settings/profile" className="mt-4 inline-block text-sm text-zinc-200 underline">Log in</a>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
            <a href={`/u/${me.numericId}`} className="transition-colors hover:text-indigo-400">@{me.username}</a>
            <span>›</span>
            <span className="text-zinc-300">Edit profile</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Edit profile</h1>
          <p className="mt-1 text-sm text-zinc-500">Pictures save as soon as you confirm the crop.</p>
        </div>

        <div className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <ImagePicker
            kind="bannerUploader"
            label="Banner"
            hint="Wide header image (3:1). JPG, PNG or WebP."
            currentUrl={me.bannerUrl}
            aspectRatio={3}
            onSaved={(url) => setMe((m) => (m ? { ...m, bannerUrl: url } : m))}
          />

          <ImagePicker
            kind="avatarUploader"
            label="Profile picture"
            hint="Square photo shown on your profile and comments. JPG, PNG or WebP."
            currentUrl={me.avatarUrl}
            aspectRatio={1}
            onSaved={(url) => setMe((m) => (m ? { ...m, avatarUrl: url } : m))}
          />

          <form onSubmit={saveBio} className="space-y-3 border-t border-zinc-800 pt-6">
            {saved && (
              <div className="rounded-xl border border-emerald-800 bg-emerald-950/40 px-4 py-2.5 text-sm text-emerald-300">
                ✓ Bio saved.{" "}
                <a href={`/u/${me.numericId}`} className="underline hover:no-underline">View your profile →</a>
              </div>
            )}
            {err && (
              <div className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">✗ {err}</div>
            )}
            <div>
              <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-zinc-200">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => { setBio(e.target.value); setSaved(false); }}
                maxLength={280}
                rows={4}
                placeholder="Tell the community a bit about yourself…"
                className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-indigo-700/60 focus:ring-1 focus:ring-indigo-700/20"
              />
              <div className="mt-1 flex items-center justify-between text-xs text-zinc-600">
                <span>Max 280 characters</span>
                <span className={bio.length > 260 ? "text-amber-400" : ""}>{bio.length}/280</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save bio"}
              </button>
              <a href={`/u/${me.numericId}`} className="text-sm text-zinc-500 hover:text-zinc-300">
                Back to profile
              </a>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
