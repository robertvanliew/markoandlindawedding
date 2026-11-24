"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { lookupInvite, loadInvite, submitRsvp, type InviteView, type SubmitResult } from "@/app/actions";
import { DATE_LABEL, MEALS, RSVP_DEADLINE_LABEL, VENUES, type Meal } from "@/lib/wedding";

type Phase = "find" | "pick" | "answered" | "reply" | "done";
type GuestDraft = { full_name: string; meal: Meal | ""; dietary_notes: string };
type Errors = Record<string, string>;

const SUBMIT_ERRORS: Record<Exclude<SubmitResult, { ok: true }>["error"], string> = {
  closed: "RSVPs are now closed, please contact Linda and Marko directly.",
  invalid: "Something in the form needs another look. Please check each guest and try again.",
  limited: "Too many attempts in a short time. Please wait a minute and try again.",
  not_found: "We couldn't find your invitation any more. Please search for your name again.",
  too_many: "That is more guests than the seats reserved for your party.",
  kids_not_allowed: "The Kids' Meal isn't available for this invitation. Please choose another meal.",
};

const mealLabel = (m: string) => MEALS.find((x) => x.value === m)?.label ?? m;

export function RsvpForm({ initialInvite = null, closed = false }: { initialInvite?: InviteView | null; closed?: boolean }) {
  const uid = useId();
  const [phase, setPhase] = useState<Phase>(initialInvite ? (initialInvite.response ? "answered" : "reply") : "find");
  const [invite, setInvite] = useState<InviteView | null>(initialInvite);
  const [options, setOptions] = useState<{ token: string; party_name: string }[]>([]);
  const [picked, setPicked] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [honey, setHoney] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [guests, setGuests] = useState<GuestDraft[]>([]);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current) headingRef.current?.focus({ preventScroll: false });
    moved.current = true;
  }, [phase]);

  const go = (p: Phase) => {
    setErrors({});
    setMessage(null);
    setPhase(p);
  };

  function openInvite(inv: InviteView) {
    setInvite(inv);
    if (inv.response) return go("answered");
    startReply(inv);
  }

  function startReply(inv: InviteView) {
    const r = inv.response;
    if (r) {
      setAttending(r.attending);
      setGuests(r.guests.map((g) => ({ full_name: g.full_name, meal: g.meal, dietary_notes: g.dietary_notes ?? "" })));
      setEmail(r.contact_email ?? "");
    } else {
      setAttending(null);
      const typed = `${first.trim()} ${last.trim()}`.trim();
      setGuests([{ full_name: typed, meal: "", dietary_notes: "" }]);
    }
    go("reply");
  }

  function setCount(n: number) {
    setGuests((gs) => Array.from({ length: n }, (_, i) => gs[i] ?? { full_name: "", meal: "", dietary_notes: "" }));
  }

  function updateGuest(i: number, patch: Partial<GuestDraft>) {
    setGuests((gs) => gs.map((g, j) => (j === i ? { ...g, ...patch } : g)));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[`g${i}-${k}`];
      return next;
    });
  }

  function focusFirstError(errs: Errors) {
    const first = Object.keys(errs)[0];
    if (first) requestAnimationFrame(() => document.getElementById(`${uid}-${first}`)?.focus());
  }

  function onFind(e: React.FormEvent) {
    e.preventDefault();
    const errs: Errors = {};
    if (!first.trim()) errs.first = "Please enter your first name.";
    if (!last.trim()) errs.last = "Please enter your last name.";
    setErrors(errs);
    setMessage(null);
    if (Object.keys(errs).length) return focusFirstError(errs);

    startTransition(async () => {
      try {
        const res = await lookupInvite({ first, last, website: honey });
        if (res.status === "one") openInvite(res.invite);
        else if (res.status === "many") {
          setOptions(res.options);
          setPicked("");
          go("pick");
        } else if (res.status === "limited") {
          setMessage({ tone: "error", text: "Too many searches in a short time. Please wait a minute and try again." });
        } else {
          setMessage({
            tone: "error",
            text: "We couldn't find an invitation under that name. Please check the spelling, try the name on your invitation, or contact Linda and Marko.",
          });
        }
      } catch {
        setMessage({ tone: "error", text: "We couldn't reach the guest list just now. Please try again in a moment." });
      }
    });
  }

  function onPick(e: React.FormEvent) {
    e.preventDefault();
    if (!picked) {
      setErrors({ pick: "Please choose your party." });
      return focusFirstError({ pick: "x" });
    }
    startTransition(async () => {
      const inv = await loadInvite(picked).catch(() => null);
      if (inv) openInvite(inv);
      else setMessage({ tone: "error", text: "We couldn't open that invitation. Please try again." });
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invite) return;
    const errs: Errors = {};
    if (attending === null) errs.attending = "Please let us know if you will be attending.";
    if (attending) {
      guests.forEach((g, i) => {
        if (!g.full_name.trim()) errs[`g${i}-full_name`] = "Please enter this guest's name.";
        if (!g.meal) errs[`g${i}-meal`] = "Please choose a meal.";
      });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "That email address doesn't look right.";
    setErrors(errs);
    setMessage(null);
    if (Object.keys(errs).length) {
      setMessage({ tone: "error", text: "A few answers still need attention. They're marked below." });
      return focusFirstError(errs);
    }

    startTransition(async () => {
      try {
        const res = await submitRsvp({
          token: invite.token,
          attending,
          guests: attending ? guests.map((g) => ({ ...g, meal: g.meal })) : [],
          contact_email: email,
          website: honey,
        });
        if (res.ok) {
          setInvite(res.invite);
          go("done");
        } else {
          setMessage({ tone: "error", text: SUBMIT_ERRORS[res.error] });
        }
      } catch {
        setMessage({ tone: "error", text: "Your reply didn't send. Please check your connection and try again." });
      }
    });
  }

  const err = (k: string) =>
    errors[k] ? (
      <p className="field-error" id={`${uid}-${k}-err`}>
        {errors[k]}
      </p>
    ) : null;
  const errProps = (k: string) => ({
    id: `${uid}-${k}`,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${uid}-${k}-err` : undefined,
  });

  const live = (
    <div aria-live="polite" role="status">
      {message && (
        <p className="notice mt-6" data-tone={message.tone}>
          {message.text}
        </p>
      )}
    </div>
  );

  const heading = (text: React.ReactNode, script = false) => (
    <h3 ref={headingRef} tabIndex={-1} className={`step-heading${script ? " script" : ""}`} style={{ outline: "none" }}>
      {text}
    </h3>
  );

  const honeypot = (
    <div className="honeypot" aria-hidden="true">
      <label>
        Leave this empty
        <input tabIndex={-1} autoComplete="off" value={honey} onChange={(e) => setHoney(e.target.value)} name="website" />
      </label>
    </div>
  );

  // ---------- Closed ----------
  if (closed && phase !== "answered") {
    return (
      <div className="step-enter">
        {heading("RSVPs are now closed")}
        <p className="step-note">Please contact Linda and Marko directly.</p>
      </div>
    );
  }

  // ---------- Step 0: find your invitation ----------
  if (phase === "find") {
    return (
      <form onSubmit={onFind} noValidate className="step-enter grid gap-6" aria-busy={pending}>
        <div>
          {heading("Find your invitation")}
          <p className="step-note">Enter your name as it appears on your invitation.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="field">
            <label className="field-label" htmlFor={`${uid}-first`}>
              First name
            </label>
            <input className="input" {...errProps("first")} autoComplete="given-name" value={first} onChange={(e) => setFirst(e.target.value)} />
            {err("first")}
          </div>
          <div className="field">
            <label className="field-label" htmlFor={`${uid}-last`}>
              Last name
            </label>
            <input className="input" {...errProps("last")} autoComplete="family-name" value={last} onChange={(e) => setLast(e.target.value)} />
            {err("last")}
          </div>
        </div>
        {honeypot}
        <div className="text-center">
          <button className="btn" type="submit" aria-busy={pending} disabled={pending}>
            {pending ? "Searching…" : "Find my invitation"}
          </button>
        </div>
        {live}
      </form>
    );
  }

  // ---------- Several parties share the name ----------
  if (phase === "pick") {
    return (
      <form onSubmit={onPick} noValidate className="step-enter grid gap-6">
        <div>
          {heading("Which invitation is yours?")}
          <p className="step-note">More than one invitation matches that name.</p>
        </div>
        <fieldset className="choice-group" aria-describedby={errors.pick ? `${uid}-pick-err` : undefined}>
          <legend className="sr-only">Choose your party</legend>
          {options.map((o, i) => (
            <label key={o.token} className="choice">
              <input
                type="radio"
                name="party"
                value={o.token}
                id={i === 0 ? `${uid}-pick` : undefined}
                checked={picked === o.token}
                onChange={() => setPicked(o.token)}
              />
              {o.party_name}
            </label>
          ))}
        </fieldset>
        {err("pick")}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <button className="btn" type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Opening…" : "Continue"}
          </button>
          <button className="btn-quiet" type="button" onClick={() => go("find")}>
            Search again
          </button>
        </div>
        {live}
      </form>
    );
  }

  if (!invite) return null;

  // ---------- Already answered / confirmation ----------
  if (phase === "answered" || phase === "done") {
    const r = invite.response;
    const yes = r?.attending;
    return (
      <div className="step-enter grid gap-8">
        <div>
          {phase === "done"
            ? heading(yes ? "Thank you, we can't wait to celebrate with you" : "Thank you for letting us know")
            : heading(`Welcome back, ${invite.party_name}`)}
          <p className="step-note">
            {phase === "done"
              ? yes
                ? "Your reply has been received."
                : "You will be missed. Thank you for your warm wishes."
              : yes
                ? "We have your reply."
                : "We have your reply: regretfully declines."}
          </p>
        </div>

        {yes && r && (
          <ul className="summary-list" aria-label="Your reply">
            {r.guests.map((g, i) => (
              <li key={i}>
                <p className="text-xl">{g.full_name}</p>
                <p className="meal">{mealLabel(g.meal)}</p>
                {g.dietary_notes && <p>{g.dietary_notes}</p>}
              </li>
            ))}
          </ul>
        )}

        {yes && (
          <div className="grid gap-6 text-center sm:grid-cols-2">
            {(["ceremony", "reception"] as const).map((k) => (
              <div key={k}>
                <p className="field-label">{VENUES[k].label}</p>
                <p className="mt-1">
                  {DATE_LABEL}, {VENUES[k].time}
                </p>
                <p>{VENUES[k].name}</p>
                <a className="btn-quiet" href={`/calendar/${k}.ics`} download>
                  Add to calendar
                </a>
              </div>
            ))}
          </div>
        )}

        {closed ? (
          <p className="notice">RSVPs are now closed, please contact Linda and Marko directly.</p>
        ) : (
          <div className="grid justify-items-center gap-2 text-center">
            <p>You can change your reply until {RSVP_DEADLINE_LABEL}.</p>
            <button className="btn-quiet" type="button" onClick={() => startReply(invite)}>
              Change my reply
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---------- Steps 1–4: the reply ----------
  const seats = invite.max_guests;
  const meals = MEALS.filter((m) => m.value !== "kids" || invite.kids_allowed);

  return (
    <form onSubmit={onSubmit} noValidate className="step-enter grid gap-8" aria-busy={pending}>
      <div>{heading(invite.party_name, true)}</div>

      <fieldset className="grid gap-4" aria-describedby={errors.attending ? `${uid}-attending-err` : undefined}>
        <legend className="step-heading mb-4 w-full">Will you be attending?</legend>
        <div className="choice-group sm:grid-cols-2">
          <label className="choice">
            <input
              type="radio"
              name="attending"
              id={`${uid}-attending`}
              checked={attending === true}
              onChange={() => {
                setAttending(true);
                if (guests.length === 0) setCount(1);
                setErrors(({ attending: _a, ...rest }) => rest);
              }}
            />
            <span className="choice-answer">Joyfully accepts</span>
          </label>
          <label className="choice">
            <input
              type="radio"
              name="attending"
              checked={attending === false}
              onChange={() => {
                setAttending(false);
                setErrors(({ attending: _a, ...rest }) => rest);
              }}
            />
            <span className="choice-answer">Regretfully declines</span>
          </label>
        </div>
        {err("attending")}
      </fieldset>

      {attending && (
        <div className="step-enter grid gap-8">
          <fieldset className="grid gap-4">
            <legend className="step-heading mb-2 w-full">How many guests will be attending?</legend>
            <p className="step-note mt-0 mb-2">
              We have reserved {seats} {seats === 1 ? "seat" : "seats"} in your honour.
            </p>
            {seats > 1 ? (
              <div className="count-group">
                {Array.from({ length: seats }, (_, i) => i + 1).map((n) => (
                  <label key={n} className="choice">
                    <input type="radio" name="count" checked={guests.length === n} onChange={() => setCount(n)} aria-label={`${n} ${n === 1 ? "guest" : "guests"}`} />
                    {n}
                  </label>
                ))}
              </div>
            ) : null}
          </fieldset>

          {guests.map((g, i) => (
            <fieldset key={i} className="guest-row">
              <legend>{guests.length > 1 ? `Guest ${i + 1}` : "Your details"}</legend>
              <div className="field">
                <label className="field-label" htmlFor={`${uid}-g${i}-full_name`}>
                  Full name
                </label>
                <input
                  className="input"
                  {...errProps(`g${i}-full_name`)}
                  autoComplete={i === 0 ? "name" : "off"}
                  value={g.full_name}
                  onChange={(e) => updateGuest(i, { full_name: e.target.value })}
                />
                {err(`g${i}-full_name`)}
              </div>
              <fieldset className="field" aria-describedby={errors[`g${i}-meal`] ? `${uid}-g${i}-meal-err` : undefined}>
                <legend className="field-label mb-1.5">Meal</legend>
                <div className="meal-group">
                  {meals.map((m, j) => (
                    <label key={m.value} className="choice">
                      <input
                        type="radio"
                        name={`meal-${i}`}
                        id={j === 0 ? `${uid}-g${i}-meal` : undefined}
                        checked={g.meal === m.value}
                        onChange={() => updateGuest(i, { meal: m.value })}
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
                {err(`g${i}-meal`)}
              </fieldset>
              <div className="field">
                <label className="field-label" htmlFor={`${uid}-g${i}-diet`}>
                  Any allergies or dietary restrictions?
                </label>
                <input
                  className="input"
                  id={`${uid}-g${i}-diet`}
                  value={g.dietary_notes}
                  onChange={(e) => updateGuest(i, { dietary_notes: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </fieldset>
          ))}
        </div>
      )}

      {attending !== null && (
        <div className="field step-enter">
          <label className="field-label" htmlFor={`${uid}-email`}>
            Email for a copy of your reply
          </label>
          <input
            className="input"
            type="email"
            {...errProps("email")}
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors(({ email: _e, ...rest }) => rest);
            }}
            placeholder="Optional"
          />
          {err("email")}
        </div>
      )}

      {honeypot}

      <div className="grid justify-items-center gap-3">
        <button className="btn" type="submit" disabled={pending} aria-busy={pending}>
          {pending ? "Sending…" : attending === false ? "Send our reply" : "Send RSVP"}
        </button>
        {!initialInvite && (
          <button className="btn-quiet" type="button" onClick={() => go("find")}>
            Not you? Search again
          </button>
        )}
      </div>
      {live}
    </form>
  );
}
