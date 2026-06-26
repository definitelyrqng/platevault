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

// ─── Image picker with crop ───────────────────────────────────────────────────

function ImagePicker({
  label,
  hint,
  currentUrl,
  accept,
  aspectRatio,
  onFile,
}: {
  label: string;
  hint: string;
  currentUrl: string | null;
  accept: string;
  aspectRatio: number;
  onFile: (f: File) => void;
}) {
  const [preview, setPreview]       = useState<string | null>(currentUrl);
  const [rawFile, setRawFile]       = useState<File | null>(null);
  const [cropping, setCropping]     = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setPreview(currentUrl); }, [currentUrl]);

  function pick(f: File) {
    setRawFile(f);
    setCropping(true);
  }

  function onCropConfirm(cropped: File) {
    setCropping(false);
    setRawFile(null);
    setPreview(URL.createObjectURL(cropped));
    onFile(cropped);
  }

  function onCropCancel() {
    setCropping(false);
    setRawFile(null);
    // Reset file input so same file can be re-picked
    if (ref.current) ref.current.value = "";
  }

  return (
    <>
      <div>
        <span className="block text-sm text-zinc-300 mb-1.5">{label}</span>
        <span className="block text-xs text-zinc-500 mb-2">{hint}</span>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="relative group block w-full overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 hover:border-zinc-500 transition-colors"
          style={{ minHeight: label === "Banner" ? "100px" : "80px" }}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt={label}
                className={`w-full object-cover ${label === "Banner" ? "h-28" : "h-20"}`}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/0 group-hover:bg-zinc-950/50 transition-colors">
                <span className="opacity-0 group-hover:opacity-100 text-xs text-zinc-100">Change {label.toLowerCase()}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-20 gap-2">
              <span className="text-zinc-500 text-sm">📷 Upload {label.toLowerCase()}</span>
            </div>
          )}
        </button>
        <input
          ref={ref}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ""; }}
        />
      </div>

      {/* Crop modal */}
      {cropping && rawFile && (
        <ImageCropModal
          file={rawFile}
          aspectRatio={aspectRatio}
          label={label}
          onConfirm={onCropConfirm}
          onCancel={onCropCancel}
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const { startUpload: uploadAvatar } = useUploadThing("avatarUploader");
  const { startUpload: uploadBanner } = useUploadThing("bannerUploader");

  useEffect(() => {
    fetch("/api/users/me/profile")
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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setErr("");
    setSaved(false);

    try {
      await Promise.all([
        avatarFile ? uploadAvatar([avatarFile]) : Promise.resolve(null),
        bannerFile ? uploadBanner([bannerFile]) : Promise.resolve(null),
      ]);

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      if (!res.ok) throw new Error("Could not save profile.");

      setSaved(true);
      setAvatarFile(null);
      setBannerFile(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
      </main>
    );
  }

  if (!me) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">You need to be logged in to edit your profile.</p>
          <a href="/login" className="mt-4 inline-block text-sm text-zinc-200 underline">Log in</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
            <a href={`/u/${me.numericId}`} className="hover:text-indigo-400 transition-colors">@{me.username}</a>
            <span>›</span>
            <span className="text-zinc-300">Edit profile</span>
          </div>
          <h1 className="text-2xl font-semibold">Edit profile</h1>
        </div>

        {saved && (
          <div className="mb-5 rounded-2xl border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
            ✓ Profile saved!{" "}
            <a href={`/u/${me.numericId}`} className="underline hover:no-underline">View your profile →</a>
          </div>
        )}
        {err && (
          <div className="mb-5 rounded-2xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            ✗ {err}
          </div>
        )}

        <form onSubmit={save} className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">

          <ImagePicker
            label="Banner"
            hint="Wide image for your profile header. JPG / PNG / WebP, max 4 MB."
            currentUrl={me.bannerUrl}
            accept="image/jpeg,image/png,image/webp"
            aspectRatio={3}
            onFile={setBannerFile}
          />

          <ImagePicker
            label="Avatar"
            hint="Square photo shown on your profile and comments. JPG / PNG / WebP, max 2 MB."
            currentUrl={me.avatarUrl}
            accept="image/jpeg,image/png,image/webp"
            aspectRatio={1}
            onFile={setAvatarFile}
          />

          <div>
            <label htmlFor="bio" className="block text-sm text-zinc-300 mb-1.5">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              rows={4}
              placeholder="Tell the community a bit about yourself…"
              className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-700/60 focus:ring-1 focus:ring-indigo-700/20 placeholder:text-zinc-600 transition-colors"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-zinc-600">
              <span>Max 280 characters</span>
              <span className={bio.length > 260 ? "text-amber-400" : ""}>{bio.length}/280</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-950/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
            <a
              href={`/u/${me.numericId}`}
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
