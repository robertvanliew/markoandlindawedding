import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// One shared admin password (ADMIN_PASSWORD). Signing in sets an httpOnly cookie holding an HMAC of
// the password, so changing the password signs everyone out.

const COOKIE = "lm_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const password = () => process.env.ADMIN_PASSWORD ?? "";
export const adminConfigured = () => password().length >= 8;

function token() {
  return createHmac("sha256", password()).update("linda-marko-admin-v1").digest("hex");
}

function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const value = (await cookies()).get(COOKIE)?.value ?? "";
  return same(value, token());
}

export async function signIn(attempt: string) {
  if (!adminConfigured() || !same(attempt, password())) return false;
  (await cookies()).set(COOKIE, token(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return true;
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not signed in");
}
