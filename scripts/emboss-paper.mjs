// Builds the printed invitation's paper from the Higgsfield blind-emboss artwork:
//   public/art/card-paper-front.jpg   a peony in each corner with vines running along the border and
//                                      tapering to tendril tips, on white card (1500 x 2100 = 5 x 7 in at 300 dpi)
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

await sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } })
  .composite([
    { input: await corner("c-tl.png", ["left", "top"]), left: 0, top: 0, blend: "multiply" },
    { input: await corner("c-tr.png", ["right", "top"]), left: W - TILE, top: 0, blend: "multiply" },
    { input: await corner("c-bl.png", ["left", "bottom"]), left: 0, top: H - TILE, blend: "multiply" },
    { input: await corner("c-br.png", ["right", "bottom"]), left: W - TILE, top: H - TILE, blend: "multiply" },
  ])
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile("public/art/card-paper-front.jpg");

const wreathSize = Math.round(W * 0.72);
const wreath = await whitened("emb-wreath.png", wreathSize);
await sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } })
  .composite([{ input: wreath, left: Math.round((W - wreathSize) / 2), top: Math.round((H - wreathSize) / 2) - 60, blend: "multiply" }])
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile("public/art/card-paper-back.jpg");

console.log("wrote public/art/card-paper-front.jpg, public/art/card-paper-back.jpg");
