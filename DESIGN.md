---
name: Linda & Marko
description: The invitation's own world as a full-bleed ivory page, framed by embossed peonies that bloom and sway at the screen's corners.
colors:
  paper: "#fdfbf8"
  ground: "#f7f1eb"
  blush: "#f3e6dd"
  card: "#fffdfa"
  field-white: "#ffffff"
  names: "#8a6a4f"
  ink: "#a38468"
  ink-deep: "#7a5b41"
  ink-strong: "#5e4430"
  ink-strong-hover: "#4f3826"
  muted: "#7d6049"
  line: "#e6d9cc"
  control: "#a38468"
  error: "#a4553f"
typography:
  display:
    fontFamily: "Pinyon Script, cursive"
    fontSize: "clamp(2.6rem, 1.4rem + 6vw, 7rem)"
    fontWeight: 400
    lineHeight: 1.02
  headline:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(2.5rem, 1.9rem + 2.6vw, 4rem)"
    fontWeight: 500
    lineHeight: 1.05
  lead:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(1.25rem, 1.05rem + 0.8vw, 1.6rem)"
    fontWeight: 500
  invitation-caps:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(1.4rem, 1.1rem + 1vw, 1.9rem)"
    fontWeight: 500
    letterSpacing: "0.14em"
  title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 500
    lineHeight: 1.25
  body:
    fontFamily: "Jost, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Jost, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    letterSpacing: "0.22em"
  button:
    fontFamily: "Jost, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    letterSpacing: "0.08em"
rounded:
  field: "14px"
  inset: "20px"
  card: "28px"
  pill: "999px"
spacing:
  gutter: "20px"
  nav-height: "64px"
  target: "44px"
  section: "clamp(56px, 8vh, 96px)"
  container: "1120px"
components:
  button-primary:
    backgroundColor: "{colors.ink-strong}"
    textColor: "{colors.card}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0.75em 1.75em"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.ink-strong-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-strong}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0.75em 1.75em"
    height: "48px"
  button-ghost-hover:
    backgroundColor: "rgb(255 255 255 / 0.7)"
  button-sm:
    padding: "0.55em 1.35em"
    height: "44px"
  input:
    backgroundColor: "{colors.field-white}"
    textColor: "{colors.ink-strong}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0.65em 1em"
    height: "52px"
  choice:
    backgroundColor: "{colors.field-white}"
    rounded: "{rounded.field}"
    height: "56px"
  choice-selected:
    backgroundColor: "{colors.blush}"
    textColor: "{colors.ink-strong}"
  card:
    backgroundColor: "rgb(255 253 250 / 0.88)"
    rounded: "{rounded.card}"
    padding: "clamp(32px, 4vw, 48px) clamp(24px, 3.5vw, 44px)"
  nav:
    backgroundColor: "transparent"
    height: "{spacing.nav-height}"
  nav-scrolled:
    backgroundColor: "rgb(253 251 248 / 0.86)"
---

# Design System: Linda & Marko

## Overview

**Creative North Star: "Inside the Invitation"**

The site is the printed invitation's world, not a picture of the invitation. The page itself is the card stock: a full-bleed ivory sheet (paper) that warms toward a soft ground below the hero, with faint blush glows pooled at left and right. The invitation's embossed white peonies are lifted off the print and set at the screen's own corners, top-left and bottom-right, so the browser window becomes the frame. The page closes the way the card does, on the bottom-right peony again at the footer.

Everything is set in one warm taupe-umber ink at five strengths, with three faces doing strictly separate jobs: a formal script for names, Cormorant Garamond for the invitation's voice, and Jost for everything a guest reads or taps. Interactive surfaces are soft and modern (28px cards, pill buttons, 14px fields) so the RSVP feels easy on a phone without breaking the stationery mood. Motion is a slow breath: the peonies bloom open, then sway in a light breeze.

The build was code-led with no image generation. The only imagery is the invitation's own peonies, extracted from the print by `scripts/extract-florals.mjs` as shadow-only alpha (the embossed shading without the white card), so they sit on any ground. These rasters are placeholders until the designer's original floral files arrive. The world explicitly refuses the card-on-a-page presentation (a framed invitation floating on a backdrop) and the stock wedding template's photo hero and countdown. The one borrowed device is the venue icon tile, kept by the user's choice to match the reference site thevanschatz.com: a single-stroke SVG in a blush circle heading each venue card.

