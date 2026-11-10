#!/usr/bin/env node
/**
 * Builds the Belgian plate backgrounds (single row and two rows) as vector artwork:
 * red embossed border, textured white plate, euroband with 12 stars and a "B" traced from
 * assets/belgium-two-row-source.png (the supplied two-row plate).
 *
 *   node scripts/build-belgium-art.cjs
 */
const sharp = require("sharp");
const { Potrace } = require("potrace");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "assets/belgium-two-row-source.png");
const OUT = path.join(ROOT, "public/plates/belgium");

async function traceB() {
  const crop = await sharp(SRC).extract({ left: 24, top: 196, width: 40, height: 42 }).resize({ width: 800, kernel: "lanczos3" })
    .removeAlpha().grayscale().blur(2).threshold(170).negate().png().toBuffer();
  const d = await new Promise((res, rej) => { const p = new Potrace({ threshold: 128, turdSize: 40, optTolerance: 0.6, alphaMax: 1 }); p.loadImage(crop, (e) => e ? rej(e) : res(p.getPathTag().match(/ d="([^"]+)"/)[1])); });
  const { data, info } = await sharp(crop).raw().toBuffer({ resolveWithObject: true });
  let x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * info.channels] < 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { d, x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

const star = (cx, cy, R) => {
  const pts = Array.from({ length: 10 }, (_, k) => { const r = k % 2 ? R * 0.38 : R, t = (k / 10) * Math.PI * 2 - Math.PI / 2; return `${(cx + r * Math.cos(t)).toFixed(2)},${(cy + r * Math.sin(t)).toFixed(2)}`; }).join(" ");
  return `<polygon points="${pts}" fill="url(#gold)"/>`;
};

/** Euroband x,y,w,h (outer corner radius handled by the clip). */
function band(x, y, w, h, B) {
  const cx = x + w / 2, ringR = w * 0.33, ringY = y + h * 0.37, R = w * 0.088;
  const stars = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; return star(cx + ringR * Math.cos(a), ringY + ringR * Math.sin(a), R); }).join("");
  const bh = h * 0.30, s = bh / B.h, bw = B.w * s * 0.86;
  return `<g clip-path="url(#plate)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#blue)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#bandShade)"/>
    ${stars}
    <g transform="translate(${cx - bw / 2} ${y + h * 0.60}) scale(${s * 0.86} ${s}) translate(${-B.x0} ${-B.y0})" fill="#fff"><path d="${B.d}" fill-rule="evenodd"/></g>
    <rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>
    <line x1="${x + w}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="#000" stroke-opacity=".28" stroke-width="2"/>
  </g>`;
}

function plate(W, H, B, bandBox, holes) {
  const bd = Math.round(H * (W > 800 ? 0.055 : 0.032)), rx = Math.round(H * (W > 800 ? 0.13 : 0.085));
  const defs = `<defs>
    <clipPath id="plate"><rect x="${bd}" y="${bd}" width="${W - 2 * bd}" height="${H - 2 * bd}" rx="${rx * 0.7}"/></clipPath>
    <linearGradient id="blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a5fb8"/><stop offset="1" stop-color="#004a9c"/></linearGradient>
    <linearGradient id="bandShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
    <radialGradient id="gold" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffe94a"/><stop offset="1" stop-color="#f2c500"/></radialGradient>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdfdfb"/><stop offset="1" stop-color="#ececea"/></linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e01616"/><stop offset=".5" stop-color="#c10000"/><stop offset="1" stop-color="#8f0000"/></linearGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0"/></filter>
  </defs>`;
  const holesSvg = holes.map(([hx, hy]) => `<circle cx="${hx}" cy="${hy}" r="${H * 0.03}" fill="#d8d8d6"/><circle cx="${hx}" cy="${hy}" r="${H * 0.03}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1.5"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs}
    <rect width="${W}" height="${H}" rx="${rx}" fill="url(#rim)"/>
    <rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="${rx}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1.5"/>
    <rect x="${bd}" y="${bd}" width="${W - 2 * bd}" height="${H - 2 * bd}" rx="${rx * 0.7}" fill="url(#paper)"/>
    <rect x="${bd}" y="${bd}" width="${W - 2 * bd}" height="${H - 2 * bd}" rx="${rx * 0.7}" filter="url(#grain)"/>
    <rect x="${bd + 1}" y="${bd + 1}" width="${W - 2 * bd - 2}" height="${H - 2 * bd - 2}" rx="${rx * 0.7}" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="2"/>
    ${band(bandBox(bd)[0], bandBox(bd)[1], bandBox(bd)[2], bandBox(bd)[3], B)}
    ${holesSvg}
  </svg>`;
}

(async () => {
  const B = await traceB();
  // single row 1040×220: band full height
  await sharp(Buffer.from(plate(1040, 220, B, (bd) => [bd, bd, 112, 220 - 2 * bd], []))).png().toFile(path.join(OUT, "regular-single.png"));
  // two row 1024×512 (same proportions as the supplied 512×256): band on the lower left
  await sharp(Buffer.from(plate(1024, 512, B, (bd) => [bd, 256, 136, 512 - bd - 256], [[40, 36], [984, 36], [984, 478]]))).png().toFile(path.join(OUT, "regular-two.png"));
  console.log("ok");
})();
