# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, `next/font`, `next/image`. Supabase (Postgres) accessed only from server actions / route handlers with the service role key (RLS on, no public policies). Zod validation on every submission. Hosted on Vercel. Optional Resend for confirmation and notification emails. Set by the developer in `PROJECT_BRIEF.md`; follows the thevanschatz.com reference build (same developer), whose patterns should be reused if that repo becomes available.

## Users

- **Invited guests** (primary): open the site, usually from a text message on a phone, to check the wedding details and RSVP for their party. Age mix is unconfirmed; treat the audience as possibly including older relatives (see Accessibility).
- **Linda & Marko** (the couple, non-technical): view responses, manage the invite list, copy personal RSVP links and export CSVs from a password-gated admin page.

## Product Purpose

A private wedding website for Linda Todorovski & Marko Pupavac that presents the wedding details exactly as on the printed invitation and collects RSVPs limited to the number of seats each party was invited for. Success: every invited party can find their invitation and respond in a minute or two on a phone, no party can RSVP for more seats than reserved, and the couple can see accurate attendance and meal counts without help.

## Positioning

It is the printed invitation brought to life, not a wedding template: the same wording, the same quiet formality, plus an RSVP that enforces each party's seat cap on the server (the bride's core concern: a family of five invited as two can only respond for two).

## Operating Context

- Guests arrive via a generic link or a personal link (`/rsvp/[token]`) that skips the name lookup and greets the party by name.
- RSVP flow: find invitation by name (with alias and diacritic-insensitive matching, e.g. Đorđević = Djordjevic) → attending yes/no → guest count (1 to `max_guests`) → one meal per guest → optional dietary note per guest → confirmation with calendar links. Answers stay editable until the deadline.
- The couple works from `/admin` (not linked, `noindex`): totals, filterable table, CSV export of attending guests and of non-responders, invite CRUD, CSV import of the guest list.
- Wedding facts (verbatim, from the brief): Saturday, May 15th, 2027. Church ceremony 1:00 PM, St. Sava Serbian Orthodox Church, 1375 Blundell Rd., Mississauga, ON. Reception 5:30 PM, Château Le Jardin, 8440 Hwy 27, Woodbridge, ON. RSVP by March 15th, 2027 (end of day, America/Toronto).

## Capabilities and Constraints

- Single scrolling page `/` (hero invitation, details, RSVP, footer), `/rsvp/[token]`, `/admin`. No registry, song picker, video page, story, hotel block or dress code unless added to the brief.
- Seat cap enforced in the UI (stepper/select, never free text) and on the server. One response per invite; resubmitting updates it. Lookup never reveals or enumerates the guest list. Honeypot and rate limiting on lookup and submit.
- Meals: Chicken, Beef, Veggie, Kids' Meal. **Kids' Meal appears only for invites flagged `kids_allowed`** (confirmed).
- After the deadline the form becomes read only with a "please contact Linda and Marko directly" message.
- `noindex, nofollow` sitewide; no analytics or third-party trackers.
- **Languages: English and Serbian** (confirmed; supersedes the brief's English-only default). All guest-facing copy, form labels, errors, confirmation and emails need both languages. Open: Serbian script (Latin vs Cyrillic), who supplies or approves the Serbian translations, how a guest switches language, and whether `/admin` is translated.
- Open (from the brief): domain (Vercel URL first), real guest list with seat counts (seed data until supplied), whether guests get confirmation emails and which inbox gets notifications (off until an address is provided).

## Brand Commitments

- The printed invitation is the visual and verbal source of truth (`public/reference/invitation.png`, to be supplied by the developer). Invitation wording is used verbatim and in order: TOGETHER WITH THEIR FAMILIES / Linda Todorovski & Marko Pupavac / INVITE YOU TO JOIN THEM AS THEY CELEBRATE THEIR MARRIAGE ON / SATURDAY, MAY 15TH, 2027 / CHURCH CEREMONY · RECEPTION / PLEASE RSVP BY MARCH 15TH, 2027.
- Binding look stated by the developer: white on white, embossed, quiet, formal, lots of empty space; nothing bold, nothing dark, no stock wedding-template feel. Real floral artwork only (no generated clip-art or emoji). Detailed tokens, type and signature elements live in `PROJECT_BRIEF.md` §4 until a DESIGN.md records the built system.

## Evidence on Hand

- `PROJECT_BRIEF.md`: complete build brief (details, flow, data model, quality bar).
- Not yet in the workspace: `public/reference/invitation.png`, floral art (`public/art/floral-top-left.png`, `public/art/floral-bottom-right.png`; corner crops of the invitation are the placeholder), the guest list, Serbian translations. No photos, story or other content exists; do not invent any.

## Product Principles

1. The invitation's words and facts are never paraphrased or embellished.
2. RSVP correctness beats everything: seat caps, one response per invite, and accurate meal counts are enforced server-side.
3. A guest on a phone, possibly older, possibly reading in Serbian, should finish without help or confusion.
4. Privacy by default: no enumeration of guests, no trackers, no indexing.
5. The couple can run it alone: every admin task works without a developer.

## Accessibility & Inclusion

WCAG AA contrast for all text (use `--ink-deep` under 18px if `--ink` fails), full keyboard support, visible focus, labels on every field, errors announced to screen readers, inputs at least 16px. Guest age mix is unconfirmed, so default to readability-first wherever it conflicts with delicacy. Mobile first, tested at 360px; Lighthouse 95+ for performance and accessibility on mobile. Both languages must render correctly, including Serbian diacritics (š, đ, č, ć, ž) and Cyrillic if that script is chosen.
