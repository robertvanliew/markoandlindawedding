"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, signIn, signOut } from "@/lib/admin-auth";
import { emailConfigured, renderInviteEmail, sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/site-url";
import { createInvite, deleteAllGuestData, deleteInvite, getInvite, listInvites, markInvited, normalizeEmail, updateInvite } from "@/lib/store";

export async function login(_prev: { error?: string } | null, form: FormData): Promise<{ error?: string } | null> {
  if (!rateLimit("admin-login", 10, 60_000)) return { error: "Too many attempts. Please wait a minute." };
  const ok = await signIn(String(form.get("password") ?? ""));
  if (!ok) return { error: "That password isn't right." };
  revalidatePath("/admin");
  return null;
}

export async function logout() {
  await signOut();
  revalidatePath("/admin");
}

const InviteSchema = z.object({
  party_name: z.string().trim().min(1, "Please enter the party's name.").max(120),
  aliases: z
    .string()
    .max(500)
    .transform((s) => s.split(/[;\n]/).map((x) => x.trim()).filter(Boolean)),
  email: z.union([z.literal(""), z.email("That email doesn't look right.")]).transform((s) => (s ? normalizeEmail(s) : null)),
  max_guests: z.coerce.number().int().min(1, "At least 1 seat.").max(20, "20 seats at most."),
});

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveInvite(id: string | null, input: { party_name: string; aliases: string; email: string; max_guests: number }): Promise<SaveResult> {
  await requireAdmin();
  const parsed = InviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the details." };
  if (id) await updateInvite(id, parsed.data);
  else await createInvite(parsed.data);
  revalidatePath("/admin");
  return { ok: true };
}

export async function removeInvite(id: string): Promise<SaveResult> {
  await requireAdmin();
  await deleteInvite(id);
  revalidatePath("/admin");
  return { ok: true };
}

/** CSV columns: party_name, max_guests, aliases (separated by ;), email. A header row is optional. */
export async function importCsv(csv: string): Promise<{ ok: true; added: number; skipped: string[] } | { ok: false; error: string }> {
  await requireAdmin();
  const rows = parseCsv(csv);
  if (!rows.length) return { ok: false, error: "The file is empty." };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const hasHeader = head.includes("party_name");
  const col = (name: string, fallback: number) => (hasHeader ? head.indexOf(name) : fallback);
  const idx = { party: col("party_name", 0), seats: col("max_guests", 1), aliases: col("aliases", 3), email: col("email", 4) };
  const existing = new Set((await listInvites()).map((i) => i.party_name.trim().toLowerCase()));
  let added = 0;
  const skipped: string[] = [];
  for (const [n, row] of rows.slice(hasHeader ? 1 : 0).entries()) {
    const at = (i: number) => (i >= 0 ? (row[i] ?? "").trim() : "");
    const parsed = InviteSchema.safeParse({ party_name: at(idx.party), max_guests: at(idx.seats) || "1", aliases: at(idx.aliases), email: at(idx.email) });
    const line = n + (hasHeader ? 2 : 1);
    if (!parsed.success) {
      if (row.some((c) => c.trim())) skipped.push(`Row ${line}: ${parsed.error.issues[0]?.message}`);
      continue;
    }
    if (existing.has(parsed.data.party_name.toLowerCase())) {
      skipped.push(`Row ${line}: "${parsed.data.party_name}" is already on the list`);
      continue;
    }
    await createInvite(parsed.data);
    existing.add(parsed.data.party_name.toLowerCase());
    added++;
  }
  revalidatePath("/admin");
  return { ok: true, added, skipped };
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

export type SendResult = { ok: true; sent: number; failed: string[]; skipped: string[] } | { ok: false; error: string };

export async function sendInvites(ids: string[]): Promise<SendResult> {
  await requireAdmin();
  if (!emailConfigured()) return { ok: false, error: "Email sending isn't switched on yet: add BREVO_API_KEY and EMAIL_SENDER to the site's settings." };
  const base = await siteUrl();
  const sent: string[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];
  for (const id of ids.slice(0, 300)) {
    const inv = await getInvite(id);
    if (!inv) continue;
    if (!inv.email) {
      skipped.push(`${inv.party_name} (no email)`);
      continue;
    }
    try {
      await sendEmail(inv.email, renderInviteEmail({ partyName: inv.party_name, seats: inv.max_guests, rsvpUrl: `${base}/rsvp/${inv.token}`, siteUrl: base }));
      sent.push(inv.id);
    } catch (e) {
      failed.push(`${inv.party_name}: ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 120)); // stay well under Resend's rate limit
  }
  await markInvited(sent);
  revalidatePath("/admin");
  return { ok: true, sent: sent.length, failed, skipped };
}

/** Permanently deletes every invitation and reply. Meant for after the wedding, once the final list is exported. */
export async function deleteEverything(confirmation: string): Promise<SaveResult> {
  await requireAdmin();
  if (confirmation.trim() !== "DELETE") return { ok: false, error: 'Type DELETE in capitals to confirm.' };
  await deleteAllGuestData();
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Sends one sample invitation to the given address, so the couple can see exactly what guests receive.
 * Uses the first party on the list (its real RSVP link) or a sample party when the list is empty.
 * Nothing is marked as sent.
 */
export async function sendTestInvite(to: string): Promise<SaveResult> {
  await requireAdmin();
  if (!emailConfigured()) return { ok: false, error: "Email sending isn't switched on yet: add BREVO_API_KEY and EMAIL_SENDER to the site's settings." };
  const email = z.email().safeParse(to.trim());
  if (!email.success) return { ok: false, error: "Please enter a valid email address." };
  if (!rateLimit("admin-test-send", 10, 60_000)) return { ok: false, error: "Too many test sends. Please wait a minute." };
  const base = await siteUrl();
  const first = (await listInvites())[0];
  try {
    await sendEmail(
      email.data,
      renderInviteEmail({
        partyName: first?.party_name ?? "Ana & Petar Jovanović",
        seats: first?.max_guests ?? 2,
        rsvpUrl: `${base}/rsvp/${first?.token ?? "example"}`,
        siteUrl: base,
      }),
    );
  } catch (e) {
    return { ok: false, error: `The test didn't send: ${(e as Error).message}` };
  }
  return { ok: true };
}

/** Marks parties as invited after the couple sends the invitation themselves (the "Send via Gmail" button). */
export async function markSent(ids: string[]): Promise<SaveResult> {
  await requireAdmin();
  await markInvited(ids.slice(0, 300));
  revalidatePath("/admin");
  return { ok: true };
}
