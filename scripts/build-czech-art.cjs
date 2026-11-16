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
  for (const [n, b] of s1) {          // round, so they sit on any plate colour
    const m = await sharp(b).metadata();
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}"><circle cx="${m.width / 2}" cy="${m.height / 2}" r="${Math.min(m.width, m.height) / 2 - 0.5}" fill="#fff"/></svg>`);
    await sharp(b).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toFile(path.join(OUT, n + ".png"));
  }
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

  // US-size plate (2 : 1), with and without euroband
  {
    const band = await sharp(path.join(OUT, "single-euro.png")).extract({ left: 21, top: 14, width: 81, height: 192 }).resize(134, 268, { kernel: "lanczos3" }).toBuffer();
    const frame = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="497"><rect width="1000" height="497" rx="34" fill="#141414"/><rect x="12" y="12" width="976" height="473" rx="24" fill="#ffffff"/></svg>`);
    await sharp(frame).composite([{ input: band, left: 14, top: 14 }]).png().toFile(path.join(OUT, "us-euro.png"));
    await sharp(frame).png().toFile(path.join(OUT, "us.png"));
  }
  // old diplomatic plate: turquoise face, yellow frame and lettering
  {
    const { data, info } = await sharp(path.join(OUT, "single.png")).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (lum > 200) { data[i] = 63; data[i + 1] = 193; data[i + 2] = 224; }
      else if (lum < 90) { data[i] = 232; data[i + 1] = 170; data[i + 2] = 0; }
    }
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(path.join(OUT, "diplomatic-old.png"));
  }
  // export plate: the red month grid at the right end
  {
    const rows = [["04", "05", "06"], ["C7", "08", "09"], ["10", "11", "12"], ["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["10", "11", "12"]];
    const cw = 27.5, ch = 27;
    let g = "";
    rows.forEach((r, ri) => r.forEach((t, ci) => { g += `<text x="${898 + ci * cw + cw / 2}" y="${16 + ri * ch + ch / 2 + 5}" font-family="Arial, sans-serif" font-weight="700" font-size="14" fill="#fff" text-anchor="middle">${t}</text>`; }));
    let lines = "";
    for (let i = 1; i < 3; i++) lines += `<rect x="${898 + i * cw - 0.75}" y="16" width="1.5" height="189" fill="#fff" fill-opacity=".85"/>`;
    for (let i = 1; i < 7; i++) lines += `<rect x="898" y="${16 + i * ch - 0.75}" width="${3 * cw}" height="1.5" fill="#fff" fill-opacity=".85"/>`;
    const rings = '<circle cx="494" cy="68" r="34" fill="none" stroke="#d9d9d9" stroke-width="3"/><circle cx="494" cy="150" r="34" fill="none" stroke="#d9d9d9" stroke-width="3"/>';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="221"><rect x="898" y="16" width="${3 * cw}" height="189" fill="#e8472f"/>${lines}${g}${rings}</svg>`;
    await sharp(path.join(OUT, "single.png")).composite([{ input: Buffer.from(svg) }]).png().toFile(path.join(OUT, "export.png"));
  }

  // antique plates, two-row and US-size: green frame, two embossed rings where the stickers would be
  for (const [from, to, W, H, rings] of [
    ["two-euro.png", "oldtimer-two-euro.png", 560, 400, [[477, 63, 41], [477, 149, 41]]],
    ["two.png", "oldtimer-two.png", 560, 400, [[477, 63, 41], [477, 149, 41]]],
    ["us-euro.png", "oldtimer-us-euro.png", 1000, 497, [[842, 96, 52], [842, 238, 52]]],
    ["us.png", "oldtimer-us.png", 1000, 497, [[842, 96, 52], [842, 238, 52]]],
  ]) {
    const { data, info } = await sharp(path.join(OUT, from)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3, neutral = Math.abs(data[i] - data[i + 1]) < 25 && Math.abs(data[i + 1] - data[i + 2]) < 25;
      if (neutral && lum < 120) { data[i] = 30; data[i + 1] = 110; data[i + 2] = 48; }
    }
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${rings.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#d9d9d9" stroke-width="3"/>`).join("")}</svg>`);
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).composite([{ input: svg }]).png().toFile(path.join(OUT, to));
  }
  // foreign citizens: sky-blue plate with yellow lettering (one embossed ring) and a dark-blue one with orange lettering
  for (const [to, face, frame, ring] of [["foreign-turq.png", [45, 168, 224], [245, 196, 0], true], ["foreign-blue.png", [29, 79, 157], [228, 155, 45], false]]) {
    const { data, info } = await sharp(path.join(OUT, "single.png")).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (lum > 200) { data[i] = face[0]; data[i + 1] = face[1]; data[i + 2] = face[2]; }
      else if (lum < 90) { data[i] = frame[0]; data[i + 1] = frame[1]; data[i + 2] = frame[2]; }
    }
    const ringSvg = Buffer.from(ring ? '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="221"><circle cx="494" cy="110" r="30" fill="none" stroke="#f1f1f1" stroke-opacity=".7" stroke-width="3"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="221"/>');
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).composite([{ input: ringSvg }]).png().toFile(path.join(OUT, to));
  }
  // antique / oldtimer plates: green frame and lettering (the plate carries two embossed rings instead of stickers)
  for (const [from, to] of [["single-euro.png", "oldtimer-euro.png"], ["single.png", "oldtimer.png"]]) {
    const { data, info } = await sharp(path.join(OUT, from)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3, neutral = Math.abs(data[i] - data[i + 1]) < 25 && Math.abs(data[i + 1] - data[i + 2]) < 25;
      if (neutral && lum < 120) { data[i] = 30; data[i + 1] = 110; data[i + 2] = 48; }
    }
    const rings = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="221"><circle cx="494" cy="68" r="34" fill="none" stroke="#d9d9d9" stroke-width="3"/><circle cx="494" cy="150" r="34" fill="none" stroke="#d9d9d9" stroke-width="3"/></svg>');
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).composite([{ input: rings }]).png().toFile(path.join(OUT, to));
  }
  console.log("ok");
})();
