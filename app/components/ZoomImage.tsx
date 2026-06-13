"use client";

import { useRef, useState } from "react";

export default function ZoomImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [origin, setOrigin] = useState("50% 50%");
  const [zoomed, setZoomed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={() => setZoomed(false)}
      className={"overflow-hidden cursor-crosshair " + (className ?? "")}
    >
      <img
        src={src}
        alt={alt}
        className="w-full object-contain max-h-64 rounded-xl transition-transform duration-200 ease-out pointer-events-none"
        style={{
          transform: zoomed ? "scale(2.5)" : "scale(1)",
          transformOrigin: origin,
        }}
      />
    </div>
  );
}
