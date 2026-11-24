// Cuts the photo-real peony sprays (generated in Higgsfield on a flat grey studio ground) out to
// transparent PNGs for the page corners.
//
// Colour-to-alpha against the sampled grey: the ground goes fully transparent, the soft contact
// shadows under the petals stay as partly transparent shadow, and the petal edges keep no grey fringe.
//
// Usage: node scripts/cutout-peonies.mjs <in.png> <out.png> [--width <px>] [--edge top-left|bottom-right|top|bottom] [--trim]
import sharp from "sharp";

const [input, output, ...rest] = process.argv.slice(2);
const width = rest[0] === "--width" ? Number(rest[1]) : undefined;
const NO_SHADOW = !rest.includes("--keep-shadow");
const TRIM = rest.includes("--trim");
const edgeArg = rest.indexOf("--edge");
const EDGE = edgeArg >= 0 ? rest[edgeArg + 1] : output.includes("top-left") ? "top-left" : "bottom-right";
if (!input || !output) throw new Error("usage: cutout-peonies.mjs <in.png> <out.png> [--width px]");

const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const px = (x, y, c) => data[(y * W + x) * 3 + c];

// Sample the ground from the corner the flowers do not reach (the frame's emptiest region),
// using the median of a patch so noise does not skew it.
const patch = [];
const empty = {
  "top-left": [W * 0.7, H * 0.75],
  "bottom-right": [W * 0.25, H * 0.25],
  top: [W * 0.5, H * 0.85],
  bottom: [W * 0.5, H * 0.15],
}[EDGE].map(Math.round);
for (let y = empty[1] - 20; y < empty[1] + 20; y++)
  for (let x = empty[0] - 20; x < empty[0] + 20; x++) patch.push([px(x, y, 0), px(x, y, 1), px(x, y, 2)]);
const med = (i) => patch.map((p) => p[i]).sort((a, b) => a - b)[patch.length >> 1];
const BG = [med(0), med(1), med(2)];

// The ground drifts slightly across the frame (soft vignette), so take a smooth per-pixel ground
// estimate: a heavy blur of the image with flowers masked out is overkill here; the drift is under
// a few levels, absorbed by the noise floor below.
const NOISE = 7; // levels of ground variation treated as pure ground
const out = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  const p = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
  // per-channel alpha needed to explain p as colour-over-ground (GIMP colour-to-alpha)
  let a = 0;
  for (let c = 0; c < 3; c++) {
    const d = p[c] - BG[c];
    const ac = d > 0 ? d / (255 - BG[c]) : d < 0 ? -d / BG[c] : 0;
    a = Math.max(a, ac);
  }
  const dist = Math.max(...p.map((v, c) => Math.abs(v - BG[c])));
  if (dist <= NOISE) a = 0;
  else a = Math.min(1, a * Math.min(1, (dist - NOISE) / 6));
  // No cast shadows: removed below, only where the shadow connects to the open ground.
  for (let c = 0; c < 3; c++) {
    const col = a > 0 ? (p[c] - (1 - a) * BG[c]) / a : 0;
    out[i * 4 + c] = Math.max(0, Math.min(255, Math.round(col)));
  }
  out[i * 4 + 3] = Math.round(a * 255);
}

