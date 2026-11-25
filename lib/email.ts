import "server-only";
import { COUPLE, DATE_LABEL, RSVP_DEADLINE_LABEL, VENUES } from "./wedding";

// Invitation emails, sent through Resend (RESEND_API_KEY). EMAIL_FROM sets the sender; until a
// domain is verified in Resend, its test sender only delivers to the Resend account's own email.

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);
const FROM = () => process.env.EMAIL_FROM || `${COUPLE.short} <onboarding@resend.dev>`;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const INK = "#5e4430";
const NAMES = "#8a6a4f";
const MUTED = "#7d6049";
const GILT = "#a8854e";
const PAPER = "#fdfbf8";
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SCRIPT = "'Pinyon Script', 'Snell Roundhand', 'Apple Chancery', 'Brush Script MT', cursive";

export function renderInviteEmail({ partyName, rsvpUrl, siteUrl }: { partyName: string; rsvpUrl: string; siteUrl: string }) {
  const c = VENUES.ceremony, r = VENUES.reception;
  const subject = `You're invited: ${COUPLE.short}, ${DATE_LABEL}`;
  const venue = (label: string, time: string, name: string, street: string, city: string) => `
    <td width="50%" valign="top" style="padding:0 12px;text-align:center;font-family:${SERIF};color:${INK};">
      <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">${label}</div>
      <div style="font-size:26px;margin-top:6px;">${time}</div>
      <div style="font-size:17px;margin-top:8px;font-weight:600;">${esc(name)}</div>
      <div style="font-size:15px;color:${MUTED};margin-top:2px;">${esc(street.replace(/,$/, ""))}<br>${esc(city)}</div>
    </td>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${esc(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Pinyon+Script&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f3ede5;">
<div style="display:none;max-height:0;overflow:hidden;">Together with their families, Linda &amp; Marko invite you to celebrate their marriage. Please reply by ${RSVP_DEADLINE_LABEL}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3ede5;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:${PAPER};border-radius:18px;overflow:hidden;">
    <tr><td><img src="${siteUrl}/email/peonies-top.jpg" width="600" alt="" style="display:block;width:100%;height:auto;border:0;"></td></tr>
    <tr><td style="padding:0 36px;text-align:center;font-family:${SERIF};color:${INK};">
      <div style="font-size:17px;color:${MUTED};font-style:italic;">Dear ${esc(partyName)},</div>
      <div style="font-size:14px;letter-spacing:3px;text-transform:uppercase;margin-top:22px;font-weight:600;">Together with their families</div>
      <div style="font-family:${SCRIPT};font-size:46px;line-height:1.15;color:${NAMES};margin-top:14px;">${esc(COUPLE.bride)}</div>
      <div style="font-family:${SCRIPT};font-size:34px;line-height:1;color:${GILT};margin:2px 0;">&amp;</div>
      <div style="font-family:${SCRIPT};font-size:46px;line-height:1.15;color:${NAMES};">${esc(COUPLE.groom)}</div>
      <div style="font-size:18px;font-style:italic;margin-top:16px;">invite you to join them as they celebrate their marriage on</div>
      <div style="width:80px;height:1px;background:${GILT};margin:22px auto;"></div>
      <div style="font-size:22px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">${esc(DATE_LABEL)}</div>
    </td></tr>
    <tr><td style="padding:26px 24px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        ${venue("Church Ceremony", c.time, c.name, c.street, c.city)}
        ${venue("Reception", r.time, r.name, r.street, r.city)}
      </tr></table>
    </td></tr>
    <tr><td align="center" style="padding:34px 36px 8px;font-family:${SERIF};">
      <a href="${rsvpUrl}" style="display:inline-block;background:${INK};color:#fffdfa;text-decoration:none;font-size:16px;letter-spacing:2px;text-transform:uppercase;font-weight:600;padding:15px 38px;border-radius:999px;">RSVP</a>
      <div style="font-size:15px;color:${MUTED};margin-top:14px;">Please reply by ${RSVP_DEADLINE_LABEL}.<br>We kindly ask that our celebration be adults only.</div>
    </td></tr>
    <tr><td><img src="${siteUrl}/email/peonies-bottom.jpg" width="600" alt="" style="display:block;width:100%;height:auto;border:0;"></td></tr>
  </table>
  <div style="font-family:${SERIF};font-size:13px;color:${MUTED};margin-top:14px;">
    This RSVP link is personal to your invitation. <a href="${rsvpUrl}" style="color:${MUTED};">${esc(rsvpUrl)}</a>
  </div>
</td></tr>
</table>
</body>
</html>`;

  const text = `Dear ${partyName},

Together with their families, ${COUPLE.bride} & ${COUPLE.groom} invite you to join them as they celebrate their marriage on ${DATE_LABEL}.

Church Ceremony, ${c.time}: ${c.name}, ${c.street.replace(/,$/, "")}, ${c.city}
Reception, ${r.time}: ${r.name}, ${r.street.replace(/,$/, "")}, ${r.city}

Please RSVP by ${RSVP_DEADLINE_LABEL}: ${rsvpUrl}
We kindly ask that our celebration be adults only.`;

  return { subject, html, text };
}

export async function sendEmail(to: string, msg: { subject: string; html: string; text: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM(), to: [to], subject: msg.subject, html: msg.html, text: msg.text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
  }
}
