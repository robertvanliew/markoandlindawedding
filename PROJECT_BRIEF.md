# Linda & Marko Wedding Website: Build Brief

Read this whole file before writing code. It is the single source of truth for the project. Where it says OPEN QUESTION, build the stated default and leave a `TODO(confirm)` comment.

## 1. Goal

A simple, elegant wedding website where invited guests can:

1. View the wedding details exactly as they appear on the printed invitation.
2. RSVP through a short guided form, limited to the number of seats they were invited for.

The couple (non-technical) must be able to see and export responses.

Reference build: thevanschatz.com (same developer). Follow its approach: Next.js, single scrolling page with anchor sections, personal RSVP links that pre-fill the guest, mobile first. If that repo is available in the workspace, reuse its patterns, folder structure and RSVP plumbing rather than inventing new ones. This site is simpler: no registry, no song picker, no video page.

## 2. Wedding details (use verbatim)

| Field | Value |
| --- | --- |
| Couple | Linda Todorovski & Marko Pupavac |
| Date | Saturday, May 15th, 2027 |
| Church ceremony | 1:00 PM, St. Sava Serbian Orthodox Church, 1375 Blundell Rd., Mississauga, ON |
| Reception | 5:30 PM, Château Le Jardin, 8440 Hwy 27, Woodbridge, ON |
| RSVP deadline | March 15th, 2027 |
| Timezone | America/Toronto |

Invitation wording, in order:

- TOGETHER WITH THEIR FAMILIES
- Linda Todorovski & Marko Pupavac
- INVITE YOU TO JOIN THEM AS THEY CELEBRATE THEIR MARRIAGE ON
- SATURDAY, MAY 15TH, 2027
- Two columns: CHURCH CEREMONY / RECEPTION (details above)
- PLEASE RSVP BY MARCH 15TH, 2027

Do not invent extra content (no story, registry, hotel block, dress code) unless added to this file later.

## 3. Tech stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- `next/font` for typography, `next/image` for images
- Database: Supabase (Postgres). All reads and writes go through server actions or route handlers using the service role key. No client-side database access, RLS on with no public policies.
- Validation: Zod on the server for every submission
- Hosting: Vercel
- Optional email: Resend, for a confirmation to the guest and a notification to the couple

If thevanschatz.com used a different data store or host, use that instead and keep everything else the same.

Environment variables (`.env.local`, provide `.env.example`):

```
NEXT_PUBLIC_SITE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
RESEND_API_KEY=          # optional
NOTIFY_EMAIL=            # optional, couple's inbox
```

## 4. Design system

The site should look like the printed invitation came to life. Source of truth: `public/reference/invitation.png` (the developer will add this file). Open it and match it.

Look and feel: white on white, embossed, quiet, formal. Lots of empty space. Nothing bold, nothing dark, no stock wedding template feel.

### Colour tokens

Sample the final values from the invitation image. Starting points:

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#FBFAF7` | Page background |
| `--paper-shade` | `#F3F0EB` | Cards, form fields, embossed shadow |
| `--ink` | `#A38468` | All text (warm taupe / rose gold) |
| `--ink-deep` | `#8A6C52` | Small text needing more contrast, focus states |
| `--line` | `#DCCDBF` | Hairline borders and dividers |
| `--error` | `#A4553F` | Form errors |

Body text must meet WCAG AA against `--paper`. If `--ink` fails at small sizes, use `--ink-deep` for anything under 18px.

### Typography

- Names and script accents: a formal copperplate script, e.g. `Pinyon Script` (fallback `Great Vibes`). Used only for the couple's names, the ampersand, and at most one short accent per section.
- Everything else: a high-contrast serif in uppercase with wide tracking, e.g. `Cormorant Garamond` (weights 400, 500). Letter spacing about `0.2em` on headings and labels, `0.12em` on small caps body.
- Form inputs and long helper text: same serif, normal case, minimum 16px so iOS does not zoom.

### Signature elements

- Thin double-line frame inset from the edges of the hero, like the invitation border.
- Embossed white peony and foliage art in the top-left and bottom-right corners. Use real artwork: `public/art/floral-top-left.png` and `public/art/floral-bottom-right.png` (transparent PNG or WebP, to be supplied). Until supplied, crop the corners from the reference invitation as placeholders. Do not generate clip-art flowers or use emoji.
- Centered hairline with a script ampersand between the two names.
- The two-column Ceremony / Reception block with a vertical hairline divider. Stacks to one column on mobile with a horizontal hairline.

### Motion

Minimal. One soft fade and rise on the hero at load, gentle fade-in on scroll for sections, smooth step transitions in the RSVP form. Respect `prefers-reduced-motion`.

## 5. Pages and sections

### `/` (single page)

1. **Hero**: full invitation recreated in HTML and CSS (not an image of the invitation). Frame, florals, wording from section 2. One button: RSVP.
2. **Details**: two cards, Church Ceremony and Reception. Each has time, venue name, address, an "Open in Maps" link (Google Maps directions URL) and an "Add to calendar" link (`.ics` download, Toronto timezone). Optional embedded map per venue, lazy loaded.
3. **RSVP**: the form in section 6, with the deadline shown above it.
4. **Footer**: "Linda & Marko" in script, the date, nothing else.

Sticky minimal nav: Details, RSVP. On mobile, a single floating RSVP button is enough.

