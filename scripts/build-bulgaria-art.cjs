#!/usr/bin/env node
/**
 * Bulgarian plate backgrounds, from the supplied plates:
 *   standard-single.png   assets/bulgaria-source.png          (white, euroband with stars)
 *   military-single.png   assets/bulgaria-military-source.png (flag instead of stars)
 *   temporary-single.png  standard + a red end block with a dash and room for the year
 * The lettering and the screws are removed, the outside corners made transparent.
 *
 *   node scripts/build-bulgaria-art.cjs
 */
const sharp = require("sharp");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public/plates/bulgaria");

async function clean(src) {
  const { data, info } = await sharp(path.join(ROOT, src)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  for (let y = 15; y <= H - 19; y++) for (let x = 102; x <= 978; x++) { const i = (y * W + x) * 4; data[i] = data[i + 1] = data[i + 2] = 255; data[i + 3] = 255; }
  const seen = new Uint8Array(W * H), stack = [];
  const isBg = (x, y) => { const i = (y * W + x) * 4; return data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235; };
  const push = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const k = y * W + x; if (seen[k] || !isBg(x, y)) return; seen[k] = 1; stack.push(k); };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) { const k = stack.pop(), x = k % W, y = (k / W) | 0; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
  for (let k = 0; k < W * H; k++) if (seen[k]) data[k * 4 + 3] = 0;
  return { data, W, H };
}
const save = (data, W, H, name) => sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(OUT, name));

(async () => {
  const std = await clean("assets/bulgaria-source.png");
  await save(std.data, std.W, std.H, "standard-single.png");
  const mil = await clean("assets/bulgaria-military-source.png");
  await save(mil.data, mil.W, mil.H, "military-single.png");

  // temporary: red end block (x 838–976) with a thin dash above the year
  const base = await sharp(std.data, { raw: { width: std.W, height: std.H, channels: 4 } }).png().toBuffer();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${std.W}" height="${std.H}">
    <rect x="838" y="15" width="140" height="${std.H - 34}" fill="#ee2a2a"/>
    <rect x="862" y="${Math.round(std.H * 0.47)}" width="90" height="6" fill="#1b1816"/></svg>`;
  await sharp(base).composite([{ input: Buffer.from(svg) }]).png().toFile(path.join(OUT, "temporary-single.png"));

  // diplomatic: the whole writable area is red, with a white dash above the year
  const rsvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${std.W}" height="${std.H}">
    <rect x="102" y="15" width="877" height="${std.H - 34}" fill="#d62d2b"/>
    <rect x="862" y="${Math.round(std.H * 0.47)}" width="90" height="6" fill="#f6f6f6"/></svg>`;
  await sharp(base).composite([{ input: Buffer.from(rsvg) }]).png().toFile(path.join(OUT, "diplomatic-single.png"));

  // foreign citizens: blue plate, same layout (expiry year under the dash)
  const bsvg = rsvg.replace("#d62d2b", "#1a76d8");
  await sharp(base).composite([{ input: Buffer.from(bsvg) }]).png().toFile(path.join(OUT, "foreign-single.png"));
  console.log("ok");
})();
