"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { findInvitation } from "@/app/actions";

/**
 * How guests reply from the website (the home page and the printed invitation's QR code): they type
 * their last name and the last 4 digits of their phone number, and are taken to their own invitation,
 * exactly as an emailed link would.
 */
export function RsvpFinder() {
  const uid = useId();
  const router = useRouter();
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [honey, setHoney] = useState("");
  const [options, setOptions] = useState<{ token: string; party_name: string }[] | null>(null);
  const [errors, setErrors] = useState<{ last?: string; phone?: string }>({});
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const lastRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  function open(token: string) {
    start(() => router.push(`/rsvp/${token}#rsvp`));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!last.trim()) errs.last = "Please enter your last name.";
    if (!/^[0-9]{4}$/.test(phone)) errs.phone = "Please enter the last 4 digits of your phone number.";
    setErrors(errs);
    setMessage("");
    if (errs.last) return lastRef.current?.focus();
    if (errs.phone) return phoneRef.current?.focus();
    start(async () => {
      try {
        const res = await findInvitation({ last, phone, website: honey });
        if (res.status === "one") return open(res.token);
        if (res.status === "many") return setOptions(res.options);
        if (res.status === "limited") return setMessage("Too many searches in a short time. Please wait a minute and try again.");
        setMessage("We couldn't find an invitation with that last name and phone number. Please check both and try again, or contact Linda and Marko.");
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
          <p className="step-note">More than one invitation matches.</p>
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
        <p className="step-note">Enter your last name and the last 4 digits of your phone number.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
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
        <div className="field">
          <label className="field-label" htmlFor={`${uid}-phone`}>
            Last 4 digits of your phone
          </label>
          <input
            ref={phoneRef}
            id={`${uid}-phone`}
            className="input"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            placeholder="1234"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? `${uid}-phone-err` : undefined}
          />
          {errors.phone && (
            <p className="field-error" id={`${uid}-phone-err`}>
              {errors.phone}
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
