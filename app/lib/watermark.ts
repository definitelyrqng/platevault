import sharp from "sharp";
import path from "path";
import fs from "fs";

const WATERMARK_PATH = path.join(process.cwd(), "public", "watermark.png");
// Watermark = white logo at 50% opacity, 500x500 RGBA PNG

/**
 * Downloads an image from a URL, composites the PlateVault watermark
 * in the top-left corner, and returns the watermarked image as a Buffer.
 *
 * Watermark is scaled to ~22% of the shorter image dimension so it stays
 * proportionate on both landscape and portrait photos.
 */
export async function applyWatermark(imageUrl: string): Promise<Buffer> {
  // Fetch original image
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const imageBuffer = Buffer.from(await res.arrayBuffer());

  // Get source dimensions
  const meta = await sharp(imageBuffer).metadata();
  const w = meta.width  ?? 1280;
  const h = meta.height ?? 720;

  // Scale watermark to 22% of the shorter side, min 80px, max 320px
  const shorter  = Math.min(w, h);
  const wmSize   = Math.max(80, Math.min(320, Math.round(shorter * 0.22)));
  const wmBuffer = await sharp(fs.readFileSync(WATERMARK_PATH))
    .resize(wmSize, wmSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Composite: top-left with 12px margin
  const margin = Math.round(wmSize * 0.08);
  const result = await sharp(imageBuffer)
    .composite([{ input: wmBuffer, top: margin, left: margin, blend: "over" }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}
