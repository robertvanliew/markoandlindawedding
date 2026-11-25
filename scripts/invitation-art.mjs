// Renders the invitation card (lib/invitation-card.ts) in Chrome:
//   public/art/card-corner.png, card-border.png   trimmed peony art the card uses (site + PDF)
//   public/email/invite-card.png                    the digital card for the email, 2.5x (1200 x 1680)
//   print/linda-marko-invitation-5x7.pdf            the printable card with the "Scan to RSVP" QR code
//   print/linda-marko-invitation-5x7.png            a 300 dpi image of the same card
// Usage: node scripts/invitation-art.mjs [site-url]
//   The QR code points to <site-url>/rsvp. Pass the final address (or set NEXT_PUBLIC_SITE_URL)
//   before printing; a card printed with a temporary address cannot be fixed afterwards.
import puppeteer from "puppeteer-core";
import QRCode from "qrcode";
import sharp from "sharp";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { CARD, invitationCardHtml } from "../lib/invitation-card.ts";

const site = (process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || "https://markoandlindawedding.vercel.app").replace(/\/$/, "");
const rsvpUrl = `${site}/rsvp`;

const BROWSERS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
];
const executablePath = BROWSERS.find(existsSync);
if (!executablePath) throw new Error("Chrome or Edge is needed to render the invitation.");

// 1. trimmed peony art for the card
await sharp("public/art/peony-top-left.png").trim({ threshold: 1 }).resize({ width: 640 }).png({ compressionLevel: 9 }).toFile("public/art/card-corner.png");
await sharp("public/art/peony-bottom-right.png").trim({ threshold: 1 }).resize({ width: 960 }).png({ compressionLevel: 9 }).toFile("public/art/card-border.png");
const asData = (p) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;
const art = { corner: asData("public/art/card-corner.png"), border: asData("public/art/card-border.png") };

const qrSvg = await QRCode.toString(rsvpUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#4f3826", light: "#fffdfa" } });

mkdirSync("print", { recursive: true });
const browser = await puppeteer.launch({ executablePath, headless: true });
try {
  const render = async (html, scale) => {
    const page = await browser.newPage();
    await page.setViewport({ width: CARD.width, height: CARD.height, deviceScaleFactor: scale });
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    return page;
  };

  // 2. digital card for the email
  const digital = await render(invitationCardHtml({ art }), 2.5);
  await sharp(await digital.screenshot({ type: "png", clip: { x: 0, y: 0, ...CARD } })).png({ compressionLevel: 9 }).toFile("public/email/invite-card.png");
  console.log("wrote public/email/invite-card.png");

  // 3. print card with QR
  const print = await render(invitationCardHtml({ art, qrSvg }), 300 / 96);
  await print.pdf({ path: "print/linda-marko-invitation-5x7.pdf", width: "5in", height: "7in", printBackground: true, pageRanges: "1" });
  await sharp(await print.screenshot({ type: "png", clip: { x: 0, y: 0, ...CARD } })).withMetadata({ density: 300 }).png({ compressionLevel: 9 }).toFile("print/linda-marko-invitation-5x7.png");
  console.log(`wrote print/linda-marko-invitation-5x7.pdf and .png (QR -> ${rsvpUrl})`);
} finally {
  await browser.close();
}
