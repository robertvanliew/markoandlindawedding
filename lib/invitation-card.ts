// The invitation card, laid out like the printed original: double-line border, the original wording
// and order, and the two-column ceremony / reception block.
//
// One template, two uses:
//   - print (emboss: true): a 5 x 7 in card on blind-embossed paper (peonies with vines running along the
//     border, built by scripts/emboss-paper.mjs), a "Scan to RSVP" QR code, and an L & M monogram wreath on
//     the back (back: true)
//   - digital: the card with the photographed white peonies in the top-left and bottom-right corners, as
//     the centrepiece of the invitation email
// Self-contained (no app imports) so the Node render script can load it too.

export type CardArt = { corner: string; border: string; paperFront?: string; paperBack?: string };

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Pinyon+Script&display=block" rel="stylesheet">';

/** Card is drawn at 480 x 672 CSS px = 5 x 7 in at 96 px/in. */
export const CARD = { width: 480, height: 672 } as const;

export function invitationCardHtml({
  art,
  qrSvg,
  page = false,
  emboss = false,
  back = false,
}: {
  art: CardArt;
  qrSvg?: string;
  page?: boolean;
  /** use the embossed paper (art.paperFront) instead of the photographed peonies */
  emboss?: boolean;
  /** add the monogram back of the card (art.paperBack) */
  back?: boolean;
}) {
  const qr = qrSvg
    ? `<div class="qr"><div class="qr-code">${qrSvg}</div><div class="qr-label">Scan to RSVP</div></div>`
    : "";
  const flowers = emboss
    ? ""
    : `<div class="corner"><img src="${art.corner}" alt=""></div>
  <div class="border"><img src="${art.border}" alt=""></div>`;
  const backCard = back
    ? `<div class="sheet-gap"></div>
<div class="card back">
  <div class="mono" aria-label="L and M"><span class="l">L</span><span class="a">&amp;</span><span class="l">M</span></div>
  <p class="back-date">May 15, 2027</p>
</div>`
    : "";
  const bar = page
    ? `<div class="bar"><p>Your printable invitation (5 × 7 in)${back ? ", front and back" : ""}. Print it ${back ? "double-sided " : ""}on cardstock, or choose <b>Save as PDF</b> to send it to a print shop.</p><p style="margin-top:10px"><button onclick="window.print()">Print or save as PDF</button></p></div>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Linda &amp; Marko · Invitation</title>${FONTS}
<style>
  @page { size: 5in 7in; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: ${page ? "#ece5dc" : "#ffffff"}; }
  body { font-family: 'Cormorant Garamond', Georgia, serif; color: #6f5440; -webkit-font-smoothing: antialiased;
    font-variant-numeric: lining-nums; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  ${
    page
      ? `body { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 32px 16px; }
  .bar { font-family: system-ui, sans-serif; font-size: 14px; color: #5e4430; text-align: center; max-width: 480px; line-height: 1.5; margin-bottom: 18px; }
  .bar button { font: inherit; font-weight: 600; padding: 10px 22px; border-radius: 999px; border: 0; background: #5e4430; color: #fff; cursor: pointer; }
  .card { box-shadow: 0 2px 6px rgb(94 68 48 / .08), 0 30px 60px -30px rgb(94 68 48 / .35); }
  @media print { html, body { background: #ffffff; } body { display: block; padding: 0; min-height: 0; } .bar { display: none; } .card { box-shadow: none; } }`
      : ""
  }

  .card { position: relative; width: ${CARD.width}px; height: ${CARD.height}px; overflow: hidden; background: #ffffff; break-inside: avoid; }
  .sheet-gap { height: 24px; }
  @media print { .sheet-gap { display: none; } .card.back { break-before: page; } }

  /* The double border, drawn as separate lines so each one stops short of the peonies with a short,
     clean taper (like a printed frame broken by florals). */
  .ln { position: absolute; --c: #cdb79c; --t: 34px; }
  .ln.h { height: 1px; }
  .ln.v { width: 1px; }
  .ln.top { top: var(--o); left: 198px; right: var(--o); background: linear-gradient(90deg, transparent, var(--c) var(--t)); }
  .ln.right { right: var(--o); top: var(--o); bottom: 262px; background: linear-gradient(180deg, var(--c) calc(100% - var(--t)), transparent); }
  .ln.left { left: var(--o); top: 262px; bottom: var(--o); background: linear-gradient(180deg, transparent, var(--c) var(--t)); }
  .ln.bottom { bottom: var(--o); left: var(--o); right: 198px; background: linear-gradient(90deg, var(--c) calc(100% - var(--t)), transparent); }
  .outer { --o: 20px; }
  .inner { --o: 24px; }

  /* Printed card: the embossed paper carries the flowers; the border runs along the vines and only
     breaks at the two peonies, like the original. */
  .card.emboss { background: #fff url("${art.paperFront ?? ""}") center / 100% 100% no-repeat; }
  /* the printed card's border is part of the embossed paper (scripts/emboss-paper.mjs), so the vines
     can wrap around it */
  .card.emboss .ln { display: none; }
  /* a peony in every corner: each line breaks at both ends with a short taper, and runs along the vines */
  .card.emboss .ln { --t: 22px; }
  .card.emboss .ln.h { background: linear-gradient(90deg, transparent, var(--c) var(--t), var(--c) calc(100% - var(--t)), transparent); }
  .card.emboss .ln.v { background: linear-gradient(180deg, transparent, var(--c) var(--t), var(--c) calc(100% - var(--t)), transparent); }
  .card.emboss .ln.top { left: 112px; right: 128px; }
  .card.emboss .ln.bottom { left: 128px; right: 128px; }
  .card.emboss .ln.left { top: 118px; bottom: 116px; }
  .card.emboss .ln.right { top: 116px; bottom: 116px; }

  /* Digital card: the photographed peonies, whitened and raised like an emboss. */
  .corner { position: absolute; top: -14px; left: -18px; width: 200px;
    -webkit-mask-image: radial-gradient(118% 105% at 0% 0%, #000 52%, transparent 86%);
            mask-image: radial-gradient(118% 105% at 0% 0%, #000 52%, transparent 86%); }
  .border { position: absolute; right: -18px; bottom: -14px; width: 200px;
    -webkit-mask-image: radial-gradient(118% 105% at 100% 100%, #000 52%, transparent 86%);
            mask-image: radial-gradient(118% 105% at 100% 100%, #000 52%, transparent 86%); }
  .corner img, .border img { display: block; width: 100%; height: auto;
    filter: grayscale(1) sepia(0.14) brightness(1.13) contrast(0.88)
      drop-shadow(-0.7px -0.7px 0 rgba(255, 255, 255, 0.95))
      drop-shadow(0.8px 1.1px 0.6px rgba(110, 86, 64, 0.32))
      drop-shadow(1.6px 2.4px 2.2px rgba(110, 86, 64, 0.16)); }

  .text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center;
    padding: ${qrSvg ? "94px" : "112px"} 56px 0; text-align: center; }
  .caps { text-transform: uppercase; }
  .together { font-size: 10.5px; font-weight: 600; letter-spacing: 3px; color: #7a5b41; }
  .names { font-family: 'Pinyon Script', cursive; font-weight: 400; font-size: 40px; line-height: 1.12; color: #8a6a4f; }
  .names.first { margin-top: 12px; }
  .amp { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 0 0 2px;
    font-family: 'Pinyon Script', cursive; font-size: 30px; line-height: 1; color: #a8854e; }
  .amp::before, .amp::after { content: ""; width: 74px; height: 1px; }
  .amp::before { background: linear-gradient(90deg, transparent, #d6c2a0); }
  .amp::after { background: linear-gradient(90deg, #d6c2a0, transparent); }
  .lead { margin-top: 14px; font-size: 10.5px; font-weight: 600; letter-spacing: 2.4px; line-height: 1.9; color: #7a5b41; }
  .date { margin-top: 12px; font-size: 16px; font-weight: 600; letter-spacing: 3.2px; color: #5e4430; }
  .date sup { font-size: 9.5px; letter-spacing: 1px; vertical-align: 5px; }
  .cols { display: grid; grid-template-columns: 1fr 1px 1fr; gap: 16px; width: 100%; margin-top: 18px; }
  .cols hr { border: 0; width: 1px; background: #d9c8b4; }
  .col h2 { font-size: 11.5px; font-weight: 600; letter-spacing: 2.2px; color: #5e4430; }
  .col .time { margin-top: 4px; font-size: 14.5px; font-weight: 600; letter-spacing: 1.4px; color: #5e4430; }
  .col .venue { margin-top: 9px; font-size: 9.5px; font-weight: 600; letter-spacing: 1.6px; line-height: 1.55; color: #7a5b41; }
  .col .addr { margin-top: 7px; font-size: 9px; font-weight: 600; letter-spacing: 1.5px; line-height: 1.6; color: #8a6d55; }
  .rsvp { margin-top: 18px; font-size: 10px; font-weight: 600; letter-spacing: 2.4px; color: #7a5b41; }
  .qr { margin-top: 12px; display: flex; flex-direction: column; align-items: center; gap: 5px; }
  .qr-code { width: 68px; height: 68px; padding: 4px; background: #ffffff; border: 1px solid #e3d5c4; border-radius: 6px; }
  .qr-code svg { display: block; width: 100%; height: 100%; }
  .qr-label { font-size: 8.5px; font-weight: 600; letter-spacing: 2.2px; text-transform: uppercase; color: #7a5b41; }

  /* The back: the embossed peony wreath with the couple's monogram in its centre. */
  .card.back { background: #fff url("${art.paperBack ?? ""}") center / 100% 100% no-repeat; }
  /* centred on the wreath's measured centre (x 238.6, y 315 of the 480 x 672 card) and sized to sit
     inside its open middle (about 83 px clear in every direction) */
  .mono { position: absolute; left: 238.6px; top: 315px; transform: translate(-50%, -50%);
    display: flex; align-items: baseline; justify-content: center; white-space: nowrap;
    font-family: 'Pinyon Script', cursive; color: #8a6a4f; line-height: 1; }
  .mono .l { font-size: 60px; }
  .mono .a { font-size: 30px; color: #a8854e; margin: 0 4px; }
  .back-date { position: absolute; left: 0; right: 0; bottom: 70px; text-align: center;
    font-size: 10px; font-weight: 600; letter-spacing: 3.4px; text-transform: uppercase; color: #8a6d55; }
</style></head>
<body>
${bar}
<div class="card${emboss ? " emboss" : ""}">
  <div class="ln h top outer"></div><div class="ln v right outer"></div><div class="ln v left outer"></div><div class="ln h bottom outer"></div>
  <div class="ln h top inner"></div><div class="ln v right inner"></div><div class="ln v left inner"></div><div class="ln h bottom inner"></div>
  ${flowers}
  <div class="text">
    <p class="together caps">Together with their families</p>
    <p class="names first">Linda Todorovski</p>
    <p class="amp">&amp;</p>
    <p class="names">Marko Pupavac</p>
    <p class="lead caps">Invite you to join them<br>as they celebrate their marriage on</p>
    <p class="date caps">Saturday, May 15, 2027</p>
    <div class="cols">
      <div class="col">
        <h2 class="caps">Church Ceremony</h2>
        <p class="time">1:00 PM</p>
        <p class="venue caps">St. Sava Serbian<br>Orthodox Church</p>
        <p class="addr caps">1375 Blundell Rd.,<br>Mississauga, ON</p>
      </div>
      <hr>
      <div class="col">
        <h2 class="caps">Reception</h2>
        <p class="time">5:30 PM</p>
        <p class="venue caps">Château Le Jardin</p>
        <p class="addr caps">8440 Hwy 27,<br>Woodbridge, ON</p>
      </div>
    </div>
    <p class="rsvp caps">Please RSVP by March 15th, 2027</p>
    ${qr}
  </div>
</div>
${backCard}
</body></html>`;
}
