// Builds the printed invitation's paper from the Higgsfield blind-emboss artwork:
//   public/art/card-paper-front.jpg   a peony in each corner with vines that wrap around the gold double
//                                      border and taper to tendril tips, on white card (1500 x 2100 = 5 x 7 in)
//   public/art/card-paper-back.jpg    the embossed peony wreath, centred, for the M & L monogram
// The art's paper tone is lifted to pure white (so it sits on white card stock) and the two corners are
// combined with "multiply", which keeps every raised shadow and lets white paper pass through.
// Usage: node scripts/emboss-paper.mjs   (sources in .impeccable/peony-gen/emb/)
import sharp from "sharp";

const W = 1500, H = 2100;
const SRC = ".impeccable/peony-gen/emb";

/** Lift the paper tone (about 243) to white and keep the relief below it. */
async function whitened(file, width) {
  const img = sharp(`${SRC}/${file}`).removeAlpha().resize({ width });
  // map 243 -> 255 and stretch the shadows a touch so the relief stays visible on white
  return img.linear(1.05, 0).modulate({ saturation: 0 }).toBuffer();
}

// Four corner pieces (c-tl, c-tr, c-bl, c-br): a peony in each corner with vines that taper to natural
// tendril tips along the edges. Each piece fades out along its two inner edges, so the paper texture of
// the artwork blends into the white card with no visible seam.
const TILE = Math.round(W * 0.62);
async function corner(file, side) {
  const rgb = await whitened(file, TILE);
  const [h, v] = side; // which edges are the card's outer edges: h = "left"|"right", v = "top"|"bottom"
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}">
    <defs>
      <linearGradient id="x" x1="${h === "left" ? 0 : 1}" y1="0" x2="${h === "left" ? 1 : 0}" y2="0"><stop offset="0.72" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
      <linearGradient id="y" x1="0" y1="${v === "top" ? 0 : 1}" x2="0" y2="${v === "top" ? 1 : 0}"><stop offset="0.72" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
      <mask id="m"><rect width="100%" height="100%" fill="url(#x)"/></mask>
    </defs>
    <rect width="100%" height="100%" fill="url(#y)" mask="url(#m)"/>
  </svg>`;
  const alpha = await sharp(Buffer.from(svg)).extractChannel(0).raw().toBuffer();
  const raw = await sharp(rgb).raw().toBuffer();
  // fade the relief itself toward white (opaque), so "multiply" leaves the card untouched there
  const out = Buffer.alloc(TILE * TILE * 3);
  for (let i = 0; i < TILE * TILE; i++) {
    const a = alpha[i] / 255;
    for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(255 - (255 - raw[i * 3 + c]) * a);
  }
  return sharp(out, { raw: { width: TILE, height: TILE, channels: 3 } }).png().toBuffer();
}

// Where does each corner's vine run? Measure the darkness-weighted centre of the vine along each of
// the piece's two edges (away from the peony), as a distance from that edge.
async function vineOffsets(file, [h, v]) {
  const { data } = await sharp(await whitened(file, TILE)).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  const T = TILE;
  // the vine's stem is where the relief is densest across the edge: build the profile across the edge
  // (summing along it), smooth it, and take the peak
  const centre = (x0, x1, y0, y1, axis) => {
    const X0 = Math.round(x0 * T), X1 = Math.round(x1 * T), Y0 = Math.round(y0 * T), Y1 = Math.round(y1 * T);
    const n = axis === "x" ? X1 - X0 : Y1 - Y0;
    const prof = new Float64Array(n);
    for (let y = Y0; y < Y1; y++)
      for (let x = X0; x < X1; x++) prof[axis === "x" ? x - X0 : y - Y0] += Math.max(0, 246 - data[y * T + x]);
    let best = 0, at = 0;
    for (let i = 0; i < n; i++) {
      let v = 0;
      for (let k = -6; k <= 6; k++) v += prof[Math.min(n - 1, Math.max(0, i + k))];
      if (v > best) { best = v; at = i; }
    }
    return (axis === "x" ? X0 : Y0) + at;
  };
  // vertical vine (along the left or right edge), between the peony and the tendril tip
  const vy = v === "top" ? [0.36, 0.78] : [0.22, 0.64];
  const vx = centre(h === "left" ? 0 : 0.72, h === "left" ? 0.28 : 1, vy[0], vy[1], "x");
  // horizontal vine (along the top or bottom edge)
  const hx = h === "left" ? [0.36, 0.78] : [0.22, 0.64];
  const hy = centre(hx[0], hx[1], v === "top" ? 0 : 0.72, v === "top" ? 0.28 : 1, "y");
  return { side: h === "left" ? vx : T - vx, end: v === "top" ? hy : T - hy };
}

// Each side's border line runs where that side's vines sit closest to the edge; the other corner
// piece on that side slides outward (never inward, which would expose its cropped edge) so both vines
// run exactly along the line, and the vines wrap the border on all four sides alike.
const SIDES = { tl: ["left", "top"], tr: ["right", "top"], bl: ["left", "bottom"], br: ["right", "bottom"] };
const off = {};
for (const k of Object.keys(SIDES)) off[k] = await vineOffsets(`c-${k}.png`, SIDES[k]);
const centreOf = {
  left: Math.min(off.tl.side, off.bl.side),
  right: Math.min(off.tr.side, off.br.side),
  top: Math.min(off.tl.end, off.tr.end),
  bottom: Math.min(off.bl.end, off.br.end),
};
console.log("border line centres (px from edge):", Object.entries(centreOf).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(", "));
const place = async (k) => {
  const [h, v] = SIDES[k];
  const o = off[k];
  const left = h === "left" ? Math.round(centreOf.left - o.side) : Math.round(W - TILE + (o.side - centreOf.right));
  const top = v === "top" ? Math.round(centreOf.top - o.end) : Math.round(H - TILE + (o.end - centreOf.bottom));
  return { input: await corner(`c-${k}.png`, [h, v]), left, top, blend: "multiply" };
};

const paper = await sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } })
  .composite([
    await place("tl"),
    await place("tr"),
    await place("bl"),
    await place("br"),
  ])
  .png()
  .toBuffer()
  .then((png) => sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true }))
  .then(({ data, info }) => {
    if (info.channels !== 3 || info.width !== W || info.height !== H) throw new Error(`unexpected paper ${info.width}x${info.height}x${info.channels}`);
    return data;
  });

// The gold double border, baked in so the vines wrap around it: each pair of lines runs along the
// vine's own path (measured), and wherever a leaf, stem or berry crosses a line, the line passes
// behind it. Lines break at the four peonies with a short taper.
const GOLD = [205, 183, 156]; // #cdb79c
const LINE = 3; // px at 300 dpi (1 CSS px)
const GAP = 12; // between the two lines
const TAPER = 70;
const lines = [
  // [orientation, position of the outer line from its edge, start, end]
  ["top", Math.round(centreOf.top) - 7, 350, W - 400],
  ["bottom", Math.round(centreOf.bottom) - 7, 400, W - 400],
  ["left", Math.round(centreOf.left) - 7, 369, H - 362],
  ["right", Math.round(centreOf.right) - 7, 362, H - 362],
];
const relief = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) relief[i] = paper[i * 3] < 243 ? 1 : 0;
// grow the relief a little so the line stops just short of each leaf edge
const grown = await sharp(Buffer.from(relief.map((v) => v * 255)), { raw: { width: W, height: H, channels: 1 } })
  .dilate(2)
  .blur(0.8)
  .extractChannel(0)
  .raw()
  .toBuffer();
const plot = (x, y, a) => {
  const i = y * W + x;
  const k = a * (1 - grown[i] / 255);
  for (let c = 0; c < 3; c++) paper[i * 3 + c] = Math.round(paper[i * 3 + c] * (1 - k) + GOLD[c] * k);
};
for (const [side, off, from, to] of lines) {
  for (const d of [off, off + GAP]) {
    for (let t = from; t <= to; t++) {
      const fade = Math.min(1, (t - from) / TAPER, (to - t) / TAPER);
      for (let w = 0; w < LINE; w++) {
        if (side === "top") plot(t, d + w, fade);
        else if (side === "bottom") plot(t, H - 1 - d - w, fade);
        else if (side === "left") plot(d + w, t, fade);
        else plot(W - 1 - d - w, t, fade);
      }
    }
  }
}

await sharp(paper, { raw: { width: W, height: H, channels: 3 } })
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile("public/art/card-paper-front.jpg");

const wreathSize = Math.round(W * 0.72);
const wreath = await whitened("emb-wreath.png", wreathSize);
await sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } })
  .composite([{ input: wreath, left: Math.round((W - wreathSize) / 2), top: Math.round((H - wreathSize) / 2) - 60, blend: "multiply" }])
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile("public/art/card-paper-back.jpg");

console.log("wrote public/art/card-paper-front.jpg, public/art/card-paper-back.jpg");
