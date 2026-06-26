"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Props = {
  file: File;
  aspectRatio: number; // e.g. 1 for square, 3 for banner (3:1)
  label: string;
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
};

export default function ImageCropModal({ file, aspectRatio, label, onConfirm, onCancel }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const imgRef      = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Image position & scale relative to canvas
  const [scale, setScale]   = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ready, setReady]   = useState(false);

  // Drag state
  const drag = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  // Canvas display size (fixed)
  const CANVAS_W = 480;
  const CANVAS_H = Math.round(CANVAS_W / aspectRatio);

  // Output size
  const OUT_W = aspectRatio === 1 ? 400 : 1200;
  const OUT_H = Math.round(OUT_W / aspectRatio);

  // Load image
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Fit image to cover canvas
      const fitScale = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
      const s = Math.max(fitScale, 0.1);
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

  // Draw
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(img, offset.x, offset.y, img.naturalWidth * scale, img.naturalHeight * scale);

    // Dim overlay outside crop (the whole canvas IS the crop area, so just draw a border)
    ctx.strokeStyle = "rgba(99,102,241,0.8)";
    ctx.lineWidth   = 2;
    ctx.strokeRect(1, 1, CANVAS_W - 2, CANVAS_H - 2);

    // Rule-of-thirds grid
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth   = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(CANVAS_W * i / 3, 0); ctx.lineTo(CANVAS_W * i / 3, CANVAS_H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, CANVAS_H * i / 3); ctx.lineTo(CANVAS_W, CANVAS_H * i / 3); ctx.stroke();
    }
  }, [ready, offset, scale, CANVAS_W, CANVAS_H]);

  // Clamp offset so image always covers canvas
  const clampOffset = useCallback((ox: number, oy: number, s: number) => {
    const img = imgRef.current;
    if (!img) return { x: ox, y: oy };
    const iw = img.naturalWidth  * s;
    const ih = img.naturalHeight * s;
    return {
      x: Math.min(0, Math.max(ox, CANVAS_W - iw)),
      y: Math.min(0, Math.max(oy, CANVAS_H - ih)),
    };
  }, [CANVAS_W, CANVAS_H]);

  // Mouse drag
  function onMouseDown(e: React.MouseEvent) {
    drag.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    setOffset(clampOffset(drag.current.ox + dx, drag.current.oy + dy, scale));
  }
  function onMouseUp() { drag.current = null; }

  // Touch drag
  const touch = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touch.current = { startX: t.clientX, startY: t.clientY, ox: offset.x, oy: offset.y };
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!touch.current) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - touch.current.startX;
    const dy = t.clientY - touch.current.startY;
    setOffset(clampOffset(touch.current.ox + dx, touch.current.oy + dy, scale));
  }

  // Scroll to zoom
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const img = imgRef.current;
    if (!img) return;
    const minScale = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
    const newScale = Math.min(10, Math.max(minScale, scale * (e.deltaY < 0 ? 1.08 : 0.93)));

    // Zoom toward cursor
    const rect  = canvasRef.current!.getBoundingClientRect();
    const cx    = e.clientX - rect.left;
    const cy    = e.clientY - rect.top;
    const ratio = newScale / scale;
    const newOx = cx - ratio * (cx - offset.x);
    const newOy = cy - ratio * (cy - offset.y);
    setScale(newScale);
    setOffset(clampOffset(newOx, newOy, newScale));
  }

  // Zoom buttons
  function zoom(dir: 1 | -1) {
    const img = imgRef.current;
    if (!img) return;
    const minScale = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
    const newScale = Math.min(10, Math.max(minScale, scale * (dir > 0 ? 1.15 : 0.87)));
    const ratio    = newScale / scale;
    const cx = CANVAS_W / 2, cy = CANVAS_H / 2;
    setScale(newScale);
    setOffset(clampOffset(cx - ratio * (cx - offset.x), cy - ratio * (cy - offset.y), newScale));
  }

  // Confirm — draw to off-screen canvas at output resolution
  async function confirm() {
    const img = imgRef.current;
    if (!img) return;
    const out = document.createElement("canvas");
    out.width  = OUT_W;
    out.height = OUT_H;
    const ctx  = out.getContext("2d");
    if (!ctx) return;

    const scaleRatio = OUT_W / CANVAS_W;
    ctx.drawImage(
      img,
      offset.x * scaleRatio,
      offset.y * scaleRatio,
      img.naturalWidth  * scale * scaleRatio,
      img.naturalHeight * scale * scaleRatio,
    );

    out.toBlob((blob) => {
      if (!blob) return;
      const ext  = aspectRatio === 1 ? "avatar" : "banner";
      onConfirm(new File([blob], `${ext}-crop.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.9);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <p className="text-sm font-semibold text-zinc-100">Crop {label}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Drag to reposition · scroll or pinch to zoom</p>
          </div>
          <button onClick={onCancel} className="rounded-full p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Canvas crop area */}
        <div className="px-5 pt-4">
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-xl cursor-grab active:cursor-grabbing select-none"
            style={{ width: CANVAS_W, height: CANVAS_H, maxWidth: "100%" }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{ display: "block", width: "100%", height: "auto" }}
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
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60">
                <div className="h-6 w-6 rounded-full border-2 border-zinc-700 border-t-indigo-400 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Zoom controls + actions */}
        <div className="flex items-center justify-between px-5 py-4 mt-1">
          {/* Zoom buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => zoom(-1)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
              title="Zoom out"
            >−</button>
            <span className="text-xs text-zinc-600 w-12 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => zoom(1)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
              title="Zoom in"
            >+</button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirm}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              Use this crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