**Key Characteristics:**
- Full-bleed ivory page; no frame, no backdrop behind a card-shaped invitation.
- Peonies anchored to the viewport corners in the hero, and to the bottom-right corner at the footer close.
- One warm ink family at five strengths; no second hue except a muted terracotta for errors.
- Script for names only; Cormorant for the invitation's voice; Jost for reading and tapping.
- Soft, warm-shadowed cards and pill buttons for the functional parts.
- Bloom, then breeze: entrance motion is slow and the idle motion is barely there.

## Colors

A single warm taupe-umber ink on ivory paper, with blush used only as glow and selection.

### Primary
- **Umber Ink** (ink-strong): headings, section titles, the date line, buttons (fill and ghost text), selected choices, focus outlines, the nav monogram. The strongest step of the ladder and the only one used as a fill. Its hover step (ink-strong-hover) darkens the filled pill.

### Neutral
- **Card Stock Ivory** (paper): the hero sheet and the top of the page gradient; the scrolled nav's translucent fill; the browser theme color.
- **Warm Ground** (ground): the page below the hero, reached by a vertical gradient from paper (22% to 45%), ending near `#f9f4ef`. Also the scrollbar track and, at 70% alpha, inset rows (guest rows, summary items).
- **Blush Glow** (blush): radial glows on the page and behind the names, the venue icon circles, the selected-choice fill, and the selection highlight family.
- **Card White** (card): card surfaces at 88% alpha over the ground, and text on filled buttons.
- **Field White** (field-white): input and choice backgrounds, so fields read as the brightest surface on a card.
- **Names Taupe** (names, `--color-names`): the couple's names in the hero and the footer. The invitation's taupe deepened for 4.8:1 on paper.
- **Print Taupe** (ink): the invitation's literal ink. Large script only (the hero ampersand) and input hover borders; 3.4:1, never for small text.
- **Body Umber** (ink-deep): running text, the lead line, the opening line and hero venue line, venue addresses, the footer date, nav links (5.9:1).
- **Muted Umber** (muted): section subtitles, step notes, the footer's "With love,", meal labels (4.9:1 on ground).
- **Hairline** (line): card borders (at 70%), the scrolled nav's bottom rule, the hairlines flanking the ampersand, unselected choice borders.
- **Field Stroke** (control): input borders, ghost button borders, the gradient rule under the lead line (3.4:1, meets non-text contrast).
- **Terracotta Error** (error): invalid field borders, field errors, error notices on a `#fdf5f2` wash.

### Named Rules
**The Ink Ladder Rule.** All text and strokes come from one umber family, chosen by job: names (names), body (ink-deep), headings and buttons (ink-strong), secondary (muted), field strokes (control). Pick the step by role and contrast, never by mood.

**The Print Taupe Is Large Rule.** The invitation's literal taupe (ink) carries text only at script sizes. Anything under display size steps down to ink-deep or darker.

## Typography

**Display Font:** Pinyon Script (with cursive)
**Body Font:** Jost (with system-ui, sans-serif)
**Invitation Font:** Cormorant Garamond 500/600, roman and italic (with Georgia, serif)

**Character:** Cormorant carries the invitation's formal voice in two registers, letter-spaced caps for the printed lines and italic for the spoken ones; Pinyon is reserved for names; Jost keeps everything practical crisp and legible on a phone.

