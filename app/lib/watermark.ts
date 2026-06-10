import sharp from "sharp";
import path from "path";
import fs from "fs";

// Watermark source: platevaultwatermark.png (1920x1080) converted to white at 50% opacity
const WATERMARK_PATH = path.join(process.cwd(), "public", "watermark.png");

/**
 * Downloads an image from a URL, composites the PlateVault watermark
 * in the top-left corner, and returns the watermarked image as a Buffer.
 *
 * Watermark is scaled to ~16% of the image width (wide aspect source).
 */
export async function applyWatermark(imageUrl: string): Promise<Buffer> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const imageBuffer = Buffer.from(await res.arrayBuffer());

  const meta = await sharp(imageBuffer).metadata();
  const w = meta.width ?? 1280;

  // Scale watermark to 20% of image width, min 140px, max 420px
  const wmWidth  = Math.max(140, Math.min(420, Math.round(w * 0.20)));
  const wmBuffer = await sharp(fs.readFileSync(WATERMARK_PATH))
    .resize(wmWidth, null)   // scale by width, height auto from aspect ratio
    .toBuffer();

  const margin = 16;
  const result = await sharp(imageBuffer)
    .composite([{ input: wmBuffer, top: margin, left: margin, blend: "over" }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}
