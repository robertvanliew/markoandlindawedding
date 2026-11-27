import type { MetadataRoute } from "next";

// Link-preview bots (iMessage, WhatsApp, Facebook, Slack...) respect robots.txt, so the home page and its
// preview card stay open to them. Search engines are still told not to list the site by the noindex
// meta tag and X-Robots-Tag header. The dashboard and personal RSVP links stay closed to every bot.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/rsvp/"] } };
}