### Hierarchy
- **Display** (Pinyon 400, clamp(2.6rem, 1.4rem + 6vw, 7rem), 1.02, names ink): the couple's names in the hero, each on its own line, the ampersand at 0.85em in print taupe between hairlines. Footer names at clamp(2.75rem, 2rem + 3vw, 4rem), also in names ink; the nav monogram at 1.75rem in ink-strong (1.4rem, nowrap, under 360px); the guest party's name as the RSVP greeting at 2.75rem in ink-strong.
- **Headline** (Cormorant italic 500, clamp(2.5rem, 1.9rem + 2.6vw, 4rem), 1.05): section titles, centred.
- **Lead** (Cormorant italic 500, clamp(1.25rem, 1.05rem + 0.8vw, 1.6rem)): the invitation's spoken line under the names; the footer's "With love," at 1.25rem.
- **Invitation Caps** (Cormorant 500, clamp(1.4rem, 1.1rem + 1vw, 1.9rem), 0.14em, uppercase, ink-strong): the hero date line; tracking drops to 0.06em under 360px. Ordinals sit raised at 0.62em. The same register at smaller sizes sets:
  - "Together with their families": clamp(1.125rem, 1rem + 0.4vw, 1.3rem), 0.14em, ink-deep; 1.0625rem and 0.08em under 560px.
  - The hero venue line: clamp(1.125rem, 1rem + 0.35vw, 1.25rem), 0.1em, ink-deep. Under 560px it sets one venue per line, nowrap, at clamp(0.9rem, 3.9vw, 1.0625rem) with 0.04em; under 360px the names may wrap and the middle dot is hidden.
  - Venue card headings ("Church Ceremony", "Reception"): 1.125rem, 0.1em, weight 600, ink-strong.
  - The footer date: 1.125rem, 0.1em, weight 500, ink-deep.
- **Title** (Cormorant 500, 1.75rem, 1.25): RSVP step headings. Venue times run larger (clamp(2.25rem, 1.9rem + 1.2vw, 2.75rem), 1.1); venue names and guest legends use weight 600 at 1.5rem and 1.375rem; choice answers at 1.375rem.
- **Body** (Jost 400, 1.0625rem, 1.65): all running text, field values, addresses. Never below 1rem for reading text; fields stay at 1.0625rem.
- **Label** (Jost 500, 0.8125rem, 0.22em, uppercase): nav links. Meal tags in the RSVP summary use the same face at 0.2em in muted. Field labels are Jost 500 at 0.9375rem, sentence case. Nothing else on the site is set in Jost caps.
- **Button** (Jost 500, 0.9375rem, 0.08em, uppercase): every pill.

### Named Rules
**The Names Only Rule.** Pinyon Script sets names and nothing else: the couple's names, their monogram, and a guest party's own name when greeting them. Never a heading, label, or decorative word.

**The Two Registers Rule.** Cormorant caps are for lines the invitation prints and the labels that name them (date, venues, the opening line, venue card headings, the footer date); Cormorant italic is for lines it speaks (section titles, the lead, "With love,"). Jost is for everything a guest reads to act or taps.

## Layout

A single centred column on a full-bleed page. Content sits in a container of min(100% - 40px, 1120px), giving a 20px side gutter at phone width. The hero fills the screen (100svh), centring a column of at most 820px, with top padding clamp(112px, 16vh, 168px) to clear the fixed nav. Sections breathe at clamp(56px, 8vh, 96px) top and bottom, with centred heads and clamp(36px, 6vh, 56px) under them.

The two venue cards sit side by side (max 1000px, gap clamp(16px, 2.5vw, 28px)) and stack under 760px. The RSVP card is a single column of at most 680px. Under 560px the nav links collapse to the monogram and the "Reply now" pill, the peonies grow to 46vw and 64vw, and the hero venue line sets one venue per line, nowrap. Under 360px the venue names may wrap and lose the middle dot, the monogram shrinks to 1.4rem nowrap, the nav pill tightens to 1em side padding, and the date's tracking drops to 0.06em.

Touch targets are at least 44px (links, small pills), 48px for primary pills, 52px for fields and 56px for answer choices. Anchor scrolling is smooth with a 72px top offset for the fixed nav.

### Named Rules
**The Screen Is the Card Rule.** Ornament anchors to the viewport's corners, not to a box inside the page. Peonies sit at top: 0 / left: 0 and right: 0 / bottom: 0 of full-width sections and bleed off the edge.

## Elevation & Depth

A layered-paper hybrid. The page has no shadows of its own; depth comes from the warm gradient and blush glows, and the peonies' embossed shading. Functional surfaces lift off it with soft, warm, umber-tinted shadows that read as paper resting on paper, never as glass or hard plastic. Every shadow is tinted `rgb(94 68 48 / ...)` (the ink-strong hue), never neutral black.

