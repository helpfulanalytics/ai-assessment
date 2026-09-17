# erase friction — Brand Reference

> Extracted from the live site at https://erasefriction.com (homepage + compiled stylesheet), 2026-09-17.

**Theme:** light · warm neutral canvas, single teal accent

erase friction sells the removal of work. The identity commits to that one idea hard enough that the logo *is* the argument: the word "erase" in teal, the word "friction" struck through with a teal line. Everything else stays out of the way — a warm bone-colored canvas instead of clinical white, near-black text, one teal that carries every action, and generous air between sections. Nothing decorative competes with the copy, because the copy is doing the selling.

---

## Positioning

| | |
|---|---|
| **Name** | erase friction — always lowercase, both words, no camel-case, no hyphen |
| **One-liner** | Websites, software & automation that erase the friction. |
| **Meta description** | erase friction builds custom software, workflow automations, and AI solutions that eliminate the manual work dragging your team down. |
| **Hero headline** | Your team is doing work a machine should do. |
| **Hero sub** | Double your output. Not your headcount. |
| **Primary CTA** | Tell us what's stuck → *(short form: What's stuck →)* |
| **OG image alt** | erase friction — Your team is doing work a machine should do. |

**The core frame.** Friction shows up in two places: *inside* (the work that eats the day — manual hand-offs, document overload, disjointed systems) and *outside* (the work that never gets done — a website that doesn't earn, social that went quiet, blog posts with no plan). One eats the hours you have. The other costs you the work you never won. Every offering maps back to one of those two halves.

**Three offerings**, always in this order and with this two-beat structure (category → blunt promise → what it actually is):

| Category | Promise |
|---|---|
| Websites & Content | Get found. Get the call. |
| Custom Software & Automation | Kill the busywork. |
| AI Solutions | Hire a digital teammate. |

**Three-step process:** We find where it's leaking → We show you the fix, and what it's worth → We build it and hand it over.

**The team device.** Humans and AI agents are listed in the same grid, each with a badge reading `100% human` or `100% digital`. Brooks Conkle (Operations & Strategy) and Tosin Alli (Engineering & AI) are human; Riley, Avery, Jordan, and Jenn Sanders are digital. This is the proof-of-concept: the company visibly runs on the thing it sells. Never hide the digital staff and never dress them up as people.

---

## Voice

**Second person, present tense, short sentences.** The subject is almost always *your team*, *your business*, *you* — not "we" and not "clients." Sentences run short and land on a period, not a comma.

**Name the pain concretely, then stop.** "Moving data from a CRM to a spreadsheet to a project tool, every single day." "Last post: March. Everyone's busy. Nobody owns it." Specificity is the persuasion; no adjective is doing work that a detail couldn't do better.

**The em-dash reversal is the signature move.** State the flattering version, then take it away: "Not a brochure — a machine that brings in work." "Built around how your team already works — not how a SaaS vendor thinks you should." "It looks fine. It ranks nowhere, and the form stays empty." "Adding a service is an edit, not a rebuild." "Thousands of pages, generated from data. Nobody typed them."

**Numbers instead of claims.** 7,139 licensed CPAs. 1,086 firms. 334 cities. 190+ five-star reviews. Eight service pages. 48 hours. 2 minutes. Where a number exists, it replaces the adjective.

**Lower the cost of responding, every time.** "Takes 2 minutes." "No sales calls. No commitment. Just a real response." "We'll respond within 48 hours." "Not ready? Grab the free Money-Leak Checklist." Every ask is paired with a de-risking line directly beneath it in muted text.

**Arrows on CTAs.** Action links end with a trailing `→` — "Meet the team →", "See what we actually fix →", "Email me the checklist →". This is consistent enough to be a rule.

### Don't
- Don't capitalize the brand name.
- Don't say "solutions," "leverage," "streamline," "empower," "cutting-edge," or "seamless" in body copy. (The nav label "AI Solutions" is the one fixed exception — it's a category name.)
- Don't use exclamation points.
- Don't promise outcomes without a number or a mechanism behind them.
- Don't write a CTA that asks for a call as the first step. The first step is always a written reply.

