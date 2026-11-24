// Extracts the two embossed peony corners from the printed invitation into
// transparent PNGs for the website. Placeholder art until the designer's
// original floral files arrive (PROJECT_BRIEF.md §4).
//
// Steps per corner:
//   1. Paint out the invitation's own double frame lines (the site draws its own frame).
//   2. Colour-to-alpha against the white card, so only the embossed shading remains.
//   3. Mask out nearby lettering with a feathered polygon.
//   4. Upscale 2x with Lanczos so the browser is not doing all of the enlargement.
//
// Usage: npm run art   (reads Invitation/linda-wedding.png)
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "Invitation/linda-wedding.png";
const OUT = "public/art";
const W = 427;
const H = 640;
const PAPER = 254.5; // sampled card white
const SHADOW = [122, 103, 88]; // warm taupe shadow tone
const SHADOW_LUM = (122 + 103 + 88) / 3;
const GAIN = 1.45; // deeper emboss than print, so the relief reads on screens
const CARD = [253, 252, 250]; // --color-paper, the base under the petals
const USE_BASE = false; // the base hid the old card frame; the full-bleed page has no frame, so shadow-only alpha sits on any ground

// Frame lines in source pixels (measured): columns and rows to inpaint.
const LINE_COLS = [[20, 21], [24, 25], [401, 402], [405, 406]];
const LINE_ROWS = [[18, 20], [22, 23], [612, 613], [615, 616]];

// Corner regions, source coordinates. Polygons keep the art, exclude the lettering.
const CORNERS = {
  "floral-top-left": {
    box: { left: 0, top: 0, width: 290, height: 560 },
    poly: [[0, 0], [290, 0], [290, 70], [240, 100], [100, 110], [98, 160], [68, 172], [64, 370], [54, 410], [56, 560], [0, 560]],
  },
  "floral-bottom-right": {
    box: { left: 80, top: 330, width: 347, height: 310 },
    poly: [[374, 330], [427, 330], [427, 640], [80, 640], [80, 562], [312, 550], [340, 505], [372, 480]],
  },
};

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
if (info.width !== W || info.height !== H) throw new Error(`Expected ${W}x${H}, got ${info.width}x${info.height}`);
const C = info.channels;
const px = Float32Array.from(data);
const at = (x, y, c) => px[(y * W + x) * C + c];
const set = (x, y, c, v) => { px[(y * W + x) * C + c] = v; };

// 1. Inpaint frame lines with a 2-D diffusion fill: each line pixel takes the mean of its
//    known 3x3 neighbours, pass by pass from the edges inward, so no straight seam remains.
const hole = new Uint8Array(W * H);
for (const [a, b] of LINE_COLS) for (let y = 0; y < H; y++) for (let x = a; x <= b; x++) hole[y * W + x] = 1;
for (const [a, b] of LINE_ROWS) for (let x = 0; x < W; x++) for (let y = a; y <= b; y++) hole[y * W + x] = 1;
for (let pass = 0; pass < 8; pass++) {
  const filled = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!hole[y * W + x]) continue;
    const sum = [0, 0, 0];
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || hole[ny * W + nx]) continue;
      for (let c = 0; c < 3; c++) sum[c] += at(nx, ny, c);
      n++;
    }
    if (n) filled.push([x, y, sum.map((s) => s / n)]);
  }
  for (const [x, y, v] of filled) { v.forEach((val, c) => set(x, y, c, val)); hole[y * W + x] = 0; }
  if (!filled.length) break;
}

mkdirSync(OUT, { recursive: true });

for (const [name, { box, poly }] of Object.entries(CORNERS)) {
  // 3. Feathered mask from the polygon, in box coordinates.
  const points = poly.map(([x, y]) => `${x - box.left},${y - box.top}`).join(" ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${box.width}" height="${box.height}"><polygon points="${points}" fill="#fff"/></svg>`;
  const mask = await sharp(Buffer.from(svg)).blur(3).extractChannel(0).raw().toBuffer();
  // Wider feather for the solid base, so frame lines fade in under the sprig tips instead of notching.
  const baseMask = await sharp(Buffer.from(svg)).blur(14).extractChannel(0).raw().toBuffer();

  // 2. Shading → warm taupe shadow at varying opacity; plus an opaque card-coloured
  //    base under the flowers so, like the print, they cover the frame lines.
  const n = box.width * box.height;
  const shade = new Float32Array(n);
  const presence = Buffer.alloc(n);
  for (let y = 0; y < box.height; y++) {
    for (let x = 0; x < box.width; x++) {
      const sx = x + box.left, sy = y + box.top;
      const lum = (at(sx, sy, 0) + at(sx, sy, 1) + at(sx, sy, 2)) / 3;
      let a = Math.max(0, (PAPER - lum) / (PAPER - SHADOW_LUM));
      a = a < 0.02 ? 0 : Math.min(1, a * GAIN);
      shade[y * box.width + x] = a;
      presence[y * box.width + x] = a > 0.045 ? 255 : 0;
    }
  }
  const base = await sharp(presence, { raw: { width: box.width, height: box.height, channels: 1 } })
    .blur(3.5) // morphological close: fill petal highlights into one solid silhouette
    .extractChannel(0) // blur returns 3 channels; keep one so the stride matches
    .raw()
    .toBuffer();
  const smooth = (v) => { const t = Math.min(1, Math.max(0, (v - 0.12) / 0.2)); return t * t * (3 - 2 * t); };

  const out = Buffer.alloc(n * 4);
  for (let k = 0; k < n; k++) {
    const m = mask[k] / 255;
    const s = shade[k];
    const b = USE_BASE ? smooth(base[k] / 255) * (baseMask[k] / 255) ** 2 : 0;
    const alpha = Math.max(s, b) * m;
    const t = alpha > 0 ? Math.min(1, (s * m) / alpha) : 0; // shadow share of this pixel
    const i = k * 4;
    for (let c = 0; c < 3; c++) out[i + c] = Math.round(CARD[c] + (SHADOW[c] - CARD[c]) * t);
    out[i + 3] = Math.round(alpha * 255);
  }

  // 4. Upscale 2x and write.
  await sharp(out, { raw: { width: box.width, height: box.height, channels: 4 } })
    .resize(box.width * 2, box.height * 2, { kernel: "lanczos3" })
    .sharpen({ sigma: 0.9, m1: 0.6, m2: 2.2 }) // crisp the petal edges after enlarging
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/${name}.png`);
  console.log(`wrote ${OUT}/${name}.png (${box.width * 2}x${box.height * 2})`);
}
