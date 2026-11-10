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

function plate(W, H, B, bandBox, holes, emblem) {
  const r = Math.round(H * 0.07);                       // plate corner radius
  const ib = Math.round(H * 0.05), lw = Math.max(3, H * 0.022), rr = r * 0.6; // red line: inset, weight, radius
  const defs = `<defs>
    <clipPath id="plate"><rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="${r - 2}"/></clipPath>
    <linearGradient id="blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1263c0"/><stop offset="1" stop-color="#0a4fa4"/></linearGradient>
    <linearGradient id="bandShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>
    <radialGradient id="gold" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffe94a"/><stop offset="1" stop-color="#f2c500"/></radialGradient>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfbf9"/><stop offset="1" stop-color="#e8e8e5"/></linearGradient>
    <linearGradient id="red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d3202a"/><stop offset="1" stop-color="#a80f19"/></linearGradient>
    <radialGradient id="hole" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#9a9a98"/><stop offset="1" stop-color="#4a4a48"/></radialGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .06 0"/></filter>
  </defs>`;
  const hr = H * 0.028;
  const holesSvg = holes.map(([hx, hy]) => `<circle cx="${hx}" cy="${hy}" r="${hr + 2}" fill="#fff" fill-opacity=".7"/><circle cx="${hx}" cy="${hy}" r="${hr}" fill="url(#hole)"/><circle cx="${hx}" cy="${hy}" r="${hr}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1.5"/>`).join("");
  const [bx, by, bw, bh] = bandBox();
  const em = emblem ? `<g transform="translate(${emblem[0]} ${emblem[1]})" fill="none" stroke="#c4202b" stroke-width="${H * 0.012}"><ellipse rx="${H * 0.055}" ry="${H * 0.065}"/><path d="M${-H * 0.03} ${-H * 0.03} L0 ${H * 0.035} L${H * 0.03} ${-H * 0.03}" stroke-linejoin="round" stroke-linecap="round"/></g>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs}
    <rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="${r}" fill="#9d9d9a"/>
    <rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="${r - 1}" fill="url(#paper)"/>
    <rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="${r - 1}" filter="url(#grain)"/>
    <rect x="${ib + 1}" y="${ib + 1.5}" width="${W - 2 * ib}" height="${H - 2 * ib}" rx="${rr}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="${lw}"/>
    <rect x="${ib}" y="${ib}" width="${W - 2 * ib}" height="${H - 2 * ib}" rx="${rr}" fill="none" stroke="url(#red)" stroke-width="${lw}"/>
    ${band(bx, by, bw, bh, B)}
    ${em}
    ${holesSvg}
  </svg>`;
}

(async () => {
  const B = await traceB();
  // single row 1040×220: band full height at the left, emblem beside it
  await sharp(Buffer.from(plate(1040, 220, B, () => [3, 3, 96, 214], [[128, 207], [1000, 207]], [150, 62]))).png().toFile(path.join(OUT, "regular-single.png"));
  // two row 1024×512 (proportions of the supplied 512×256): band at the lower left
  await sharp(Buffer.from(plate(1024, 512, B, () => [3, 256, 140, 253], [[190, 484], [984, 480], [40, 32], [984, 32]], [360, 100]))).png().toFile(path.join(OUT, "regular-two.png"));
  console.log("ok");
})();
