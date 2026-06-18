"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  imageUrl: string;
  plateText: string;
  countryName: string;
  carLabel: string;
}

export default function ShareCardButton({ imageUrl, plateText, countryName, carLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 900, H = 500;
    canvas.width = W;
    canvas.height = H;
    setReady(false);

    const photoW = Math.floor(W * 0.54);
    const infoCx = photoW + (W - photoW) / 2; // center x of right text panel

    // Background
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, W, H);

    // Right panel — plate text
    ctx.textAlign = "center";
    ctx.font = `bold 46px 'Courier New', monospace`;
    ctx.fillStyle = "#f4f4f5";
    const ptY = carLabel ? H / 2 - 20 : H / 2;
    ctx.fillText(plateText, infoCx, ptY);

    // Divider
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(photoW + 28, ptY + 18);
    ctx.lineTo(W - 28, ptY + 18);
    ctx.stroke();

    // Country
    ctx.font = "17px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#71717a";
    ctx.fillText(countryName, infoCx, ptY + 46);

    // Car label
    if (carLabel) {
      ctx.font = "14px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#52525b";
      ctx.fillText(carLabel, infoCx, ptY + 76);
    }

    // Platevault branding
    ctx.textAlign = "right";
    ctx.font = "11px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#3f3f46";
    ctx.fillText("platevault.com", W - 20, H - 14);

    // Left photo
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // Cover-fit into left panel
      const scale = Math.max(photoW / img.naturalWidth, H / img.naturalHeight);
      const sw = photoW / scale;
      const sh = H / scale;
      const sx = (img.naturalWidth - sw) / 2;
      const sy = (img.naturalHeight - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, photoW, H);

      // Fade right edge into background
      const grad = ctx.createLinearGradient(photoW - 90, 0, photoW, 0);
      grad.addColorStop(0, "rgba(9,9,11,0)");
      grad.addColorStop(1, "rgba(9,9,11,1)");
      ctx.fillStyle = grad;
      ctx.fillRect(photoW - 90, 0, 90, H);

      setReady(true);
    };

    img.onerror = () => {
      ctx.fillStyle = "#18181b";
      ctx.fillRect(0, 0, photoW, H);
      ctx.fillStyle = "#3f3f46";
      ctx.textAlign = "center";
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillText("Photo", photoW / 2, H / 2);
      setReady(true);
    };

    img.src = imageUrl;
  }, [imageUrl, plateText, countryName, carLabel]);

  useEffect(() => {
    if (open) draw();
  }, [open, draw]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `platevault-${plateText.replace(/\s+/g, "-")}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Generate share card"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/40 text-zinc-400 transition-all hover:border-indigo-700/60 hover:bg-indigo-950/20 hover:text-indigo-300"
        aria-label="Share card"
      >
        {/* Share icon */}
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.366A2.52 2.52 0 0113 4.5z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100">Share card</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
              <canvas
                ref={canvasRef}
                className="w-full"
                style={{ aspectRatio: "9/5", display: "block" }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-600">
                {ready ? "Right-click to copy · or download below" : "Generating card…"}
              </p>
              <button
                onClick={download}
                disabled={!ready}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
              >
                ↓ Download PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
