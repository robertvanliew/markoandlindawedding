// Keeps the flower photos exactly as generated (real white peonies, golden centres) and removes the
// green: leaves and stems become transparent, so only the blooms and buds remain.
// A pixel counts as foliage when green clearly dominates; the cut is softened by a pixel so bloom
// edges stay clean.
//
// Reads public/art/<name>-colour.png (the untouched originals) and writes public/art/<name>.png.
// Usage: node scripts/remove-leaves.mjs
import sharp from "sharp";

const NAMES = ["peony-top-left", "peony-bottom-right", "garland-bottom"];

for (const name of NAMES) {
  const src = `public/art/${name}-colour.png`;
  const out = `public/art/${name}.png`;
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const leaf = Buffer.alloc(W * H);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // foliage by hue: petals are warm cream (red >= green), every leaf and stem leans green, even
    // the dull sage ones. Also any darker, greyish pixel that is not warm (leaf shadow, stem).
    const max = Math.max(r, g, b), min = Math.min(r, g, b), chroma = max - min;
    let hue = 0;
    if (chroma > 0) {
      if (max === r) hue = 60 * (((g - b) / chroma) % 6);
      else if (max === g) hue = 60 * ((b - r) / chroma + 2);
      else hue = 60 * ((r - g) / chroma + 4);
      if (hue < 0) hue += 360;
    }
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    // olive leaves sit near yellow (hue 53-62) but are much darker than the golden stamens
    const greenish = chroma > 6 && ((hue >= 62 && hue <= 200) || (hue >= 52 && lum < 185));
    const coolDark = lum < 175 && r <= g + 2 && chroma < 40;
    leaf[p] = greenish || coolDark ? 255 : 0;
  }
  // grow the mask a pixel and soften it, so thin stems and leaf rims go too
  const soft = await sharp(leaf, { raw: { width: W, height: H, channels: 1 } })
    .dilate(2)
    .blur(1.2)
    .extractChannel(0)
    .raw()
    .toBuffer();
  // Leaf rims: the pale outline left where a leaf was. Within a few pixels of removed foliage, clear
  // anything that is not bright petal or berry white.
  const near = await sharp(leaf, { raw: { width: W, height: H, channels: 1 } })
    .dilate(7)
    .extractChannel(0)
    .raw()
    .toBuffer();
  for (let p = 0; p < W * H; p++) {
    let a = data[p * 4 + 3] * (1 - soft[p] / 255);
    if (near[p]) {
      const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 226) a *= Math.min(1, Math.max(0, (lum - 214) / 12));
    }
    data[p * 4 + 3] = Math.round(a);
  }
  // Opening (erode, then dilate) on the alpha: hairline leaf outlines and stray specks vanish, while
  // petals, buds and berries are solid shapes and come back whole. Take the minimum so nothing grows.
  const alpha = Buffer.alloc(W * H);
  for (let p = 0; p < W * H; p++) alpha[p] = data[p * 4 + 3] > 40 ? 255 : 0;
  const opened = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } })
    .erode(3)
    .dilate(4)
    .blur(1)
    .extractChannel(0)
    .raw()
    .toBuffer();
  for (let p = 0; p < W * H; p++) data[p * 4 + 3] = Math.min(data[p * 4 + 3], opened[p]);

  // Sweep away crumbs: small isolated fragments left where fine sprigs broke apart.
  const MIN_AREA = Math.round(2600 * (W / 1000) ** 2);
  const solid = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) solid[p] = data[p * 4 + 3] > 40 ? 1 : 0;
  const seen = new Uint8Array(W * H);
  for (let start = 0; start < W * H; start++) {
    if (!solid[start] || seen[start]) continue;
    const comp = [start];
    seen[start] = 1;
    for (let k = 0; k < comp.length; k++) {
      const p = comp[k], x = p % W, y = (p / W) | 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const q = ny * W + nx;
          if (solid[q] && !seen[q]) { seen[q] = 1; comp.push(q); }
        }
    }
    if (comp.length < MIN_AREA) for (const p of comp) data[p * 4 + 3] = 0;
  }
  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 }).toFile(out);
  console.log(out);
}
