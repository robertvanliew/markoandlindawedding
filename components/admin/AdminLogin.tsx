"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export function AdminLogin({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <main className="admin-login">
      <form action={action} className="card admin-login-card">
        <p className="script admin-mark">Linda &amp; Marko</p>
        <h1 className="admin-title">Guest list</h1>
        {configured ? (
          <>
            <div className="field">
              <label className="field-label" htmlFor="admin-password">
                Password
              </label>
              <input id="admin-password" name="password" type="password" className="input" autoComplete="current-password" required autoFocus />
            </div>
            <div role="status" aria-live="polite" className="live-region">
              {state?.error && (
                <p className="notice" data-tone="error">
                  {state.error}
                </p>
              )}
            </div>
            <button className="btn" type="submit" disabled={pending} aria-busy={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </>
        ) : (
          <p className="notice">The guest list is locked until an admin password is set (ADMIN_PASSWORD, at least 8 characters).</p>
        )}
      </form>
    </main>
  );
}
