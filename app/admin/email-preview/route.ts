import { isAdmin } from "@/lib/admin-auth";
import { renderInviteEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";
import { getInvite } from "@/lib/store";

/** Shows the invitation email exactly as a guest receives it. ?id=<invite id> uses that party's name and link. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Not signed in", { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  const inv = id ? await getInvite(id) : null;
  const base = await siteUrl();
  const { html } = renderInviteEmail({
    partyName: inv?.party_name ?? "Ana & Petar Jovanović",
    seats: inv?.max_guests ?? 2,
    rsvpUrl: `${base}/rsvp/${inv?.token ?? "example"}`,
    siteUrl: base,
    images: "linked",
  });
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
