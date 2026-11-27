import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { COUPLE, DATE_LABEL, RSVP_DEADLINE_LABEL, VENUES, mapsUrl } from "./wedding";

// Invitation emails, sent from the couple's own Gmail (GMAIL_USER + GMAIL_APP_PASSWORD, a Google app
// password), so they reach any guest without a domain of their own. Gmail allows about 500 a day.
// Resend (RESEND_API_KEY) still works as a fallback when Gmail isn't set up.
//
// The invitation card (public/email/invite-card.png, built by scripts/invitation-art.mjs) is linked from the
// site when the site has a public https address, and travels inside the email (inline attachment)
// otherwise, so a test sent from a laptop still shows the peonies.

const gmailReady = () => Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
export const emailConfigured = () => gmailReady() || Boolean(process.env.RESEND_API_KEY);
const FROM = () =>
  process.env.EMAIL_FROM && !(gmailReady() && process.env.EMAIL_FROM.includes("resend.dev"))
    ? process.env.EMAIL_FROM
    : gmailReady()
      ? `"${COUPLE.short}" <${process.env.GMAIL_USER}>`
      : `${COUPLE.short} <onboarding@resend.dev>`;

const ART = { card: "invite-card.png" } as const;
type ArtKey = keyof typeof ART;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const isPublic = (url: string) => {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && !/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname);
  } catch {
    return false;
  }
};

const C = {
  page: "#efe8df",
  paper: "#ffffff",
  ink: "#5e4430",
  body: "#7a5b41",
  muted: "#7d6049",
  gilt: "#a8854e",
  line: "#e6d9cc",
};
const SERIF = "'Cormorant Garamond', 'Cormorant', Georgia, 'Times New Roman', serif";
const SANS = "'Jost', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export type InviteEmail = { subject: string; html: string; text: string; inline: ArtKey[] };