---

## Tokens — Color

| Name | Value | Token | Role |
|---|---|---|---|
| Accent Teal | `#0d9488` | `--color-accent` | The brand. Logo "erase", the strike-through rule, focus outlines, the full-bleed CTA banner |
| Accent Hover | `#0f766e` | `--color-accent-hover` | Primary button fill, link text, eyebrow labels — the *readable* teal, used wherever teal carries type |
| Accent Deep | `#115e59` | `--color-accent-deep` | Text inside tinted badges, where contrast on a pale teal ground has to hold |
| Accent Light | `#ccfbf1` | `--color-accent-light` | Badge and secondary-button borders, hero glow |
| Accent Tint | `#f0fdfa` | `--color-accent-tint` | Badge fills, card icon wells on hover |
| Canvas | `#f5f4f0` | `--color-bg` | Page background and inset cards. A warm bone, **not** white — this is what keeps the site from reading as generic SaaS |
| Surface | `#ffffff` | `--color-surface` | Cards and raised panels, which read as lifted *because* the canvas behind them is warm |
| Ink | `#1a1a1a` | `--color-text` | Headlines and body. Near-black, never pure `#000` |
| Muted | `#5f6774` | `--color-muted` | Sub-headings, card descriptions, micro-copy, reassurance lines |
| Hairline | `#e5e7eb` | `--color-border` | 1px card and divider borders |
| Footer Ground | `#111827` | `--color-footer-bg` | Footer only — the single dark region on the site |
| Footer Text | `#f9fafb` | `--color-footer-text` | Type on the dark footer; secondary footer text drops to `#9ca3af` |

**Rules.** One accent, no second hue — there is no warning red, no success green, no chart palette in the identity. Teal is reserved for action and brand; it never fills a decorative block except the CTA banner. Dark ground appears exactly once, in the footer. Type on teal is always `#fff`, and supporting text on teal is `#ffffffd1` (82% white).

**Hero glow.** The one atmospheric element: an 800×600 radial blob, `blur(80px)`, `opacity: .55`, built from `#a7f3d0` and `#ccfbf1`, anchored above the fold and centered. It sits at `z-index: 0` behind the content. Use it sparingly — it is the only gradient in the system.

---

## Tokens — Typography

**Inter**, weights 400/500/600/700/800, `display=swap`, with a system fallback stack:
`--font-base: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

| Role | Size | Weight | Tracking | Leading |
|---|---|---|---|---|
| Hero headline | `clamp(2.25rem, 5vw, 4.5rem)` | 800 | `-.03em` | 1.08 |
| Hero sub | `clamp(1.125rem, 2.6vw, 1.5rem)` | 400 | — | 1.5 |
| Section heading | `clamp(1.75rem, 3vw, 2.5rem)` | 700 | `-.025em` | — |
| CTA headline | `clamp(1.75rem, 3vw, 2.75rem)` | 800 | `-.025em` | — |
| Section sub | `1.0625rem` | 400 | — | — |
| Card title | `1.125rem` | 700 | `-.01em` | — |
| Card body | `.9375rem` | 400 | — | 1.65 |
| Eyebrow / label | `.75–.8125rem` | 700 | `+.06–.08em`, uppercase | — |
| Badge | `.6875–.72rem` | 700 | `+.06em`, uppercase | — |
| Micro-copy | `.8125rem` | 400 | — | — |

**The tracking rule is the whole typographic personality:** display type tightens (`-.01em` to `-.03em`, tighter as it gets larger), and small uppercase labels open up (`+.06em` to `+.08em`). Nothing sits at default tracking except body text.

**Measure.** Hero headline caps at `18ch` / 860px. Body columns run 520–900px, prose at `64ch`. Sub-headings are centered and capped at 580px.

---

## Tokens — Shape, Depth, Motion

```
--radius-sm:   6px
--radius-md:   12px   /* icon wells, square buttons */
--radius-lg:   16px   /* cards, panels */
--radius-pill: 999px  /* all text buttons, all badges */

