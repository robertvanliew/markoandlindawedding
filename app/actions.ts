"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { findInvitesByName, getInviteByToken, getResponse, saveResponse, type Invite } from "@/lib/store";
import { rateLimit } from "@/lib/rate-limit";
import { rsvpOpen, type Meal } from "@/lib/wedding";

export type GuestView = { full_name: string; meal: Meal; dietary_notes: string | null };
export type ResponseView = { attending: boolean; guests: GuestView[]; contact_email: string | null; updated_at: string };
export type InviteView = {
  token: string;
  party_name: string;
  max_guests: number;
  kids_allowed: boolean;
  response: ResponseView | null;
};

async function view(invite: Invite): Promise<InviteView> {
  const r = await getResponse(invite.id);
  return {
    token: invite.token,
    party_name: invite.party_name,
    max_guests: invite.max_guests,
    kids_allowed: invite.kids_allowed,
    response: r ? { attending: r.attending, guests: r.guests, contact_email: r.contact_email, updated_at: r.updated_at } : null,
  };
}

async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

const FindSchema = z.object({
  first: z.string().trim().min(1).max(60),
  last: z.string().trim().min(1).max(60),
  website: z.string().max(0).optional(), // honeypot
});

export type FindResult =
  | { status: "one"; token: string }
  | { status: "many"; options: { token: string; party_name: string }[] }
  | { status: "none" }
  | { status: "invalid" }
  | { status: "limited" };

/** For guests with a printed invitation: find their party by first and last name. */
export async function findInvitation(input: { first: string; last: string; website?: string }): Promise<FindResult> {
  const parsed = FindSchema.safeParse(input);
  if (!parsed.success) return { status: input.website ? "none" : "invalid" };
  if (!rateLimit(`find:${await clientKey()}`, 12, 60_000)) return { status: "limited" };
  const matches = await findInvitesByName(parsed.data.first, parsed.data.last);
  if (matches.length === 0) return { status: "none" };
  if (matches.length === 1) return { status: "one", token: matches[0].token };
  // only the parties matching exactly what was typed; never the wider list
  return { status: "many", options: matches.slice(0, 5).map((m) => ({ token: m.token, party_name: m.party_name })) };
}

export async function loadInvite(token: string): Promise<InviteView | null> {
  if (!/^[a-z0-9]{6,32}$/.test(token)) return null;
  const invite = await getInviteByToken(token);
  return invite ? view(invite) : null;
}

const SubmitSchema = z.object({
  token: z.string().regex(/^[a-z0-9]{6,32}$/),
  attending: z.boolean(),
  guests: z
    .array(
      z.object({
        full_name: z.string().trim().min(1, "Please enter a name").max(80),
        meal: z.enum(["chicken", "beef", "veggie"]),
        dietary_notes: z.string().trim().max(300).optional().default(""),
      }),
    )
    .max(20),
  contact_email: z.union([z.literal(""), z.email()]).optional().default(""),
  website: z.string().max(0).optional(),
});

export type SubmitResult =
  | { ok: true; invite: InviteView }
  | { ok: false; error: "closed" | "invalid" | "limited" | "not_found" | "too_many" };

export async function submitRsvp(input: unknown): Promise<SubmitResult> {
  if (!rsvpOpen()) return { ok: false, error: "closed" };
  const parsed = SubmitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!rateLimit(`submit:${await clientKey()}`, 10, 60_000)) return { ok: false, error: "limited" };

  const data = parsed.data;
  const invite = await getInviteByToken(data.token);
  if (!invite) return { ok: false, error: "not_found" };

  const guests = data.attending ? data.guests : [];
  if (data.attending && guests.length < 1) return { ok: false, error: "invalid" };
  if (guests.length > invite.max_guests) return { ok: false, error: "too_many" };

  await saveResponse(invite.id, {
    attending: data.attending,
    guest_count: guests.length,
    contact_email: data.contact_email || null,
    guests: guests.map((g) => ({ full_name: g.full_name, meal: g.meal, dietary_notes: g.dietary_notes || null })),
  });
  // TODO(confirm): confirmation email via Resend when RESEND_API_KEY and an address are provided.
  return { ok: true, invite: await view(invite) };
}