export function renderInviteEmail({
  partyName,
  seats,
  rsvpUrl,
  siteUrl,
  images = "auto",
}: {
  partyName: string;
  seats: number;
  rsvpUrl: string;
  siteUrl: string;
  /** "linked" always loads the artwork from the site (the browser preview); "auto" embeds it unless the site is public. */
  images?: "auto" | "linked";
}): InviteEmail {
  const inline = images === "auto" && !isPublic(siteUrl);
  const src = (k: ArtKey) => (inline ? `cid:${k}` : `${siteUrl}/email/${ART[k]}`);
  const c = VENUES.ceremony,
    r = VENUES.reception;
  const subject = `You're invited: the wedding of ${COUPLE.short}`;
  const seatLine = `We have reserved ${seats} ${seats === 1 ? "seat" : "seats"} in your honour.`;
  const heroAlt = `Together with their families, ${COUPLE.bride} and ${COUPLE.groom} invite you to join them as they celebrate their marriage on ${DATE_LABEL}.`;

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${esc(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@400;500&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; background:${C.page}; }
  a { color:${C.gilt}; }
  @media (max-width: 540px) {
    .card { border-radius:0 !important; }
    .pad { padding-left:24px !important; padding-right:24px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Together with their families, ${esc(COUPLE.short)} invite you to celebrate their marriage on ${esc(DATE_LABEL)}. Please reply by ${esc(RSVP_DEADLINE_LABEL)}.&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};">
<tr><td align="center" style="padding:32px 10px;">

  <table role="presentation" class="card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:${C.paper};border:1px solid ${C.line};border-radius:18px;overflow:hidden;">
    <tr><td style="padding:0;line-height:0;">
      <img src="${src("card")}" width="600" alt="${esc(heroAlt)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;font-family:${SERIF};font-size:18px;color:${C.ink};">
    </td></tr>

    <tr><td class="pad" align="center" style="padding:34px 48px 0;border-top:1px solid ${C.line};">
      <p style="margin:0;font-family:${SERIF};font-style:italic;font-size:21px;line-height:1.5;color:${C.body};">Dear ${esc(partyName)},</p>
      <p style="margin:6px 0 0;font-family:${SERIF};font-size:18px;line-height:1.55;color:${C.body};">${seatLine}</p>
    </td></tr>

    <tr><td class="pad" align="center" style="padding:28px 48px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
        <td align="center" bgcolor="${C.ink}" style="border-radius:999px;">
          <a href="${rsvpUrl}" target="_blank" style="display:inline-block;padding:16px 46px;font-family:${SANS};font-size:15px;font-weight:500;letter-spacing:3px;text-transform:uppercase;color:#fffdfa;text-decoration:none;border-radius:999px;">Reply to our invitation</a>
        </td>
      </tr></table>
      <p style="margin:16px 0 0;font-family:${SERIF};font-size:17px;line-height:1.5;color:${C.body};">Kindly reply by ${esc(RSVP_DEADLINE_LABEL)}.</p>
      <p style="margin:2px 0 0;font-family:${SERIF};font-style:italic;font-size:16px;line-height:1.5;color:${C.muted};">We kindly ask that our celebration be adults only.</p>
    </td></tr>

    <tr><td class="pad" align="center" style="padding:22px 48px 36px;font-family:${SANS};font-size:13px;line-height:1.8;color:${C.muted};">
      Directions:
      <a href="${mapsUrl("ceremony")}" style="color:${C.gilt};">${esc(c.name)}</a>
      &nbsp;·&nbsp;
      <a href="${mapsUrl("reception")}" style="color:${C.gilt};">${esc(r.name)}</a>
    </td></tr>
  </table>

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
    <tr><td class="pad" align="center" style="padding:20px 32px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.muted};">
      This invitation is personal to ${esc(partyName)}. If the button doesn't open, copy this link into your browser:<br>
      <a href="${rsvpUrl}" style="color:${C.muted};word-break:break-all;">${esc(rsvpUrl)}</a>
    </td></tr>
  </table>

</td></tr>
</table>
</body>
</html>`;

  const text = `Dear ${partyName},

Together with their families, ${COUPLE.bride} & ${COUPLE.groom} invite you to join them as they celebrate their marriage on ${DATE_LABEL}.

${seatLine}

${c.label}, ${c.time}
${c.name}, ${c.street.replace(/,$/, "")}, ${c.city}

${r.label}, ${r.time}
${r.name}, ${r.street.replace(/,$/, "")}, ${r.city}

Reply to our invitation: ${rsvpUrl}
Kindly reply by ${RSVP_DEADLINE_LABEL}. We kindly ask that our celebration be adults only.

With love,
${COUPLE.short}`;

  return { subject, html, text, inline: inline ? (Object.keys(ART) as ArtKey[]) : [] };
}

let transport: import("nodemailer").Transporter | null = null;
async function gmail() {
  if (!transport) {
    const nodemailer = (await import("nodemailer")).default;
    transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER?.trim(), pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "") },
    });
  }
  return transport;
}

const artFile = (k: ArtKey) => path.join(process.cwd(), "public", "email", ART[k]);

export async function sendEmail(to: string, msg: InviteEmail) {
  if (gmailReady()) {
    try {
      await (await gmail()).sendMail({
        from: FROM(),
        to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        attachments: msg.inline.map((k) => ({ filename: ART[k], content: readFileSync(artFile(k)), cid: k, contentType: "image/png" })),
      });
    } catch (e) {
      const m = (e as Error).message;
      throw new Error(
        /Invalid login|Username and Password not accepted|535/i.test(m)
          ? "Gmail didn't accept the sign-in. Check GMAIL_USER and the app password."
          : `Gmail: ${m.slice(0, 200)}`,
      );
    }
    return;
  }

  const attachments = msg.inline.map((k) => ({
    filename: ART[k],
    content: readFileSync(artFile(k)).toString("base64"),
    content_id: k,
    content_type: "image/png",
  }));
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM(),
      to: [to],
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      ...(attachments.length ? { attachments } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
  }
}
