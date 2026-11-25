import { isAdmin } from "@/lib/admin-auth";
import { listInvites, listResponses } from "@/lib/store";
import { MEALS } from "@/lib/wedding";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows: unknown[][]) => "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
const meal = (m: string) => MEALS.find((x) => x.value === m)?.label ?? m;

/** ?type=attending: one row per attending guest. ?type=pending: parties that have not replied. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Not signed in", { status: 401 });
  const type = new URL(req.url).searchParams.get("type");
  const [invites, responses] = await Promise.all([listInvites(), listResponses()]);
  const byInvite = new Map(responses.map((r) => [r.invite_id, r]));

  let rows: unknown[][];
  let name: string;
  if (type === "pending") {
    name = "not-yet-replied";
    rows = [["party_name", "seats_reserved", "email", "invitation_sent"]];
    for (const inv of invites) if (!byInvite.has(inv.id)) rows.push([inv.party_name, inv.max_guests, inv.email ?? "", inv.invited_at ? inv.invited_at.slice(0, 10) : "not sent"]);
  } else {
    name = "attending-guests";
    rows = [["party_name", "guest_name", "meal", "dietary_notes", "contact_email", "replied_at"]];
    for (const inv of invites) {
      const r = byInvite.get(inv.id);
      if (!r?.attending) continue;
      for (const g of r.guests) rows.push([inv.party_name, g.full_name, meal(g.meal), g.dietary_notes ?? "", r.contact_email ?? inv.email ?? "", r.updated_at.slice(0, 10)]);
    }
  }
  return new Response(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="linda-marko-${name}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
