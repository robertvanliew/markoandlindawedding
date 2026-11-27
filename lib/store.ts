import "server-only";
import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Meal } from "./wedding";

// Guest list and RSVPs.
// With SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set, everything is stored in Supabase (schema in
// supabase/migrations). Without them, an in-memory store with test invites is used so the site runs
// locally; it resets whenever the server restarts.

export type Invite = {
  id: string;
  token: string;
  party_name: string;
  aliases: string[];
  email: string | null;
  /** Last 4 digits of the party's phone number; with the last name, how guests find their invitation. */
  phone_last4: string | null;
  max_guests: number;
  kids_allowed: boolean;
  invited_at: string | null;
  created_at: string;
};

export type ResponseGuest = { full_name: string; meal: Meal; dietary_notes: string | null };

export type RsvpResponse = {
  invite_id: string;
  attending: boolean;
  guest_count: number;
  contact_email: string | null;
  guests: ResponseGuest[];
  submitted_at: string;
  updated_at: string;
};

export type InviteInput = { party_name: string; aliases: string[]; email: string | null; phone_last4: string | null; max_guests: number };

export const usingDatabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export function newToken() {
  return randomBytes(8).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10).padEnd(10, "x");
}

export const normalizeEmail = (s: string) => s.trim().toLowerCase();

/** Lowercase, strip accents and punctuation; đ → dj so "Đorđević" matches "Djordjevic". */
export function normalizeName(s: string) {
  return s
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Every full name an invitation answers to: each person in the party name ("Ana & Petar Jovanović",
 * "The Đorđević Family") with the shared surname, plus any other names added in the dashboard.
 */
function namesFor(invite: Invite): string[] {
  const names = new Set(invite.aliases.map(normalizeName));
  const party = invite.party_name.replace(/^the\s+/i, "").replace(/\s+family$/i, "");
  const people = party.split(/\s*(?:&|\band\b|,)\s*/i).filter(Boolean);
  const surname = people[people.length - 1]?.trim().split(/\s+/).slice(1).join(" ") ?? "";
  for (const person of people) {
    const parts = person.trim().split(/\s+/);
    names.add(normalizeName(parts.length > 1 ? parts.join(" ") : `${parts[0]} ${surname}`));
  }
  return [...names].filter((n) => n.includes(" "));
}

// ---------------------------------------------------------------- backends

interface Backend {
  listInvites(): Promise<Invite[]>;
  getInviteByToken(token: string): Promise<Invite | null>;
  getInvite(id: string): Promise<Invite | null>;
  createInvite(input: InviteInput): Promise<Invite>;
  updateInvite(id: string, input: InviteInput): Promise<void>;
  deleteInvite(id: string): Promise<void>;
  markInvited(ids: string[], at: string): Promise<void>;
  deleteAll(): Promise<void>;
  listResponses(): Promise<RsvpResponse[]>;
  getResponse(inviteId: string): Promise<RsvpResponse | null>;
  saveResponse(inviteId: string, data: Omit<RsvpResponse, "invite_id" | "submitted_at" | "updated_at">): Promise<RsvpResponse>;
}

// --- memory (local development) ---

const now = () => new Date().toISOString();
const seed = (id: string, token: string, party_name: string, max_guests: number, aliases: string[] = [], email: string | null = null, phone_last4: string | null = null): Invite => ({
  id, token, party_name, aliases, email, phone_last4, max_guests, kids_allowed: false, invited_at: null, created_at: now(),
});
const SEED: Invite[] = [
  seed("inv-1", "k7m2q9xw", "Jelena Marković", 1, [], "jelena@example.com", "1111"),
  seed("inv-2", "p4t8z3va", "Ana & Petar Jovanović", 2, [], "ana.petar@example.com", "2222"),
  seed("inv-3", "d9r5w1hn", "The Đorđević Family", 4, ["Dragan Đorđević", "Mira Đorđević"], "djordjevic@example.com", "3333"),
  seed("inv-4", "m3n6c8ye", "Milan & Vesna Nikolić", 2, [], "milan.vesna@example.com", "4444"),
  seed("inv-5", "s2f7j4ub", "Milan Nikolić", 1, [], "milan.n@example.com", "5555"),
];

type Mem = { invites: Invite[]; responses: Map<string, RsvpResponse> };
const g = globalThis as unknown as { __weddingDb?: Mem };

const memory: Backend = {
  get db(): Mem {
    return (g.__weddingDb ??= { invites: SEED.map((i) => ({ ...i })), responses: new Map() });
  },
  async listInvites() {
    return [...this.db.invites].sort((a, b) => a.party_name.localeCompare(b.party_name));
  },
  async getInviteByToken(token) {
    return this.db.invites.find((i) => i.token === token) ?? null;
  },
  async getInvite(id) {
    return this.db.invites.find((i) => i.id === id) ?? null;
  },
  async createInvite(input) {
    const inv: Invite = { ...input, id: `inv-${newToken()}`, token: newToken(), kids_allowed: false, invited_at: null, created_at: now() };
    this.db.invites.push(inv);
    return inv;
  },
  async updateInvite(id, input) {
    const inv = this.db.invites.find((i) => i.id === id);
    if (inv) Object.assign(inv, input);
  },
  async deleteInvite(id) {
    this.db.invites = this.db.invites.filter((i) => i.id !== id);
    this.db.responses.delete(id);
  },
  async deleteAll() {
    g.__weddingDb = { invites: [], responses: new Map() };
  },
  async markInvited(ids, at) {
    for (const inv of this.db.invites) if (ids.includes(inv.id)) inv.invited_at = at;
  },
  async listResponses() {
    return [...this.db.responses.values()];
  },
  async getResponse(inviteId) {
    return this.db.responses.get(inviteId) ?? null;
  },
  async saveResponse(inviteId, data) {
    const prev = this.db.responses.get(inviteId);
    const saved: RsvpResponse = { ...data, invite_id: inviteId, submitted_at: prev?.submitted_at ?? now(), updated_at: now() };
    this.db.responses.set(inviteId, saved);
    return saved;
  },
} as Backend & { db: Mem };

// --- Supabase ---

let client: SupabaseClient | null = null;
const sb = () =>
  (client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  }));