### Shadow Vocabulary
- **Card rest** (`box-shadow: 0 1px 2px rgb(94 68 48 / 0.04), 0 12px 32px -12px rgb(94 68 48 / 0.12), 0 40px 80px -48px rgb(94 68 48 / 0.18)`): venue and RSVP cards. A contact line, a near lift, and a long low pool.
- **Pill rest** (`box-shadow: 0 10px 24px -14px rgb(94 68 48 / 0.6)`): filled buttons.
- **Pill hover** (`box-shadow: 0 14px 28px -14px rgb(94 68 48 / 0.7)`): filled buttons on hover, with a 1px lift.
- **Nav scrolled** (`box-shadow: 0 8px 24px -20px rgb(94 68 48 / 0.35)`): the bar once it fills; paired with a 14px backdrop blur.
- **Field focus** (`box-shadow: 0 0 0 4px rgb(94 68 48 / 0.12)`): a soft umber halo around a focused input.

### Named Rules
**The Warm Shadow Rule.** Shadows are always umber-tinted, long and soft, with negative spread. Ghost buttons, fields at rest and the page itself carry none.

## Shapes

Soft and rounded throughout the functional layer, in four steps: fields, choices, notices and summary rows at 14px; inset guest rows at 20px; cards at 28px; buttons and the skip link fully pill-shaped (999px). Borders are single 1px hairlines: line at 70% on cards, control on fields and ghost pills, ink-strong on the focused or selected state (a second inset 1px ring doubles it on a selected choice). Ornamental rules are hairlines too: a 120px horizontal gradient that fades at both ends under the lead, and flat line-colored strokes flanking the ampersand. The peonies are the only organic shapes; the bottom-right one fades out through a gradient mask instead of ending on the print's straight crop edge.

## Components

### Buttons
Soft, confident pills in the ink.
- **Shape:** fully rounded (999px), min-height 48px; small variant 44px with 0.55em 1.35em padding.
- **Primary:** ink-strong fill and border, card-white text, Jost 500 caps at 0.08em, 0.75em 1.75em padding, pill rest shadow.
- **Hover / Focus:** darkens to ink-strong-hover, deeper shadow, lifts 1px (200ms, expo out); press scales to 0.98. Focus is a 2px ink-strong outline at 3px offset. Disabled at 50% opacity; busy shows a progress cursor.
- **Ghost:** transparent with a control border and ink-strong text, no shadow; on hover a 70% white wash and an ink-strong border.
- **Quiet:** a text-only action (back, edit, calendar links in the confirmation): Jost body size in ink-deep, underlined in control at 0.35em offset; hover darkens text and underline to ink-strong.
- Icons inside pills are inline stroked SVG at 18px.

### Cards / Containers
- **Corner Style:** 28px.
- **Background:** card white at 88% over the ground, so the page's glow shows faintly through.
- **Shadow Strategy:** card rest (see Elevation & Depth).
- **Border:** 1px line at 70%.
- **Internal Padding:** venue cards clamp(32px, 4vw, 48px) by clamp(24px, 3.5vw, 44px); the RSVP card clamp(28px, 5vw, 56px) by clamp(20px, 5vw, 56px).
- Venue cards are centred stacks (icon tile, heading, time, name, address, then actions pinned to the bottom) and lift 2px on hover.
- **Venue icon tile:** each venue card opens on a 52px blush circle holding a single-stroke 22px SVG in ink-strong (stroke 1.4, no fill): a church for the ceremony, interlocked rings for the reception. The heading sits 20px below in Cormorant 600 caps. Kept deliberately to match the reference site; it appears only here, one per venue card. Inside the RSVP card, guest rows and summary items are inset panels of ground at 70%, with no border or shadow.

### Inputs / Fields
- **Style:** field white, 1px control border, 14px radius, min-height 52px, Jost 1.0625rem in ink-strong. Placeholder `#85684f`. Labels sit above in Jost 500 0.9375rem ink-strong with an 8px gap.
- **Hover:** border warms to ink.
- **Focus:** border goes ink-strong with the 4px field-focus halo; no outline.
- **Error:** border and message in error; error notices sit on a `#fdf5f2` wash with a half-strength error border.

### Choices
The RSVP's answers are large tappable tiles rather than radio dots: field white, 1px line border, 14px radius, min-height 56px, centred text (Cormorant 500 at 1.375rem for the attend/decline answers). Hover warms the border to control and lifts 1px; press scales to 0.98. Selected fills with blush, takes an ink-strong border doubled by an inset 1px ring. Guest-count choices are 56px squares in a centred wrap; meal choices sit in an auto-fit grid (min 120px).

