"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { findInvitation } from "@/app/actions";

/**
 * Where the QR code on the printed invitation lands: the guest types their first and last name,
 * and is taken to their own invitation, exactly as an emailed link would.
 */
export function RsvpFinder() {
  const uid = useId();
  const router = useRouter();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [honey, setHoney] = useState("");
  const [options, setOptions] = useState<{ token: string; party_name: string }[] | null>(null);
  const [errors, setErrors] = useState<{ first?: string; last?: string }>({});
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);

  function open(token: string) {
    start(() => router.push(`/rsvp/${token}#rsvp`));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!first.trim()) errs.first = "Please enter your first name.";
    if (!last.trim()) errs.last = "Please enter your last name.";
    setErrors(errs);
    setMessage("");
    if (errs.first) return firstRef.current?.focus();
    if (errs.last) return lastRef.current?.focus();
    start(async () => {
      try {
        const res = await findInvitation({ first, last, website: honey });
        if (res.status === "one") return open(res.token);
        if (res.status === "many") return setOptions(res.options);
        if (res.status === "limited") return setMessage("Too many searches in a short time. Please wait a minute and try again.");
        setMessage("We couldn't find an invitation under that name. Please check the spelling and use the name on your invitation, or contact Linda and Marko.");
      } catch {
        setMessage("We couldn't reach the guest list just now. Please try again in a moment.");
      }
    });
  }

  if (options) {
    return (
      <div className="step-enter grid gap-6">
        <div>
          <h3 className="step-heading">Which invitation is yours?</h3>
          <p className="step-note">More than one invitation matches that name.</p>
        </div>
        <div className="choice-group">
          {options.map((o) => (
            <button key={o.token} type="button" className="choice" onClick={() => open(o.token)} disabled={pending}>
              {o.party_name}
            </button>
          ))}
        </div>
        <div className="text-center">
          <button type="button" className="btn-quiet" onClick={() => setOptions(null)}>
            Search again
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="step-enter grid gap-6" aria-busy={pending}>
      <div>
        <h3 className="step-heading">Find your invitation</h3>
        <p className="step-note">Enter your name as it appears on your invitation.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="field">
          <label className="field-label" htmlFor={`${uid}-first`}>
            First name
          </label>
          <input
            ref={firstRef}
            id={`${uid}-first`}
            className="input"
            autoComplete="given-name"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            aria-invalid={errors.first ? true : undefined}
            aria-describedby={errors.first ? `${uid}-first-err` : undefined}
          />
          {errors.first && (
            <p className="field-error" id={`${uid}-first-err`}>
              {errors.first}
            </p>
          )}
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${uid}-last`}>
            Last name
          </label>
          <input
            ref={lastRef}
            id={`${uid}-last`}
            className="input"
            autoComplete="family-name"
            value={last}
            onChange={(e) => setLast(e.target.value)}
            aria-invalid={errors.last ? true : undefined}
            aria-describedby={errors.last ? `${uid}-last-err` : undefined}
          />
          {errors.last && (
            <p className="field-error" id={`${uid}-last-err`}>
              {errors.last}
            </p>
          )}
        </div>
      </div>
      <div className="honeypot" aria-hidden="true">
        <label>
          Leave this empty
          <input tabIndex={-1} autoComplete="off" value={honey} onChange={(e) => setHoney(e.target.value)} name="website" />
        </label>
      </div>
      <div className="text-center">
        <button className="btn" type="submit" disabled={pending} aria-busy={pending}>
          {pending ? "Finding…" : "Find my invitation"}
        </button>
      </div>
      <div role="status" aria-live="polite" className="live-region">
        {message && (
          <p className="notice" data-tone="error">
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