### `/rsvp/[token]`

Personal link. Loads the invite by token, skips the name lookup step, and greets the party by name. Same form as on `/`.

### `/admin`

Password gate (`ADMIN_PASSWORD`, httpOnly cookie session). Not linked from the public site, `noindex`.

- Totals: invited parties, responded, attending guests, declined, not yet responded, meal counts by type
- Table of all parties with status, guest count, each guest's meal and dietary note, submitted time
- Filter by status, search by name
- Export CSV (one row per attending guest, plus a second export of parties who have not responded)
- Add, edit and delete invites, including max guests and kids-allowed flag
- Copy personal RSVP link per invite
- CSV import of the guest list (columns: `party_name, max_guests, kids_allowed, aliases, email`)

## 6. RSVP flow (core feature)

This is what the bride asked for. Build it exactly.

**Step 0: Find your invitation**

- Fields: First name, Last name (both required).
- Server looks up the invite list by normalized name (trim, lowercase, strip accents and punctuation, also check `aliases`).
- Exactly one match: continue. Several matches: show the matching party names and let the guest pick. No match: friendly message asking them to check spelling or contact the couple. Do not create a new invite.
- Skipped entirely when arriving by personal link.
- If the party already responded, show their current answers and let them edit until the deadline.

**Step 1: Will you be attending?**

- Yes / No (required).
- No: save the response, show a warm thank-you message, end.
- Yes: reveal the next three questions.

**Step 2: How many guests will be attending?**

- A stepper or select from 1 to the invite's `max_guests`. Never a free text box.
- Show: "We have reserved N seats in your honour."
- The cap is enforced on the server as well. This solves the bride's concern: a family of five invited as two can only RSVP for two.

**Step 3: Meal preference (one per guest)**

- Number of guests equals number of meals. Render one row per attending guest:
  - Guest name (first row pre-filled with the name entered in Step 0)
  - Meal: Chicken, Beef, Veggie, Kids' Meal (required)
- Kids' Meal only appears when the invite has `kids_allowed = true`.

**Step 4: Allergies or dietary restrictions**

- One optional text field per guest row, so the answer to "which meal?" is automatic. Label: "Any allergies or dietary restrictions?"

**Confirmation**

- Summary of what was submitted, the date and both venues, calendar links, and a note that they can change their answer until March 15th, 2027.
- Optional email field for a confirmation copy.

**Rules**

- After the deadline the form is read only and shows "RSVPs are now closed, please contact Linda and Marko directly." Deadline is end of day March 15, 2027, Toronto time, stored as a config constant.
- One response per invite; resubmitting updates it.
- Honeypot field and basic rate limiting on lookup and submit.
- Name lookup must never return the full guest list or let someone enumerate it.

## 7. Data model

```sql
invites (
  id uuid pk,
  token text unique,           -- for personal links
  party_name text,             -- "Ana & Petar Jovanovic"
  aliases text[],              -- other names that should match
  email text null,
  max_guests int not null,
  kids_allowed boolean default false,
  created_at timestamptz
)

responses (
  id uuid pk,
  invite_id uuid unique references invites,
  attending boolean not null,
  guest_count int not null default 0,
  contact_email text null,
  submitted_at timestamptz,
  updated_at timestamptz
)

response_guests (
  id uuid pk,
  response_id uuid references responses on delete cascade,
  full_name text not null,
  meal text check (meal in ('chicken','beef','veggie','kids')),
  dietary_notes text null
)
```

Include a migration file and a seed script with 5 fake invites covering: single guest, couple, family with kids allowed, two parties sharing a surname, and a name with Serbian diacritics (for example Đorđević, which should also match "Djordjevic").

## 8. Quality bar

- Mobile first. Most guests will open this from a text message. Test at 360px wide.
- Lighthouse 95+ for performance and accessibility on mobile.
- Full keyboard support, visible focus states, labels on every field, errors announced to screen readers.
- Open Graph image (1200x630) in the invitation style, so the link looks right in iMessage and WhatsApp.
- `robots` set to `noindex, nofollow` sitewide. This is a private event.
- No analytics or third-party trackers.
- Loading, error and empty states for every form step.

## 9. Build order

1. Scaffold the project, fonts, colour tokens, Tailwind theme.
2. Hero that matches the invitation. Stop and compare against `public/reference/invitation.png` before going further.
3. Details section, maps links, `.ics` files.
4. Database schema, seed data, server actions.
5. RSVP flow on `/` and `/rsvp/[token]`.
6. Admin page, CSV import and export.
7. Confirmation emails (if keys are present), OG image, metadata.
8. Accessibility and mobile pass, then deploy to Vercel.

## 10. Open questions for the bride

- OPEN QUESTION: Her note says "no kids" in the example but lists Kids' Meal as an option. Default: Kids' Meal shows only for invites flagged `kids_allowed`.
- OPEN QUESTION: Domain name. Default: deploy to a Vercel URL first.
- OPEN QUESTION: Guest list with seat counts per party (needed for the RSVP limit). Default: seed data until she sends a spreadsheet.
- OPEN QUESTION: Original floral artwork files from the invitation designer. Default: corner crops from the invitation image.
- OPEN QUESTION: Should guests get a confirmation email, and which address should receive notifications? Default: off until an address is provided.
- OPEN QUESTION: English only, or English and Serbian? Default: English only.
