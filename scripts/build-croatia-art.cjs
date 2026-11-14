#!/usr/bin/env node
/**
 * Croatian plate artwork, drawn as vector shapes (the supplied photo is too small to reuse):
 *   public/plates/croatia/standard-single.png  white plate, silver rim, red/blue stripes, euroband
 *   public/plates/croatia/seal.png             coat of arms (checkered shield and crown), placed between region and digits
 *
 *   node scripts/build-croatia-art.cjs
 */
const sharp = require("sharp");
const path = require("path");
const OUT = path.join(__dirname, "../public/plates/croatia");

const star = (cx, cy, R) => {
  const pts = Array.from({ length: 10 }, (_, k) => { const r = k % 2 ? R * 0.4 : R, t = (k / 10) * Math.PI * 2 - Math.PI / 2; return `${(cx + r * Math.cos(t)).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`; }).join(" ");
  return `<polygon points="${pts}" fill="#ffd400"/>`;
};

function plateSvg() {
  const W = 1106, H = 262;
  const stars = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; return star(87 + 41 * Math.cos(a), 92 + 41 * Math.sin(a), 8.5); }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f1f1f1"/></linearGradient>
      <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8b8bc"/><stop offset="1" stop-color="#7d7d82"/></linearGradient>
      <clipPath id="inner"><rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="20"/></clipPath>
    </defs>
    <rect width="${W}" height="${H}" rx="24" fill="url(#rim)"/>
    <rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="20" fill="url(#face)"/>
    <g clip-path="url(#inner)">
      <rect x="150" y="30" width="${W}" height="4" fill="#c8202f"/><rect x="150" y="38" width="${W}" height="4" fill="#233c8f"/>
      <rect x="150" y="${H - 42}" width="${W}" height="4" fill="#c8202f"/><rect x="150" y="${H - 34}" width="${W}" height="4" fill="#233c8f"/>
      <rect x="4" y="4" width="142" height="${H - 8}" fill="#0a3d9c"/>
      ${stars}
      <!-- HR -->
      <path d="M44 168 h10 v18 h14 v-18 h10 v52 h-10 v-24 h-14 v24 h-10 Z" fill="#fff"/>
      <path fill-rule="evenodd" d="M92 168 h20 a15 15 0 0 1 4 29 l13 23 h-11 l-12 -22 h-4 v22 h-10 Z M102 177 v12 h10 a6 6 0 0 0 0 -12 Z" fill="#fff"/>
    </g>
  </svg>`;
}

function sealSvg() {
  // 200 × 250: crown of five small shields above a 5 × 5 checkered shield (red first)
  let cells = "";
  const cw = 34, ch = 36, x0 = 15, y0 = 70;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) cells += `<rect x="${x0 + c * cw}" y="${y0 + r * ch}" width="${cw + 0.5}" height="${ch + 0.5}" fill="${(r + c) % 2 === 0 ? "#e3192f" : "#ffffff"}"/>`;
  const crest = (x, fill, up = 0) => `<path d="M${x} ${18 - up} h28 v22 l-14 14 l-14 -14 Z" fill="${fill}" stroke="#222" stroke-width="2"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="250">
    <defs><clipPath id="shield"><path d="M15 70 H185 V178 Q185 238 100 248 Q15 238 15 178 Z"/></clipPath></defs>
    ${crest(18, "#1f56b5")}${crest(52, "#f2c400")}${crest(86, "#1f56b5", 8)}${crest(120, "#2e8b3a")}${crest(154, "#1f56b5")}
    <rect x="15" y="52" width="170" height="18" fill="#ffd400" stroke="#222" stroke-width="2.5"/>
    <g clip-path="url(#shield)">${cells}</g>
    <path d="M15 70 H185 V178 Q185 238 100 248 Q15 238 15 178 Z" fill="none" stroke="#222" stroke-width="4"/>
  </svg>`;
}

(async () => {
  await sharp(Buffer.from(plateSvg())).png().toFile(path.join(OUT, "standard-single.png"));
  await sharp(Buffer.from(sealSvg())).png().toFile(path.join(OUT, "seal.png"));
  console.log("ok");
})();
