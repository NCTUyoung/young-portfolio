# Young Portfolio — Design System Skill

> When the user asks for design work on **NCTU Young's personal portfolio**
> (or anything that should match its 日式 aesthetic), follow this guide.

## What this design system covers

A single product: **Young Portfolio** — a personal portfolio website for
NCTU Young, with two content tracks (數位電繪 / 攝影紀錄) and four surfaces
(Home, Gallery, Article, Admin). Built originally with Nuxt 3 + Tailwind;
this kit extracts the system into framework-neutral CSS + React/JSX.

## When to invoke

- Building a new page for the portfolio site (e.g. a project detail view)
- Designing campaign artwork in the same aesthetic
- Producing print/social pieces that should feel like the site
- Any "make it 日式 / 余白 / 侘寂" brief — this kit is the reference

If the user wants something explicitly **not** Japanese-aesthetic, do NOT
force this system; ask first.

## Files at a glance

| File | What it is | Read when |
| --- | --- | --- |
| `README.md` | Product context, content rules, visual foundations, iconography, file index | Always — start here |
| `CLAUDE_DESIGN_BRIEF.md` | Original Chinese-language brief from the owner | When scoping a new feature |
| `colors_and_type.css` | All CSS variables, fonts, semantic tokens, JP utility classes | Import in every artifact |
| `screenshots/01-12*.png` | 12 real screenshots of the live site | When matching live look |
| `preview/*.html` | 19 design-system cards (~700px each) | For visual reference / DS tab |
| `ui_kits/portfolio_site/` | Working React mock of Home/Gallery/Article/Admin | Copy components from here |
| `assets/` | Logo SVG, seal, avatar, ink-stroke, favicon | Use directly, don't redraw |

## Quick start for a new artifact

```html
<!-- 1. Pull the tokens -->
<link rel="stylesheet" href="../colors_and_type.css">

<!-- 2. Use semantic vars, not raw hex -->
<style>
  body { background: var(--bg); color: var(--fg-1); font-family: var(--font-sans); }
  h1   { font-family: var(--font-jp); font-weight: 200; letter-spacing: .18em; }
  .eb  { /* eyebrow */ font-size: 11px; letter-spacing: .35em;
         text-transform: uppercase; color: var(--accent-500); }
</style>
```

For React work, copy `primitives.jsx` from `ui_kits/portfolio_site/`. It
exposes `<Hairline>`, `<Eyebrow>`, `<Seal>`, `<SectionTitle>`,
`<VerticalKanji>`, `<Frame>`, `<Photo>`, `<CTA>`, `<Arrow>`.

## Non-negotiable rules (the 鐵律)

1. **Stone is the spine.** ~90% of pixels are `--stone-50…900`. If you find
   yourself reaching for blue, green or purple — stop.
2. **Accent (terracotta) is for points, not planes.** Eyebrows, seal ink,
   tiny hairline focus states, kansuji numbers. Never as a button background
   except for the *one* article-page CTA.
3. **Hairline before heavy line.** `linear-gradient` 1px lines that fade at
   both ends. No solid 2–4px dividers.
4. **JP titles are extralight.** Noto Serif JP, weight 200, tracking
   0.18–0.5em. If a title looks bold or condensed, it's wrong.
5. **No emoji. No raw rounded gradients. No drop-shadow stacks.** Decoration
   = kanji + seal + hairline + 余白.
6. **Right angles by default.** Corners are square. Exceptions: social-link
   pills (full round), article preview cards (8px), the seal (rotated -3°).
7. **Reveal animations are slow and out-expo** (0.8s `cubic-bezier(0.16, 1,
   0.3, 1)`), and ALWAYS respect `prefers-reduced-motion`.
8. **Bilingual rhythm.** Display kanji big + Latin ruby small + Chinese body.
   Don't translate — the JP is decorative subtitle, not a substitute.
9. **Sections breathe.** `padding: 96px → 144px` vertical on every major
   section. Alternate `--bg` and `--bg-sub` to suggest division without rules.
10. **Lucide icons, stroke 1–1.5, currentColor, fill none.** No filled icons.

## Workflow tips

- Before designing, open `ui_kits/portfolio_site/index.html` and click
  through Home → Gallery → Article. Internalize the rhythm.
- For new pages, mirror the existing section pattern: `Eyebrow` → big JP
  title → ruby (uppercase Latin) → hairline → content.
- Photo placeholders: use `<Photo kanji="春" tone="pink" ratio="4/5" />`
  rather than gray boxes. Tones available: stone, warm, cool, pink, green,
  night.
- When the user provides real images, drop them into `assets/` and replace
  `<Photo>` calls with `<img>`.
- Speaker notes / decks: there is no deck template here. If a deck is
  asked for, build it from scratch using these tokens; pick a single
  background-pair (e.g. `--bg` ↔ `--surface`) and stick to it.

## Things this kit does NOT include

- A deck/slide template (out of scope for the source product)
- A login / auth UI (Admin is local-only and intentionally unstyled)
- Light/dark theme toggle implementation (tokens support both — wire up
  `[data-theme="dark"]` on `<html>` and add `--bg: var(--stone-900)` etc.)
- Real photography assets (the original repo's images are not redistributed
  here; placeholders ship instead)

## Source of truth precedence

If sources disagree, trust in this order:
1. `screenshots/` (the live site as it actually renders)
2. The original repo `app/assets/css/main.css` and `tailwind.config.js`
3. `colors_and_type.css` (this kit's extraction)
4. The preview cards and ui_kit components

The repo's `.cursor/rules/design-aesthetic.mdc` is the philosophical spec
but not bundled here. Pull it from the repo before any large overhaul.
