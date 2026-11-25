import "server-only";
import { headers } from "next/headers";

/** The site's public address: NEXT_PUBLIC_SITE_URL when set, else the address this request came in on. */
export async function siteUrl() {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fixed) return fixed;
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") || host.startsWith("127.") || host.startsWith("192.168.") ? "http" : "https");
  return `${proto}://${host}`;
}