### Navigation
- **Style:** fixed across the top, 64px tall. Transparent with a transparent border over the hero; once scrolled past 8px it fills with paper at 86%, a 14px backdrop blur with slight saturation, a line bottom rule and the nav shadow (300ms crossfade).
- **Content:** the Pinyon monogram "Linda & Marko" in ink-strong at left; at right, Jost caps links (0.8125rem, 0.22em, ink-deep) and a small filled "Reply now" pill, so RSVP is always one tap away.
- **Hover:** a 1px underline draws in from the left (scaleX, 300ms expo out).
- **Mobile:** under 560px the text links hide; monogram and pill remain. Under 360px the monogram is 1.4rem and both it and the pill stay on one line.

### Corner Peonies (signature)
Two transparent rasters of the invitation's embossed peonies, aria-hidden and pointer-inert, behind the content (z-index -1 in an isolated section). Top-left at clamp(190px, 30vw, 470px), anchored at 0 0; bottom-right at clamp(220px, 36vw, 560px), anchored at 100% 100%, faded at its lower edge by a mask (transparent to opaque over the bottom 26%). The footer repeats the bottom-right peony at clamp(200px, 30vw, 460px), static. Each hero peony is an outer element that blooms and an inner `.peony-sway` element that idles, so the two motions never fight over one transform.

### Motion
One easing for everything purposeful: expo out, `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Bloom:** each hero peony unfolds from its own corner over 2200ms: a circular clip reveal from the corner point, opacity in, a 6px blur clearing by 60%, and a settle from scale 0.86 and -5deg. Top-left starts at 100ms, bottom-right at 350ms.
- **Breeze:** from 2300ms the inner layer runs two looping, out-of-phase animations: a sway (rotate 0 to 1deg to -0.45deg, ease-in-out) and a drift (translate 2px, -2px). Top-left loops at 11s and 7s; bottom-right at 13s and 8.5s with its sway reversed, so the pair never visibly syncs. Both pause while the hero is off screen (an IntersectionObserver sets `data-offscreen`).
- **Rise-in:** hero lines enter from 14px below with a fade over 1100ms, staggered 110ms apart starting at 450ms, in reading order.
- **Step-enter:** each RSVP step and revealed sub-section rises in over 450ms.
- **State:** pills 160 to 200ms, choices 180ms, fields 150ms, nav and cards 300ms.
- **Reduced motion:** blooms, rises and sways are replaced by plain fades (700ms for hero and peonies, 200ms for RSVP steps), the breeze does not run, hover lifts are removed and anchor scrolling is instant. A `?settled` query freezes every animation at its end state for review screenshots.

## Do's and Don'ts

### Do:
- **Do** let the page be the invitation: full-bleed paper to ground gradient, peonies anchored at the viewport's corners and bleeding off the edge.
- **Do** pick text color from the ink ladder by role: names ink for the couple's names (hero and footer), ink-deep for body, ink-strong for headings and buttons, muted for secondary lines, control for field strokes.
- **Do** keep Pinyon Script for names only, Cormorant caps for printed invitation lines and their labels (venue headings, footer date), Cormorant italic for section titles and lead lines, and Jost for body, nav links, field labels and buttons.
- **Do** head each venue card with its single-stroke icon in a 52px blush circle, and keep the device to the venue cards.
- **Do** use 28px cards with the warm three-layer card shadow, pill buttons (filled for the main action, ghost beside it), and 14px fields at 52px tall.
- **Do** tint every shadow umber (`rgb(94 68 48 / ...)`) and use expo-out easing for purposeful motion.
- **Do** pause idle motion off screen and give every animation a plain-fade reduced-motion path.
- **Do** keep reading text at 1.0625rem or larger and every target at 44px or taller.

### Don't:
- **Don't** present the invitation as a framed card or picture floating on a backdrop; the screen is the card.
- **Don't** fall back to the stock wedding template's photo hero or countdown.
- **Don't** set any heading, label or decorative word in Pinyon Script.
- **Don't** use the print taupe (ink) for text below display size; it is 3.4:1.
- **Don't** use neutral grey or black shadows, or shadows on the page itself.
- **Don't** introduce a second accent hue; blush is a glow and a selection fill, terracotta is for errors only.
