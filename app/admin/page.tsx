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

  let invites, responses, base;
  try {
    [invites, responses, base] = await Promise.all([listInvites(), listResponses(), siteUrl()]);
  } catch (e) {
    // Signed in, but the guest list can't be loaded: show why instead of a blank server error.
    return (
      <main className="admin-login">
        <div className="card admin-login-card" style={{ textAlign: "left" }}>
          <p className="script admin-mark" style={{ textAlign: "center" }}>
            Linda &amp; Marko
          </p>
          <h1 className="admin-title">The guest list couldn&apos;t load</h1>
          <p className="notice" data-tone="error" style={{ textAlign: "left", wordBreak: "break-word" }}>
            {(e as Error).message}
          </p>
          <p style={{ fontSize: "0.9375rem", color: "var(--color-muted)" }}>
            Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the site&apos;s settings, and that the database tables were created.
          </p>
        </div>
      </main>
    );
  }
  const byInvite = new Map(responses.map((r) => [r.invite_id, r]));
  const rows: Row[] = invites.map((inv) => {
    const r = byInvite.get(inv.id) ?? null;
    return {
      id: inv.id,
      party_name: inv.party_name,
      aliases: inv.aliases,
      email: inv.email,
      phone_last4: inv.phone_last4 ?? null,
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
