import "server-only";
import type { Meal } from "./wedding";

// In-memory invite store seeded with test data.
// TODO(supabase): replace these functions with Supabase queries using the service role key
// (schema in supabase/migrations/0001_init.sql). The function signatures are the seam.

export type Invite = {
  id: string;
  token: string;
  party_name: string;
  aliases: string[];
  email: string | null;
  max_guests: number;
  kids_allowed: boolean;
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

// Test invites (brief §7): single, couple, family with kids, two parties sharing a name,
// and Serbian diacritics (Đorđević must also match "Djordjevic").
const SEED: Invite[] = [
  { id: "inv-1", token: "k7m2q9xw", party_name: "Jelena Marković", aliases: [], email: null, max_guests: 1, kids_allowed: false },
  { id: "inv-2", token: "p4t8z3va", party_name: "Ana & Petar Jovanović", aliases: [], email: null, max_guests: 2, kids_allowed: false },
  { id: "inv-3", token: "d9r5w1hn", party_name: "The Đorđević Family", aliases: ["Dragan Đorđević", "Mira Đorđević"], email: null, max_guests: 5, kids_allowed: true },
  { id: "inv-4", token: "m3n6c8ye", party_name: "Milan & Vesna Nikolić", aliases: [], email: null, max_guests: 2, kids_allowed: false },
  { id: "inv-5", token: "s2f7j4ub", party_name: "Milan Nikolić", aliases: [], email: null, max_guests: 1, kids_allowed: false },
];

type Db = { invites: Invite[]; responses: Map<string, RsvpResponse> };
const g = globalThis as unknown as { __weddingDb?: Db };
const db: Db = (g.__weddingDb ??= { invites: SEED, responses: new Map() });

/** Lowercase, strip accents and punctuation; đ → dj so "Đorđević" matches "Djordjevic". */
export function normalizeName(s: string) {
  return s
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every full name an invite answers to: each first name in the party with the surname, plus aliases. */
function namesFor(invite: Invite): string[] {
  const names = new Set(invite.aliases.map(normalizeName));
  const party = invite.party_name.replace(/^the\s+/i, "").replace(/\s+family$/i, "");
  const people = party.split(/\s*(?:&|\band\b)\s*/i);
  const surname = people[people.length - 1].trim().split(/\s+/).slice(1).join(" ");
  for (const person of people) {
    const parts = person.trim().split(/\s+/);
    names.add(normalizeName(parts.length > 1 ? parts.join(" ") : `${parts[0]} ${surname}`));
  }
  return [...names];
}

export async function findInvitesByName(first: string, last: string): Promise<Invite[]> {
  const query = normalizeName(`${first} ${last}`);
  if (!query.includes(" ")) return [];
  return db.invites.filter((inv) => namesFor(inv).includes(query));
}

export async function getInviteByToken(token: string): Promise<Invite | null> {
  return db.invites.find((i) => i.token === token) ?? null;
}

export async function getResponse(inviteId: string): Promise<RsvpResponse | null> {
  return db.responses.get(inviteId) ?? null;
}

export async function saveResponse(
  inviteId: string,
  data: Omit<RsvpResponse, "invite_id" | "submitted_at" | "updated_at">,
): Promise<RsvpResponse> {
  const now = new Date().toISOString();
  const prev = db.responses.get(inviteId);
  const saved: RsvpResponse = { ...data, invite_id: inviteId, submitted_at: prev?.submitted_at ?? now, updated_at: now };
  db.responses.set(inviteId, saved);
  return saved;
}
