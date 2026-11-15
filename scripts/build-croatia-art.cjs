#!/usr/bin/env node
/**
 * Croatian plate artwork from the supplied plate photo (assets/croatia/source-plate.png, 553 × 131):
 * the lettering is painted out, the coat of arms stays (it always sits between the 2-letter region
 * and the digits), the outside corners become transparent, and the image is enlarged 3× (smooth).
 *
 *   node scripts/build-croatia-art.cjs   →  public/plates/croatia/standard-single.png
 */
const sharp = require("sharp");
const path = require("path");
const ROOT = path.join(__dirname, "..");

(async () => {
  const { data, info } = await sharp(path.join(ROOT, "assets/croatia/source-plate.png")).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const white = (x, y) => { const i = (y * W + x) * 3; data[i] = data[i + 1] = data[i + 2] = 255; };

  // 1) lettering out (dark pixels, grown 2px for the anti-aliased edge); the coat of arms box stays
  const X0 = 72, X1 = 542, Y0 = 26, Y1 = 107, AX0 = 172, AX1 = 233;
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) if (x < AX0 || x > AX1) white(x, y);      // the writable area is plain white apart from the lettering

  // 2) enlarge 3× and make everything outside the rounded rim transparent
  const big = await sharp(data, { raw: { width: W, height: H, channels: 3 } }).resize(W * 3, H * 3, { kernel: "lanczos3" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const BW = big.info.width, BH = big.info.height, d = big.data;
  const seen = new Uint8Array(BW * BH), st = [];
  const isBg = (x, y) => { const i = (y * BW + x) * 4; return d[i] > 244 && d[i + 1] > 244 && d[i + 2] > 244; };
  const push = (x, y) => { if (x < 0 || y < 0 || x >= BW || y >= BH) return; const k = y * BW + x; if (seen[k] || !isBg(x, y)) return; seen[k] = 1; st.push(k); };
  for (let x = 0; x < BW; x++) { push(x, 0); push(x, BH - 1); }
  for (let y = 0; y < BH; y++) { push(0, y); push(BW - 1, y); }
  while (st.length) { const k = st.pop(), x = k % BW, y = (k / BW) | 0; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
  for (let k = 0; k < BW * BH; k++) if (seen[k]) d[k * 4 + 3] = 0;
  await sharp(d, { raw: { width: BW, height: BH, channels: 4 } }).png().toFile(path.join(ROOT, "public/plates/croatia/standard-single.png"));

  // 3) the same plate without the euroband: the band area gets a copy of the plain face next to it (stripes continue to the rim)
  const nb = Buffer.from(d);
  const BX0 = 49, BX1 = 197, SX = 215, Y_FROM = 40, Y_TO = 352;
  for (let y = Y_FROM; y <= Y_TO; y++) for (let x = BX0; x <= BX1; x++) {
    const from = (y * BW + (SX + (x - BX0))) * 4, to = (y * BW + x) * 4;
    nb[to] = nb[from]; nb[to + 1] = nb[from + 1]; nb[to + 2] = nb[from + 2]; nb[to + 3] = 255;
  }
  await sharp(nb, { raw: { width: BW, height: BH, channels: 4 } }).png().toFile(path.join(ROOT, "public/plates/croatia/standard-single-noband.png"));
  console.log("ok", BW, BH);
})();
