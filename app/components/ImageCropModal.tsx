"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Props = {
  file: File;
  aspectRatio: number; // 1 = square avatar, 3 = banner (3:1)
  label: string;
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
};

export default function ImageCropModal({ file, aspectRatio, label, onConfirm, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);

  const [scale,  setScale]  = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ready,  setReady]  = useState(false);

  const drag  = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const touch = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  // Internal canvas resolution
  const CANVAS_W = 600;
  const CANVAS_H = Math.round(CANVAS_W / aspectRatio);

  // Output resolution
  const OUT_W = aspectRatio === 1 ? 500 : 1500;
  const OUT_H = Math.round(OUT_W / aspectRatio);

  // ── Convert CSS px → canvas px ──────────────────────────────────────────────
  // The canvas element is displayed at CSS width < CANVAS_W due to maxWidth.
  // All mouse/touch coords come in CSS px — we must scale them up to canvas px.
  const cssToCanvas = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return 1;
    return CANVAS_W / el.clientWidth;
  }, [CANVAS_W]);

  // ── Load image ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const s = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
      setScale(s);
      setOffset({
        x: (CANVAS_W - img.naturalWidth  * s) / 2,
        y: (CANVAS_H - img.naturalHeight * s) / 2,
      });
      setReady(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, CANVAS_W, CANVAS_H]);

  // ── Draw ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(img, offset.x, offset.y, img.naturalWidth * scale, img.naturalHeight * scale);

    // Indigo border
    ctx.strokeStyle = "rgba(99,102,241,0.9)";
    ctx.lineWidth   = 3;
    ctx.strokeRect(1.5, 1.5, CANVAS_W - 3, CANVAS_H - 3);

    // Rule-of-thirds
    ctx.strokeStyle = "rgba(255,255,255,0.13)";
    ctx.lineWidth   = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(CANVAS_W * i / 3, 0); ctx.lineTo(CANVAS_W * i / 3, CANVAS_H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, CANVAS_H * i / 3); ctx.lineTo(CANVAS_W, CANVAS_H * i / 3); ctx.stroke();
    }
  }, [ready, offset, scale, CANVAS_W, CANVAS_H]);

  // ── Clamp so image always covers canvas ─────────────────────────────────────
  const clamp = useCallback((ox: number, oy: number, s: number) => {
    const img = imgRef.current;
    if (!img) return { x: ox, y: oy };
    return {
      x: Math.min(0, Math.max(ox, CANVAS_W - img.naturalWidth  * s)),
      y: Math.min(0, Math.max(oy, CANVAS_H - img.naturalHeight * s)),
    };
  }, [CANVAS_W, CANVAS_H]);

  // ── Mouse ────────────────────────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    drag.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!drag.current) return;
    const r = cssToCanvas();
    const dx = (e.clientX - drag.current.startX) * r;
    const dy = (e.clientY - drag.current.startY) * r;
    setOffset(clamp(drag.current.ox + dx, drag.current.oy + dy, scale));
  }
  function onMouseUp() { drag.current = null; }

  // ── Touch ────────────────────────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touch.current = { startX: t.clientX, startY: t.clientY, ox: offset.x, oy: offset.y };
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!touch.current) return;
    e.preventDefault();
    const t = e.touches[0];
    const r = cssToCanvas();
    const dx = (t.clientX - touch.current.startX) * r;
    const dy = (t.clientY - touch.current.startY) * r;
    setOffset(clamp(touch.current.ox + dx, touch.current.oy + dy, scale));
  }

  // ── Scroll to zoom ───────────────────────────────────────────────────────────
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const img = imgRef.current;
    if (!img) return;
    const minScale = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
    const newScale = Math.min(12, Math.max(minScale, scale * (e.deltaY < 0 ? 1.08 : 0.93)));

    // Zoom toward cursor — convert cursor CSS px → canvas px
    const r    = cssToCanvas();
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx   = (e.clientX - rect.left) * r;
    const cy   = (e.clientY - rect.top)  * r;
    const ratio = newScale / scale;
    setScale(newScale);
    setOffset(clamp(cx - ratio * (cx - offset.x), cy - ratio * (cy - offset.y), newScale));
  }

  // ── +/− buttons ─────────────────────────────────────────────────────────────
  function zoom(dir: 1 | -1) {
    const img = imgRef.current;
    if (!img) return;
    const minScale = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
    const newScale = Math.min(12, Math.max(minScale, scale * (dir > 0 ? 1.15 : 0.87)));
    const ratio = newScale / scale;
    const cx = CANVAS_W / 2, cy = CANVAS_H / 2;
    setScale(newScale);
    setOffset(clamp(cx - ratio * (cx - offset.x), cy - ratio * (cy - offset.y), newScale));
  }

  // ── Confirm ──────────────────────────────────────────────────────────────────
  function confirm() {
    const img = imgRef.current;
    if (!img) return;
    const out = document.createElement("canvas");
    out.width  = OUT_W;
    out.height = OUT_H;
    const ctx  = out.getContext("2d");
    if (!ctx) return;

    const r = OUT_W / CANVAS_W;
    ctx.drawImage(
      img,
      offset.x * r, offset.y * r,
      img.naturalWidth  * scale * r,
      img.naturalHeight * scale * r,
    );
    out.toBlob((blob) => {
      if (!blob) return;
      onConfirm(new File([blob], `${aspectRatio === 1 ? "avatar" : "banner"}-crop.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  }

  // Banner needs a wider modal so the 3:1 area isn't too short
  const modalMaxW = aspectRatio === 1 ? "max-w-lg" : "max-w-2xl";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-4">
      <div className={`w-full ${modalMaxW} rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <p className="text-sm font-semibold text-zinc-100">Crop {label}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Drag to reposition · scroll to zoom</p>
          </div>
          <button onClick={onCancel}
            className="rounded-full p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Canvas — uses aspect-ratio CSS so height scales correctly with width */}
        <div className="px-5 pt-4">
          <div
            className="relative overflow-hidden rounded-xl cursor-grab active:cursor-grabbing select-none w-full"
            style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="absolute inset-0 w-full h-full"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={() => { touch.current = null; }}
              onWheel={onWheel}
            />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/70">
                <div className="h-6 w-6 rounded-full border-2 border-zinc-700 border-t-indigo-400 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-5 py-4 mt-1">
          <div className="flex items-center gap-1">
            <button onClick={() => zoom(-1)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors">−</button>
            <span className="text-xs text-zinc-600 w-14 text-center tabular-nums">{Math.round(scale * 100)}%</span>
            <button onClick={() => zoom(1)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors">+</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onCancel}
              className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
            <button onClick={confirm}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-950/50">
              Use this crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
