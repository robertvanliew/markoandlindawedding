import QRCode from "qrcode";
import { isAdmin } from "@/lib/admin-auth";
import { invitationCardHtml } from "@/lib/invitation-card";
import { siteUrl } from "@/lib/site-url";

/**
 * The printable 5 x 7 invitation: embossed front with its "Scan to RSVP" QR code (pointing at this
 * site's /rsvp page) and the M & L monogram back.
 * Opens in the browser; Print or Save as PDF from there.
 */
export async function GET() {
  if (!(await isAdmin())) return new Response("Not signed in", { status: 401 });
  const base = await siteUrl();
  const qrSvg = await QRCode.toString(`${base}/rsvp`, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#4f3826", light: "#ffffff" },
  });
  const html = invitationCardHtml({
    art: {
      corner: `${base}/art/card-corner.png`,
      border: `${base}/art/card-border.png`,
      paperFront: `${base}/art/card-paper-front.jpg`,
      paperBack: `${base}/art/card-paper-back.jpg`,
    },
    qrSvg,
    page: true,
    emboss: true,
    back: true,
  });
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