--shadow-sm: 0 1px 3px #0000000f, 0 1px 2px #0000000a   /* resting cards */
--shadow-md: 0 4px 12px #00000014, 0 2px 4px #0000000a
--shadow-lg: 0 10px 30px #0000001f, 0 4px 8px #0000000f
```

Shadows are two-layer and deliberately faint — cards are separated by the `#e5e7eb` hairline first and lifted by shadow second. Transitions run `.15s–.22s` on `transform`, `box-shadow`, `border-color`, and `background-color`; nothing animates longer than 220ms and nothing eases in from off-screen.

---

## Components

**Logo.** A text wordmark, never an icon. Two spans:

```html
<span class="logo-erase">erase</span><span class="logo-friction">friction</span>
```
```css
.logo-erase    { color: var(--color-accent); }
.logo-friction { text-decoration: line-through;
                 text-decoration-color: var(--color-accent);
                 text-decoration-thickness: 1.5px; }
```

Set at `1.125rem / 700 / -.02em` in the nav and footer (`1rem` on small screens). The strike-through is 1.5px and always teal — never the text color, never thicker. Do not letterspace it, do not stack the words, do not put it in a box.

**Buttons.** Always pill (`--radius-pill`), weight 600, `inline-flex` with a `.25rem` gap for the trailing arrow, 44px minimum touch target.

| Variant | Treatment |
|---|---|
| `btn-primary` | `#0f766e` fill, white text, `0 1px 4px #0d948840` |
| `btn-secondary` | White fill, `#0f766e` text, `1.5px` `#ccfbf1` border, no shadow |
| `btn-white` | White fill, `#0f766e` text — for use on the teal CTA banner |
| `btn-sm` / `btn-lg` | `.5rem 1.125rem` @ `.875rem` / `.85rem 1.75rem` @ `1rem` |

**Cards.** White surface, 1px hairline, `--radius-lg`, `--shadow-sm`, `2rem` padding. Optional 48px icon well at `--radius-md` on the canvas color, flipping to `--color-accent-tint` on hover. Internal order is fixed: icon → uppercase category → title → muted description → arrow link. Step cards invert — canvas fill instead of white — to read as recessed rather than raised.

**Badges.** Pill, `--color-accent-tint` fill, `--color-accent-light` border, `--color-accent-deep` text, uppercase at `+.06em`. Used for `100% human` / `100% digital`.

**CTA banner.** Full-bleed `--color-accent`, `5rem 0`, white 800-weight headline, `#ffffffd1` sub capped at 520px, `btn-white` action. This is the only place teal fills a large area.

---

## Layout

- Container: `max-width: 1100px`, `padding: 0 1.5rem`, centered.
- Section rhythm: `5rem 0` standard, `6rem 0` for emphasis. Hero is `6rem 0 5rem`, opening to `8rem 0 7rem` at desktop.
- Section heading → sub gap `.6rem`; sub → content gap `3rem`.
- Headings and their subs are centered; card and step content is left-aligned.

## Accessibility

- Skip link to `#main` as the first focusable element.
- Focus ring: `3px solid var(--color-accent)` at `offset: 2px` (`-3px` inset where a panel would clip it).
- 44px minimum hit area on every interactive control.
- Honeypot fields on both forms, labeled "Don't fill this out if you're human:".
- Body text never lighter than `--color-muted` `#5f6774` on canvas.

## Contact

Phone (call or text): **251-554-5575** · Response promise: **within 48 hours** · Lead magnet: **the free Money-Leak Checklist** — "the 5 places your business is quietly losing money, and the fix for each."
