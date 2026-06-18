import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const imageFile = form.get("image") as File | null;
    if (!imageFile) return NextResponse.json({ error: "No image" }, { status: 400 });

    const buffer = Buffer.from(await imageFile.arrayBuffer());

    // Dynamic import so it's only loaded at runtime (not during build)
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    await worker.setParameters({
      // Only allow characters found on plates
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ",
    });

    const {
      data: { text },
    } = await worker.recognize(buffer);
    await worker.terminate();

    // Clean: collapse whitespace, uppercase, strip non-plate chars
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
