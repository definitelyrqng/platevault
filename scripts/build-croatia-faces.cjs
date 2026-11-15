#!/usr/bin/env node
/**
 * Clean Croatian plate faces without the euroband: crisp rim, face colour and stripes drawn as vectors,
 * the coat of arms (cut out of the supplied plate) placed where each plate type has it.
 * Run after build-croatia-art.cjs.
 *
 *   node scripts/build-croatia-faces.cjs → standard-single-noband, military-single, export-single, police-single
 */
const sharp = require("sharp");
const path = require("path");
const DIR = path.join(__dirname, "../public/plates/croatia");
const W = 1659, H = 393;

async function arms() {
  // cut the coat of arms out of the plate with the euroband; make only the white outside it transparent
  const raw = await sharp(path.join(DIR, "standard-single.png")).extract({ left: 516, top: 76, width: 190, height: 250 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = raw, w = info.width, h = info.height;
  const seen = new Uint8Array(w * h), st = [];
  const bg = (x, y) => { const i = (y * w + x) * 4; return data[i] > 225 && data[i + 1] > 225 && data[i + 2] > 225; };
  const push = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; if (seen[k] || !bg(x, y)) return; seen[k] = 1; st.push(k); };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (st.length) { const k = st.pop(), x = k % w, y = (k / w) | 0; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
  for (let k = 0; k < w * h; k++) if (seen[k]) data[k * 4 + 3] = 0;
  return { input: await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer(), w, h };
}

function faceSvg(color) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c4c4c8"/><stop offset="1" stop-color="#8d8d94"/></linearGradient></defs>
    <rect x="30" y="26" width="${W - 60}" height="${H - 52}" rx="40" fill="url(#r)"/>
    <rect x="36" y="32" width="${W - 72}" height="${H - 64}" rx="35" fill="${color}"/>
    <rect x="52" y="46" width="${W - 104}" height="5" fill="#c8202f"/><rect x="52" y="60" width="${W - 104}" height="5" fill="#233c8f"/>
    <rect x="52" y="${H - 66}" width="${W - 104}" height="5" fill="#c8202f"/><rect x="52" y="${H - 52}" width="${W - 104}" height="5" fill="#233c8f"/>
  </svg>`);
}

(async () => {
  const a = await arms();
  await sharp(a.input).toFile(path.join(DIR, "arms.png"));
  const place = (cx) => [{ input: a.input, left: Math.round(cx - a.w / 2), top: 76 }];
  await sharp(faceSvg("#ffffff")).composite(place(608)).png().toFile(path.join(DIR, "standard-single-noband.png"));
  await sharp(faceSvg("#f7d928")).composite(place(608)).png().toFile(path.join(DIR, "military-single.png"));
  await sharp(faceSvg("#5cbe96")).composite(place(608)).png().toFile(path.join(DIR, "export-single.png"));
  await sharp(faceSvg("#ffffff")).composite(place(W / 2)).png().toFile(path.join(DIR, "police-single.png"));
  console.log("ok");
})();