function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) {
    if (/phone_last4/.test(r.error.message))
      throw new Error("The database is missing the phone column. Run supabase/migrations/0003_phone_last4.sql in Supabase → SQL Editor.");
    throw new Error(`Database error: ${r.error.message}`);
  }
  return r.data;
}

type ResponseRow = {
  invite_id: string;
  attending: boolean;
  guest_count: number;
  contact_email: string | null;
  submitted_at: string;
  updated_at: string;
  response_guests: ResponseGuest[];
};
const toResponse = (r: ResponseRow): RsvpResponse => ({
  invite_id: r.invite_id,
  attending: r.attending,
  guest_count: r.guest_count,
  contact_email: r.contact_email,
  submitted_at: r.submitted_at,
  updated_at: r.updated_at,
  guests: (r.response_guests ?? []).map((x) => ({ full_name: x.full_name, meal: x.meal, dietary_notes: x.dietary_notes })),
});
const RESPONSE_SELECT = "invite_id, attending, guest_count, contact_email, submitted_at, updated_at, response_guests(full_name, meal, dietary_notes)";

const supabase: Backend = {
  async listInvites() {
    return check(await sb().from("invites").select("*").order("party_name")) as Invite[];
  },
  async getInviteByToken(token) {
    return check(await sb().from("invites").select("*").eq("token", token).maybeSingle()) as Invite | null;
  },
  async getInvite(id) {
    return check(await sb().from("invites").select("*").eq("id", id).maybeSingle()) as Invite | null;
  },
  async createInvite(input) {
    return check(await sb().from("invites").insert({ ...input, token: newToken() }).select("*").single()) as Invite;
  },
  async updateInvite(id, input) {
    check(await sb().from("invites").update(input).eq("id", id));
  },
  async deleteInvite(id) {
    check(await sb().from("invites").delete().eq("id", id));
  },
  async deleteAll() {
    // responses and response_guests cascade from invites
    check(await sb().from("invites").delete().not("id", "is", null));
  },
  async markInvited(ids, at) {
    if (ids.length) check(await sb().from("invites").update({ invited_at: at }).in("id", ids));
  },
  async listResponses() {
    return (check(await sb().from("responses").select(RESPONSE_SELECT)) as unknown as ResponseRow[]).map(toResponse);
  },
  async getResponse(inviteId) {
    const row = check(await sb().from("responses").select(RESPONSE_SELECT).eq("invite_id", inviteId).maybeSingle()) as unknown as ResponseRow | null;
    return row ? toResponse(row) : null;
  },
  async saveResponse(inviteId, data) {
    const at = now();
    const row = check(
      await sb()
        .from("responses")
        .upsert(
          { invite_id: inviteId, attending: data.attending, guest_count: data.guest_count, contact_email: data.contact_email, updated_at: at },
          { onConflict: "invite_id" },
        )
        .select("id")
        .single(),
    ) as { id: string };
    check(await sb().from("response_guests").delete().eq("response_id", row.id));
    if (data.guests.length) check(await sb().from("response_guests").insert(data.guests.map((x) => ({ ...x, response_id: row.id }))));
    return (await this.getResponse(inviteId))!;
  },
};

const db: Backend = usingDatabase ? supabase : memory;

// ---------------------------------------------------------------- public API

export const listInvites = () => db.listInvites();
export const getInviteByToken = (token: string) => db.getInviteByToken(token);
export const getInvite = (id: string) => db.getInvite(id);
export const createInvite = (input: InviteInput) => db.createInvite(input);
export const updateInvite = (id: string, input: InviteInput) => db.updateInvite(id, input);
export const deleteInvite = (id: string) => db.deleteInvite(id);
export const markInvited = (ids: string[]) => db.markInvited(ids, now());
export const deleteAllGuestData = () => db.deleteAll();
export const listResponses = () => db.listResponses();
export const getResponse = (inviteId: string) => db.getResponse(inviteId);
export const saveResponse: Backend["saveResponse"] = (inviteId, data) => db.saveResponse(inviteId, data);

/** Every surname a party answers to ("Jovanović" for "Ana & Petar Jovanović"), normalised. */
function surnamesFor(invite: Invite): string[] {
  return [...new Set(namesFor(invite).map((n) => n.split(" ").slice(1).join(" ")))];
}

/**
 * Exact matches only: the last name (accents and spacing ignored) and the last 4 digits of the phone
 * number on the invitation must both match, so the list can't be browsed. A party with no phone
 * number on file can't be found this way.
 */
export async function findInvitesByLastName(last: string, phoneLast4: string): Promise<Invite[]> {
  const surname = normalizeName(last);
  if (!surname || !/^[0-9]{4}$/.test(phoneLast4)) return [];
  return (await db.listInvites()).filter((inv) => inv.phone_last4 === phoneLast4 && surnamesFor(inv).includes(surname));
}
