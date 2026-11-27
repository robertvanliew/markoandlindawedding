"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { deleteEverything, importCsv, logout, removeInvite, saveInvite, sendInvites, sendTestInvite, type SendResult } from "@/app/admin/actions";
import { MEALS } from "@/lib/wedding";

export type Row = {
  id: string;
  party_name: string;
  aliases: string[];
  email: string | null;
  max_guests: number;
  invited_at: string | null;
  link: string;
  status: "pending" | "attending" | "declined";
  guests: { full_name: string; meal: string; dietary_notes: string | null }[];
  contact_email: string | null;
  updated_at: string | null;
};

type Filter = "all" | "pending" | "attending" | "declined" | "unsent";
type Draft = { id: string | null; party_name: string; aliases: string; email: string; max_guests: number };

const STATUS_LABEL = { pending: "Awaiting reply", attending: "Attending", declined: "Declined" } as const;
const mealLabel = (m: string) => MEALS.find((x) => x.value === m)?.label ?? m;
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Toronto" }) : "";

export function AdminDashboard({ rows, usingDatabase, emailReady }: { rows: Row[]; usingDatabase: boolean; emailReady: boolean }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftError, setDraftError] = useState("");
  const [note, setNote] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [testTo, setTestTo] = useState("");
  const [pending, start] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const totals = useMemo(() => {
    const t = { parties: rows.length, seats: 0, replied: 0, attending: 0, declined: 0, pending: 0, unsent: 0, meals: {} as Record<string, number> };
    for (const r of rows) {
      t.seats += r.max_guests;
      if (!r.invited_at) t.unsent++;
      if (r.status === "pending") t.pending++;
      else {
        t.replied++;
        if (r.status === "declined") t.declined++;
        for (const g of r.guests) {
          t.attending++;
          t.meals[g.meal] = (t.meals[g.meal] ?? 0) + 1;
        }
      }
    }
    return t;
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "unsent" ? !!r.invited_at : filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return [r.party_name, r.email ?? "", ...r.aliases, ...r.guests.map((g) => g.full_name)].some((s) => s.toLowerCase().includes(q));
    });
  }, [rows, query, filter]);

  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function openDraft(row?: Row) {
    setDraftError("");
    setDraft(
      row
        ? { id: row.id, party_name: row.party_name, aliases: row.aliases.join("; "), email: row.email ?? "", max_guests: row.max_guests }
        : { id: null, party_name: "", aliases: "", email: "", max_guests: 2 },
    );
    requestAnimationFrame(() => dialogRef.current?.showModal());
  }

  function closeDraft() {
    dialogRef.current?.close();
    setDraft(null);
  }

  function submitDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    start(async () => {
      const res = await saveInvite(draft.id, draft);
      if (!res.ok) return setDraftError(res.error);
      closeDraft();
      setNote({ tone: "info", text: draft.id ? `Saved ${draft.party_name}.` : `Added ${draft.party_name} to the guest list.` });
    });
  }

  function remove(row: Row) {
    if (!confirm(`Remove ${row.party_name} from the guest list? Their reply will be deleted too.`)) return;
    start(async () => {
      await removeInvite(row.id);
      setSelected((s) => {
        const n = new Set(s);
        n.delete(row.id);
        return n;
      });
      setNote({ tone: "info", text: `Removed ${row.party_name}.` });
    });
  }

  function sendTest(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await sendTestInvite(testTo);
      setNote(res.ok ? { tone: "info", text: `Test invitation sent to ${testTo.trim()}. It can take a minute to arrive; check spam too.` } : { tone: "error", text: res.error });
    });
  }

  function wipe() {
    const typed = prompt(
      "This permanently deletes every invitation, email address and reply. Export the attending list first if you still need it.\n\nType DELETE to confirm.",
    );
    if (typed == null) return;
    start(async () => {
      const res = await deleteEverything(typed);
      if (!res.ok) return setNote({ tone: "error", text: res.error });
      setSelected(new Set());
      setNote({ tone: "info", text: "All guest information has been deleted." });
    });
  }

  function send(ids: string[], what: string) {
    if (!ids.length) return setNote({ tone: "error", text: "Choose at least one party first." });
    if (!confirm(`Send the invitation email to ${what}?`)) return;
    start(async () => {
      const res: SendResult = await sendInvites(ids);
      if (!res.ok) return setNote({ tone: "error", text: res.error });
      const parts = [`Sent ${res.sent} invitation${res.sent === 1 ? "" : "s"}.`];
      if (res.skipped.length) parts.push(`Skipped: ${res.skipped.join(", ")}.`);
      if (res.failed.length) parts.push(`Couldn't send: ${res.failed.join("; ")}.`);
      setNote({ tone: res.failed.length ? "error" : "info", text: parts.join(" ") });
      setSelected(new Set());
    });
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    start(async () => {
      const res = await importCsv(text);
      if (!res.ok) return setNote({ tone: "error", text: res.error });
      const extra = res.skipped.length ? ` Skipped ${res.skipped.length}: ${res.skipped.slice(0, 4).join("; ")}${res.skipped.length > 4 ? "…" : ""}` : "";
      setNote({ tone: res.skipped.length ? "error" : "info", text: `Added ${res.added} ${res.added === 1 ? "party" : "parties"} from ${file.name}.${extra}` });
    });
  }

  async function copy(row: Row) {
    try {
      await navigator.clipboard.writeText(row.link);
      setCopied(row.id);
      setTimeout(() => setCopied((c) => (c === row.id ? null : c)), 1800);
    } catch {
      prompt("Copy this RSVP link:", row.link);
    }
  }

  const unsentIds = rows.filter((r) => !r.invited_at && r.email).map((r) => r.id);

  return (
    <main className="admin" aria-busy={pending}>
      <header className="admin-head">
        <div>
          <p className="script admin-mark">Linda &amp; Marko</p>
          <h1 className="admin-title">Guest list</h1>
        </div>
        <div className="admin-head-actions">
          <a className="btn btn-sm btn-ghost" href="/admin/email-preview" target="_blank" rel="noopener">
            Preview email
          </a>
          <a className="btn btn-sm btn-ghost" href="/admin/print" target="_blank" rel="noopener">
            Printable invitation
          </a>
          <form action={logout}>
            <button className="btn-quiet" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {(!usingDatabase || !emailReady) && (
        <div className="admin-banners">
          {!usingDatabase && (
            <p className="notice" data-tone="error">
              Test mode: this list is sample data kept in memory and resets when the site restarts. Connect Supabase before adding the real guest list.
            </p>
          )}
          {!emailReady && <p className="notice">Invitation emails are switched off until the Gmail settings (GMAIL_USER, GMAIL_APP_PASSWORD) are added. You can still preview the email and copy each party&apos;s RSVP link.</p>}
        </div>
      )}

      <section className="admin-stats" aria-label="Summary">
        <div className="admin-stat"><span>{totals.parties}</span>Invited parties</div>
        <div className="admin-stat"><span>{totals.seats}</span>Seats reserved</div>
        <div className="admin-stat"><span>{totals.attending}</span>Guests attending</div>
        <div className="admin-stat"><span>{totals.declined}</span>Parties declined</div>
        <div className="admin-stat"><span>{totals.pending}</span>Awaiting reply</div>
        <div className="admin-stat admin-stat--meals">
          <span className="admin-meals">
            {MEALS.map((m) => (
              <em key={m.value}>
                {m.label} <b>{totals.meals[m.value] ?? 0}</b>
              </em>
            ))}
          </span>
          Meals
        </div>
      </section>

      <section className="admin-toolbar" aria-label="Guest list tools">
        <input className="input admin-search" type="search" placeholder="Search names or emails" aria-label="Search guests" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="input admin-filter" aria-label="Show" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
          <option value="all">Everyone ({rows.length})</option>
          <option value="pending">Awaiting reply ({totals.pending})</option>
          <option value="attending">Attending ({rows.filter((r) => r.status === "attending").length})</option>
          <option value="declined">Declined ({totals.declined})</option>
          <option value="unsent">Invitation not sent ({totals.unsent})</option>
        </select>
        <div className="admin-toolbar-actions">
          <button className="btn btn-sm" type="button" onClick={() => openDraft()}>
            Add guest
          </button>
          <button className="btn btn-sm btn-ghost" type="button" onClick={() => fileRef.current?.click()}>
            Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onImport} />
          <a className="btn btn-sm btn-ghost" href="/admin/export?type=attending">
            Export attending
          </a>
          <a className="btn btn-sm btn-ghost" href="/admin/export?type=pending">
            Export not replied
          </a>
        </div>
      </section>

      <form className="admin-test" onSubmit={sendTest} aria-label="Send a test invitation">
        <div>
          <h2>See what guests receive</h2>
          <p>Send yourself a test invitation. Nothing is marked as sent.</p>
        </div>
        <div className="admin-test-row">
          <label className="sr-only" htmlFor="test-to">
            Your email
          </label>
          <input id="test-to" className="input" type="email" placeholder="Your email" value={testTo} onChange={(e) => setTestTo(e.target.value)} required />
          <button className="btn btn-sm" type="submit" disabled={pending}>
            Send me a test
          </button>
          <a className="btn btn-sm btn-ghost" href="/admin/email-preview" target="_blank" rel="noopener">
            Preview
          </a>
        </div>
      </form>

      <section className="admin-send" aria-label="Send invitations">
        <p>
          {selected.size ? `${selected.size} selected` : "Select parties to email their invitation, or"}{" "}
        </p>
        <button className="btn btn-sm" type="button" disabled={!selected.size || pending} onClick={() => send([...selected], `${selected.size} selected ${selected.size === 1 ? "party" : "parties"}`)}>
          Send to selected
        </button>
        <button className="btn btn-sm btn-ghost" type="button" disabled={!unsentIds.length || pending} onClick={() => send(unsentIds, `all ${unsentIds.length} parties not yet invited`)}>
          Send to everyone not yet invited ({unsentIds.length})
        </button>
      </section>

      <div role="status" aria-live="polite" className="live-region">
        {note && (
          <p className="notice" data-tone={note.tone}>
            {note.text}
          </p>
        )}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col" className="admin-check">
                <input
                  type="checkbox"
                  aria-label="Select all shown"
                  checked={allVisibleSelected}
                  onChange={() =>
                    setSelected((s) => {
                      const n = new Set(s);
                      for (const r of visible) allVisibleSelected ? n.delete(r.id) : n.add(r.id);
                      return n;
                    })
                  }
                />
              </th>
              <th scope="col">Party</th>
              <th scope="col">Seats</th>
              <th scope="col">Invitation</th>
              <th scope="col">Reply</th>
              <th scope="col">Guests &amp; meals</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} data-selected={selected.has(r.id)}>
                <td className="admin-check">
                  <input type="checkbox" aria-label={`Select ${r.party_name}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                </td>
                <td data-label="Party">
                  <strong>{r.party_name}</strong>
                  <small>{r.email ?? "No email"}</small>
                </td>
                <td data-label="Seats">{r.max_guests}</td>
                <td data-label="Invitation">{r.invited_at ? <>Sent {fmtDate(r.invited_at)}</> : <span className="admin-muted">Not sent</span>}</td>
                <td data-label="Reply">
                  <span className="admin-pill" data-status={r.status}>
                    {STATUS_LABEL[r.status]}
                  </span>
                  {r.updated_at && <small>{fmtDate(r.updated_at)}</small>}
                </td>
                <td data-label="Guests & meals">
                  {r.guests.length ? (
                    <ul className="admin-guests">
                      {r.guests.map((g, i) => (
                        <li key={i}>
                          {g.full_name} · <b>{mealLabel(g.meal)}</b>
                          {g.dietary_notes && <small>{g.dietary_notes}</small>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="admin-muted">—</span>
                  )}
                </td>
                <td className="admin-row-actions">
                  <button className="btn-quiet" type="button" onClick={() => copy(r)}>
                    {copied === r.id ? "Copied" : "Copy link"}
                  </button>
                  <button className="btn-quiet" type="button" disabled={!r.email || pending} onClick={() => send([r.id], r.party_name)}>
                    {r.invited_at ? "Resend" : "Send"}
                  </button>
                  <a className="btn-quiet" href={`/admin/email-preview?id=${encodeURIComponent(r.id)}`} target="_blank" rel="noopener">
                    Preview
                  </a>
                  <button className="btn-quiet" type="button" onClick={() => openDraft(r)}>
                    Edit
                  </button>
                  <button className="btn-quiet admin-danger" type="button" onClick={() => remove(r)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={7} className="admin-empty">
                  {rows.length ? "No parties match this search." : "No guests yet. Add a party or import your guest list from a spreadsheet (CSV)."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="admin-help">
        CSV columns: <code>party_name, max_guests, kids_allowed, aliases, email</code>. Aliases are optional other names for the party, separated with semicolons.
      </p>

      <section className="admin-danger-zone" aria-labelledby="danger-title">
        <div>
          <h2 id="danger-title">After the wedding</h2>
          <p>Export your lists, then permanently delete every invitation, email address and reply from the site.</p>
        </div>
        <button className="btn btn-sm admin-danger-btn" type="button" disabled={pending || !rows.length} onClick={wipe}>
          Delete all guest data
        </button>
      </section>

      <dialog ref={dialogRef} className="admin-dialog card" onClose={() => setDraft(null)}>
        {draft && (
          <form onSubmit={submitDraft} className="grid gap-5">
            <h2 className="step-heading">{draft.id ? "Edit party" : "Add a party"}</h2>
            <div className="field">
              <label className="field-label" htmlFor="d-party">
                Party name
              </label>
              <input id="d-party" className="input" value={draft.party_name} onChange={(e) => setDraft({ ...draft, party_name: e.target.value })} placeholder="Ana & Petar Jovanović" required autoFocus />
              <p className="field-hint">
                Write every guest&apos;s first name with the surname, e.g. &quot;Ana &amp; Petar Jovanović&quot;. Guests with a printed invitation find it by typing their own first and last name.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-[1fr_120px]">
              <div className="field">
                <label className="field-label" htmlFor="d-email">
                  Email
                </label>
                <input id="d-email" className="input" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Leave empty for printed invitations" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="d-seats">
                  Seats
                </label>
                <input id="d-seats" className="input" type="number" min={1} max={20} value={draft.max_guests} onChange={(e) => setDraft({ ...draft, max_guests: Number(e.target.value) })} required />
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="d-aliases">
                Other names guests might type <span className="admin-muted">(optional)</span>
              </label>
              <input id="d-aliases" className="input" value={draft.aliases} onChange={(e) => setDraft({ ...draft, aliases: e.target.value })} placeholder="e.g. Ana Petrović; Peter Jovanovic" />
            </div>
            {draftError && (
              <p className="notice" data-tone="error" role="alert">
                {draftError}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <button className="btn btn-sm btn-ghost" type="button" onClick={closeDraft}>
                Cancel
              </button>
              <button className="btn btn-sm" type="submit" disabled={pending} aria-busy={pending}>
                {draft.id ? "Save changes" : "Add party"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </main>
  );
}
