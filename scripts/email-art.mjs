// Builds the peony artwork for the invitation emails from the site's peony images: a header with
// sprays in both top corners and a footer garland, flattened onto the site's ivory paper (email
// clients handle solid images more reliably than transparent ones).
// Usage: node scripts/email-art.mjs
import sharp from "sharp";

const PAPER = { r: 253, g: 251, b: 248 };
const W = 1200;

// Header: top-left spray on the left, its mirror on the right.
{
  const H = 420;
  const spray = await sharp("public/art/peony-top-left.png").resize({ height: Math.round(H * 1.55) }).toBuffer();
  const m = await sharp(spray).metadata();
  const crop = await sharp(spray).extract({ left: 0, top: 0, width: Math.min(m.width, 460), height: H }).toBuffer();
  const mirror = await sharp(crop).flop().toBuffer();
  const cw = (await sharp(crop).metadata()).width;
  await sharp({ create: { width: W, height: H, channels: 3, background: PAPER } })
    .composite([
      { input: crop, left: 0, top: 0 },
      { input: mirror, left: W - cw, top: 0 },
    ])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile("public/email/peonies-top.jpg");
}

// Footer: the bottom garland.
{
  const garland = await sharp("public/art/garland-bottom.png").resize({ width: W }).toBuffer();
  const h = (await sharp(garland).metadata()).height;
  await sharp({ create: { width: W, height: h, channels: 3, background: PAPER } })
    .composite([{ input: garland, left: 0, top: 0 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile("public/email/peonies-bottom.jpg");
}
console.log("wrote public/email/peonies-top.jpg, public/email/peonies-bottom.jpg");
