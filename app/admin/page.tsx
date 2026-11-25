import type { Metadata } from "next";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { emailConfigured } from "@/lib/email";
import { listInvites, listResponses, usingDatabase } from "@/lib/store";
import { siteUrl } from "@/lib/site-url";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard, type Row } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Guest list · Linda & Marko", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin configured={adminConfigured()} />;

  const [invites, responses, base] = await Promise.all([listInvites(), listResponses(), siteUrl()]);
  const byInvite = new Map(responses.map((r) => [r.invite_id, r]));
  const rows: Row[] = invites.map((inv) => {
    const r = byInvite.get(inv.id) ?? null;
    return {
      id: inv.id,
      party_name: inv.party_name,
      aliases: inv.aliases,
      email: inv.email,
      max_guests: inv.max_guests,
      invited_at: inv.invited_at,
      link: `${base}/rsvp/${inv.token}`,
      status: !r ? "pending" : r.attending ? "attending" : "declined",
      guests: r?.guests ?? [],
      contact_email: r?.contact_email ?? null,
      updated_at: r?.updated_at ?? null,
    };
  });

  return <AdminDashboard rows={rows} usingDatabase={usingDatabase} emailReady={emailConfigured()} />;
}
