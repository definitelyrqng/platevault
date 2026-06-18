import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const imageFile = form.get("image") as File | null;
    if (!imageFile) return NextResponse.json({ error: "No image" }, { status: 400 });

    const buffer = Buffer.from(await imageFile.arrayBuffer());

    // Cache the trained data in public/tessdata (local dev) or /tmp (serverless)
    const localCache = path.join(process.cwd(), "public", "tessdata");
    const tmpCache = "/tmp/tessdata";
    let cachePath = tmpCache;
    try {
      fs.mkdirSync(localCache, { recursive: true });
      // Quick write-access test
      fs.accessSync(localCache, fs.constants.W_OK);
      cachePath = localCache;
    } catch {
      try { fs.mkdirSync(tmpCache, { recursive: true }); } catch { /* /tmp may already exist */ }
    }

    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng", 1, { cachePath });
    await worker.setParameters({
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ",
    });

    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();

    const cleaned = text
      .toUpperCase()
      .replace(/[^A-Z0-9 -]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return NextResponse.json({ text: cleaned });
  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json({ error: "OCR failed" }, { status: 500 });
  }
}