// Cast shadow = colourless pixels no lighter than the ground that are connected to the open
// ground at the frame's edges. Flood-fill from the edges through such pixels and clear them;
// shading enclosed by petals is never reached, so the flowers keep their form.
if (NO_SHADOW) {
  const bgLum = (BG[0] + BG[1] + BG[2]) / 3;
  const shadowish = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    const lum = (r + g + b) / 3;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    shadowish[i] = lum < bgLum + 10 && chroma < 14 ? 1 : 0;
  }
  const reached = new Uint8Array(W * H);
  const stack = [];
  const seed = (x, y) => {
    const i = y * W + x;
    if (shadowish[i] && !reached[i]) {
      reached[i] = 1;
      stack.push(i);
    }
  };
  // Seed only from the edges the flowers do not touch: the sprays are cropped by their own corner's
  // two edges, and flooding in from there would eat petal shading.
  if (EDGE === "top-left") {
    for (let x = 0; x < W; x++) seed(x, H - 1);
    for (let y = 0; y < H; y++) seed(W - 1, y);
    // the flower-side edges carry only thin sprigs away from the main bloom
    for (let y = Math.round(H * 0.32); y < H; y++) seed(0, y);
    for (let x = Math.round(W * 0.42); x < W; x++) seed(x, 0);
  } else if (EDGE === "bottom-right") {
    for (let x = 0; x < W; x++) seed(x, 0);
    for (let y = 0; y < H; y++) seed(0, y);
    for (let y = 0; y < Math.round(H * 0.62); y++) seed(W - 1, y);
    for (let x = 0; x < Math.round(W * 0.45); x++) seed(x, H - 1);
  } else if (EDGE === "top") {
    // garland hangs from the top edge: open ground below and down the lower sides
    for (let x = 0; x < W; x++) seed(x, H - 1);
    for (let y = Math.round(H * 0.6); y < H; y++) { seed(0, y); seed(W - 1, y); }
  } else {
    // garland lies along the bottom edge: open ground above and up the upper sides
    for (let x = 0; x < W; x++) seed(x, 0);
    for (let y = 0; y < Math.round(H * 0.4); y++) { seed(0, y); seed(W - 1, y); }
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % W, y = (i / W) | 0;
    if (x > 0) seed(x - 1, y);
    if (x < W - 1) seed(x + 1, y);
    if (y > 0) seed(x, y - 1);
    if (y < H - 1) seed(x, y + 1);
  }
  // Enclosed pockets of studio ground (between leaves and blooms) never touch the frame edge.
  // Any sizeable connected patch of flat, colourless, ground-level grey is ground, not petal.
  const pocket = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    if (reached[i]) continue;
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    const lum = (r + g + b) / 3;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    pocket[i] = chroma < 8 && Math.abs(lum - bgLum) < 9 ? 1 : 0;
  }
  const seen = new Uint8Array(W * H);
  for (let start = 0; start < W * H; start++) {
    if (!pocket[start] || seen[start]) continue;
    const comp = [start];
    seen[start] = 1;
    for (let k = 0; k < comp.length; k++) {
      const i = comp[k];
      const x = i % W, y = (i / W) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
        if (j >= 0 && pocket[j] && !seen[j]) {
          seen[j] = 1;
          comp.push(j);
        }
      }
    }
    if (comp.length > 600) for (const i of comp) reached[i] = 1;
  }

  // soften the boundary by a pixel so petal edges do not get a hard step
  const soft = await sharp(Buffer.from(reached.map((v) => v * 255)), { raw: { width: W, height: H, channels: 1 } })
    .blur(1.2)
    .extractChannel(0)
    .raw()
    .toBuffer();
  for (let i = 0; i < W * H; i++) {
    const s = soft[i] / 255;
    if (s === 0) {
      // inside the flowers: fully opaque, original colour (petal shading can sit at ground grey)
      out[i * 4] = data[i * 3];
      out[i * 4 + 1] = data[i * 3 + 1];
      out[i * 4 + 2] = data[i * 3 + 2];
      out[i * 4 + 3] = 255;
    } else {
      // the boundary and the open ground: keep the de-greyed colour, fade toward the ground
      out[i * 4 + 3] = Math.round(out[i * 4 + 3] * (1 - s));
    }
  }
}

let img = sharp(out, { raw: { width: W, height: H, channels: 4 } });
if (TRIM) {
  // crop away the empty ground so the asset is only the flowers (keeps the cropped flower edges)
  let top = H, bottom = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x += 2)
      if (out[(y * W + x) * 4 + 3] > 8) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        break;
      }
  const pad = 4;
  const t = Math.max(0, top - pad), b = Math.min(H - 1, bottom + pad);
  img = sharp(await img.png().toBuffer()).extract({ left: 0, top: t, width: W, height: b - t + 1 });
}
if (width) img = img.resize(width, null, { kernel: "lanczos3" });
await img.png({ compressionLevel: 9 }).toFile(output);
const m = await sharp(output).metadata();
console.log(`ground rgb(${BG.join(",")}) -> ${output} (${m.width}x${m.height})`);
