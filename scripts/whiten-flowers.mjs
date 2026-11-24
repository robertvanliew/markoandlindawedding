// Makes the flower art all-white while keeping it photographic. The white petals are left exactly as
// photographed. Only coloured pixels (green leaves and stems, yellow stamens) are recoloured: their
// colour is removed and they are lifted to a pale silvery-ivory, like dusty-miller foliage, keeping
// every vein, fold and shadow. Strength follows how coloured a pixel is, so edges blend naturally.
//
// Reads public/art/<name>-colour.png (the untouched originals) and writes public/art/<name>.png.
// Usage: node scripts/whiten-flowers.mjs
import sharp from "sharp";
import { existsSync, copyFileSync } from "node:fs";

const NAMES = ["peony-top-left", "peony-bottom-right", "garland-bottom"];
const LIFT = 0.4; // how far coloured parts are lifted toward white (0 = keep tone, 1 = pure white)
const TINT = [252, 249, 243]; // the warm white they lift toward

const DEPTH = 1.35; // deepens the natural shading (folds, petal edges) so white reads against ivory

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

for (const name of NAMES) {
  const src = `public/art/${name}-colour.png`;
  const out = `public/art/${name}.png`;
  if (!existsSync(src)) copyFileSync(out, src);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const w = smooth(12, 45, chroma); // 0 on white petals, 1 on leaves and stamens
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    for (let c = 0; c < 3; c++) {
      const white = lum + (TINT[c] - lum) * LIFT; // same light and shadow, colour gone, lifted
      const v = [r, g, b][c] * (1 - w) + white * w;
      data[i + c] = Math.max(0, Math.round(255 - (255 - v) * DEPTH));
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png({ compressionLevel: 9 }).toFile(out);
  console.log(out);
}
