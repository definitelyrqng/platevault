#!/usr/bin/env node
/**
 * Czech plate artwork from the supplied plates (assets/czech/*-source.png): lettering and the two inspection
 * stickers are removed (the stickers are saved as separate images so the site can show or hide them),
 * outside corners become transparent.
 *
 *   node scripts/build-czech-art.cjs  →  public/plates/czech/{single,two}-euro.png, sticker-red.png, sticker-green.png
 */
const sharp = require("sharp");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public/plates/czech");

async function clean(file, out, white, stickerBoxes) {
  const { data, info } = await sharp(path.join(ROOT, "assets/czech", file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const stickers = [];
  for (const [name, [x0, y0, x1, y1]] of Object.entries(stickerBoxes || {})) {
    stickers.push([name, await sharp(data, { raw: { width: W, height: H, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }).png().toBuffer()]);
  }
  for (const [x0, y0, x1, y1] of white) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * W + x) * 4; data[i] = data[i + 1] = data[i + 2] = 255; data[i + 3] = 255; }
  const seen = new Uint8Array(W * H), st = [];
  const isBg = (x, y) => { const i = (y * W + x) * 4; return data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235; };
  const push = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const k = y * W + x; if (seen[k] || !isBg(x, y)) return; seen[k] = 1; st.push(k); };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (st.length) { const k = st.pop(), x = k % W, y = (k / W) | 0; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
  for (let k = 0; k < W * H; k++) if (seen[k]) data[k * 4 + 3] = 0;
  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(OUT, out));
  return stickers;
}

(async () => {
  const s1 = await clean("single-source.png", "single-euro.png", [[102, 15, 975, 205]], { "sticker-red": [452, 26, 538, 112], "sticker-green": [452, 112, 538, 198] });
  for (const [n, b] of s1) await sharp(b).toFile(path.join(OUT, n + ".png"));
  await clean("two-source.png", "two-euro.png", [[100, 15, 538, 384], [21, 207, 100, 384]]);
  // old plate style (no euroband): the band area is white
  for (const [n, box] of [["single", [14, 15, 102, 206]], ["two", [21, 15, 100, 206]]]) {
    const { data, info } = await sharp(path.join(OUT, n + "-euro.png")).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let y = box[1]; y <= box[3]; y++) for (let x = box[0]; x <= box[2]; x++) { const i = (y * info.width + x) * 4; if (data[i + 3] > 0) { data[i] = data[i + 1] = data[i + 2] = 255; } }
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(path.join(OUT, n + ".png"));
  }
  // old plates without the euroband: same artwork, the band area painted white (keeps the transparent corners)
  async function noBand(from, to, box) {
    const { data, info } = await sharp(path.join(OUT, from)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const [x0, y0, x1, y1] = box;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * info.width + x) * 4; if (data[i + 3] > 0) { data[i] = data[i + 1] = data[i + 2] = 255; data[i + 3] = 255; } }
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(path.join(OUT, to));
  }
  // motorcycle plate (one inspection sticker)
  await clean("moto-source.png", "moto-euro.png", [[76, 10, 313, 250], [14, 130, 75, 250]]);
  await noBand("single-euro.png", "single.png", [21, 14, 101, 205]);
  await noBand("two-euro.png", "two.png", [21, 14, 100, 206]);
  await noBand("moto-euro.png", "moto.png", [14, 9, 75, 129]);
  console.log("ok");
})();
