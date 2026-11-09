#!/usr/bin/env node
/**
 * Cuts the Austrian coats of arms out of assets/austria-seals/*.png (screenshots on a light-grey
 * panel, some with a caption underneath) into transparent PNGs in public/plates/austria/seals.
 *   node scripts/prep-austria-seals.cjs
 */
const fs = require("fs"), path = require("path"), sharp = require("sharp");
const SRC = path.join(__dirname, "../assets/austria-seals"), OUT = path.join(__dirname, "../public/plates/austria/seals");

(async () => {
  for (const f of fs.readdirSync(SRC).filter((n) => n.endsWith(".png"))) {
    const { data, info } = await sharp(path.join(SRC, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = info;
    const bg = (x, y) => { const i = (y * w + x) * 4; return data[i + 3] < 20 || (Math.abs(data[i] - 245) < 7 && Math.abs(data[i + 1] - 245) < 7 && Math.abs(data[i + 2] - 245) < 7); };
    // flood the background in from the edges
    const clear = new Uint8Array(w * h), stack = [];
    for (let x = 0; x < w; x++) stack.push([x, 0], [x, h - 1]);
    for (let y = 0; y < h; y++) stack.push([0, y], [w - 1, y]);
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= w || y >= h || clear[y * w + x] || !bg(x, y)) continue;
      clear[y * w + x] = 1; stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    // drop a caption band (separate ink band in the bottom 30%)
    const rowInk = Array.from({ length: h }, (_, y) => { for (let x = 0; x < w; x++) if (!clear[y * w + x]) return true; return false; });
    const bands = []; let s = -1;
    for (let y = 0; y <= h; y++) { if (y < h && rowInk[y] && s < 0) s = y; if ((y === h || !rowInk[y]) && s >= 0) { bands.push([s, y - 1]); s = -1; } }
    const keep = bands.length > 1 && bands[bands.length - 1][0] > h * 0.7 ? bands.slice(0, -1) : bands;
    const y0 = keep[0][0], y1 = keep[keep.length - 1][1];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (y < y0 || y > y1) clear[y * w + x] = 1;
    let x0 = w, x1 = 0;
    for (let y = y0; y <= y1; y++) for (let x = 0; x < w; x++) if (!clear[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
    const out = Buffer.from(data);
    for (let i = 0; i < w * h; i++) if (clear[i]) out[i * 4 + 3] = 0;
    await sharp(out, { raw: { width: w, height: h, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
      .png({ compressionLevel: 9 }).toFile(path.join(OUT, f));
    console.log(f, `${x1 - x0 + 1}x${y1 - y0 + 1}`);
  }
})();
