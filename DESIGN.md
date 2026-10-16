---
name: Young Portfolio
description: A Japanese editorial portfolio with an artwork exhibition and a photographic print-selection light table.
colors:
  stone-50: "#fafaf9"
  stone-100: "#f5f5f4"
  stone-300: "#d6d3d1"
  stone-500: "#78716c"
  stone-700: "#44403c"
  stone-800: "#292524"
  stone-900: "#1c1917"
  terracotta-500: "#db7b2e"
  terracotta-400: "#e4964a"
  terracotta-700: "#a3491f"
  gallery-wall: "#eee9dc"
  gallery-wall-light: "#f9f6ed"
  gallery-wood: "#594435"
  gallery-mat: "#f7f3e9"
  gallery-ink: "#403a32"
  gallery-muted: "#685f53"
  photo-world: "#eef1f3"
  photo-paper: "#faf7ef"
  photo-ink: "#39434a"
  photo-muted: "#58656d"
  photo-line: "#bbc4c8"
  photo-accent: "#52647a"
  gallery-wall-dark: "#302d2a"
  gallery-wall-light-dark: "#403b35"
  gallery-wood-dark: "#8d6f55"
  gallery-mat-dark: "#d8d0c1"
  gallery-ink-dark: "#eee8df"
  gallery-muted-dark: "#cbc1b2"
  photo-world-dark: "#14181b"
  photo-paper-dark: "#302e28"
  photo-ink-dark: "#ece8df"
  photo-muted-dark: "#bac5cb"
  photo-line-dark: "#64717a"
  photo-accent-dark: "#9aadc5"
typography:
  display-art:
    fontFamily: "Zen Kaku Gothic New, Noto Sans TC, sans-serif"
    fontSize: "clamp(1.7rem, 2.6vw, 2.6rem)"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0.08em"
  display-photo:
    fontFamily: "Shippori Mincho, Noto Serif JP, serif"
    fontSize: "clamp(1.7rem, 2.6vw, 2.6rem)"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0.11em"
  body:
    fontFamily: "Outfit, Noto Sans TC, PingFang TC, Microsoft JhengHei, ui-sans-serif, system-ui, sans-serif"
  exhibition-plaque:
    fontFamily: "Zen Kaku Gothic New, Noto Sans TC, sans-serif"
    fontSize: "clamp(1.1rem, 1.7vw, 1.45rem)"
    lineHeight: 1.5
  photo-caption:
    fontFamily: "Outfit, Noto Sans TC, PingFang TC, Microsoft JhengHei, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    lineHeight: 1.6
rounded:
  square: "0px"
  subtle: "2px"
  pill: "9999px"
spacing:
  gutter: "1.5rem"
  gutter-md: "2.5rem"
  gutter-lg: "4rem"
  section: "6rem"
  section-lg: "9rem"
components:
  gallery-art-frame:
    backgroundColor: "{colors.gallery-wood}"
    rounded: "{rounded.square}"
    padding: "clamp(0.28rem, 0.55vw, 0.5rem)"
  gallery-art-mat:
    backgroundColor: "{colors.gallery-mat}"
    rounded: "{rounded.square}"
    padding: "clamp(0.55rem, 1.4vw, 1.1rem)"
  photo-print:
    backgroundColor: "{colors.photo-paper}"
    rounded: "{rounded.square}"
    padding: "clamp(0.5rem, 1.2vw, 1rem)"
  photo-thumbnail:
    backgroundColor: "transparent"
    rounded: "{rounded.square}"
    padding: "0.25rem 0.35rem 0.6rem"
---

# Design System: Young Portfolio

## Overview

The global gallery entrance opens photography directly, without a separate room-selection page. The homepage's existing two entrances and the in-gallery category links provide access to both collections. Photography retains its map-first arrival; its existing selected-series entry uses an uncropped photograph and authentic series text. Unnamed camera-file titles are displayed as activity name and stable collection order while original metadata remains available. Articles use one chapter list with one entrance per published piece and truthful publication states.

**Creative North Star: "展廳與選片光桌"**

The portfolio uses Japanese editorial spacing to make two bodies of work feel distinct. Digital artwork sits on a warm exhibition wall, held by a restrained wood-tone frame and mat. Photography rests on a cool silver work surface as loose paper prints; a selected print rises slightly above its neighbors. The original images carry the color and detail.

The shared language is quiet stone typography, precise hairlines, sparse terracotta or slate accents, and generous space around each work. Light and dark themes retain the same material relationships. Motion supports the act of looking and yields to reduced-motion preferences.

**Key Characteristics:**

- Warm exhibition wall and cool photographic work surface.
- Original-ratio artwork, small plaques, loose paper prints, and a visible selected state.
- Asymmetric spacing and restrained material depth.
- Distinct art and photography display type over a shared readable body stack.

## Colors

The global stone scale supplies readable text and neutral surfaces; each gallery world adds a local material palette. The frontmatter records the emitted light and dark values. Dark counterparts are set by `.dark` in the source.

### Primary

- **Terracotta** (`terracotta-500`, `terracotta-400`, `terracotta-700`): the rare warm accent for artwork-side labels and emphasis. Its role is an accent, not a large fill.
- **Slate ink** (`photo-accent`): the photography world's cool accent for controls and fine marks.

### Neutral

- **Stone** (`stone-50` through `stone-900`): global background, text, and rule scale. Semantic `--bg`, `--fg-*`, and `--border` variables switch with `.dark`.
- **Exhibition wall and mat** (`gallery-wall`, `gallery-wall-light`, `gallery-mat`): warm wall lighting and the inner surround of framed work. `gallery-wood` grounds the frame; `gallery-ink` and `gallery-muted` label it.
- **Print surface** (`photo-world`, `photo-paper`): cool silver page and warm-white physical print. `photo-ink`, `photo-muted`, and `photo-line` serve captions, numbers, and the selection strip.
- **Dark materials** (`gallery-wall-dark`, `gallery-wall-light-dark`, `gallery-wood-dark`, `gallery-mat-dark`, `photo-world-dark`, `photo-paper-dark`): material counterparts rather than simple inversions. Their `*-ink-dark` and `*-muted-dark` values keep labels legible; `photo-line-dark` and `photo-accent-dark` carry the selection marks.

**The Work Leads Rule.** Keep the original artwork and photography in color. Material colors create viewing conditions around each image.

## Typography

**Display Font:** Zen Kaku Gothic New for the artwork world; Shippori Mincho for the photography world, with the listed fallbacks.

**Body Font:** Outfit followed by Noto Sans TC and local system fallbacks. Outside the gallery worlds, Noto Serif JP remains the Japanese display and quotation stack.

**Character:** The artwork title is geometric and measured; the photography title is literary and softer. The shared body stack keeps navigation and supporting information consistent.

### Hierarchy

- **Display:** the homepage's paired world titles use medium weight, the same responsive size, and distinct family and letter spacing. Gallery world headings continue this family split.
- **Exhibition plaque:** the featured work's title uses a compact display size beside the image; date and medium step down to small, quiet labels.
- **Body:** the site defaults to Outfit / Noto Sans TC. Longer Japanese copy in the art world uses a tighter rhythm (`1.85` line height); the photography world uses a more open rhythm (`2.2`).
- **Photo caption:** small body text (`0.75rem`, `1.6` line height) names the selected photograph and displays its position in the series.
- **Labels:** use tabular numerals for counts and frame numbers; keep them secondary to the work.

**The Two Voices Rule.** Preserve the difference between the art world's geometric title and the photography world's Mincho title while keeping shared controls legible.

## Layout

The site uses a `72rem` content maximum and responsive gutters. Section spacing is `6rem` or `9rem` where a larger pause is needed. The homepage places the two entry worlds side by side on desktop; at widths below `1024px` they stack vertically around a single dividing spine.

The exhibition opens with one prominent work and a nearby plaque, then continues through year rooms. Each room holds two columns above `767px` and one column below. Frames size from the artwork's ratio rather than forcing a common crop. The photo activity's light table sizes the selected paper to its photograph's ratio and places three smaller neighbors across the desktop surface; below `640px`, the selected print and two small neighbors occupy separate columns, and the thumbnail strip remains horizontally scrollable.

The photography overview places a full-width location map before its activity directory. Every activity in the nearby region appears as its own circular photo, including activities with shared coordinates: neighboring circles fan outward instead of collapsing into a count. The selected circle is larger. Remote activities appear in their own inset until the visitor chooses the all-locations view; that view shows every activity on the main map and hides the inset. A single 1px film edge keeps the map surface quiet.

**The Viewing Distance Rule.** Give the selected work the most space, then let captions and neighboring works provide scale and context.

## Elevation & Depth

Global surfaces use very light ambient shadows. The exhibition frame has a firmer wall shadow and a subtle upward response on hover or keyboard focus. The light table uses offset paper shadows, with the selected print casting the strongest one. Wall lighting and the exhibition floor line add depth without covering the work.

### Shadow Vocabulary

- **Global ambient:** `0 2px 8px rgba(168, 162, 158, 0.10), 0 1px 3px rgba(168, 162, 158, 0.05)` for quiet general surfaces.
- **Exhibition frame:** `2px 3px 5px rgba(31, 24, 18, 0.18), 8px 18px 32px -10px rgba(31, 24, 18, 0.32)` for the framed artwork at rest.
- **Loose print:** `3px 14px 22px -9px rgb(44 48 46 / 28%)` for neighboring prints.
- **Selected print:** `5px 25px 35px -13px rgb(36 42 43 / 35%)` to distinguish the currently chosen photograph.

**The Material Depth Rule.** Shadows describe wood on a wall and paper on a table. Use stronger depth only where selection or interaction raises the work.

## Shapes

Exhibition frames, mats, and photographic paper have square edges. Hairlines and mat margins do more work than rounded containers. The overview map uses circular photo markers to reveal individual activities; the full photographs keep their original proportions in the activity gallery. Existing small metadata chips use a pill shape. A tiny `2px` radius appears on secondary color washes, not on frames or prints.

## Components

### Gallery entry links

The homepage presents two complete image-led links. The art link contains a framed original work on a warm wall; the photography link contains overlapping prints on a cool surface. Their text sits in a separate caption region. Hover and keyboard focus raise the featured physical object; a visible outline marks keyboard focus.

### Exhibition frames and plaques

A dark wood-tone outer frame surrounds a warm mat. Art retains its source aspect ratio. A small label beside the featured work gives its title, date, and medium; later rooms put compact plaques below each work. The framed image button opens the existing large-image viewer.

### Photography prints and selection strip

The main print uses warm-white paper sized to the photograph's ratio, a strong offset shadow, and a caption below. Neighboring prints use smaller paper, slight rotations, and lighter shadows. Selecting a neighbor or thumbnail changes the local selection within the visible event collection; activating the main print opens the large-image viewer. A shared `?image=` link takes precedence if stale search or year filters hide its photograph: the route owner clears those filters and opens the event's complete time-ordered set. The strip marks its active thumbnail with an underline and `aria-pressed` state. Keyboard arrows and Home/End move through the strip.

### Photography overview map

The map uses the same cool slate surface and warm paper as the light table. Each 48px desktop or 44px mobile circle shows a cropped representative photograph; the selected circle grows to 64px or 56px. Nearby coordinates fan into visible groups, including activities at the same location, with short lines back to their real map anchors where visible. Each circle group exposes one Tab stop; Arrow keys and Home/End move focus and selection within it, then Tab reaches the next group or selected-activity footer. The footer names the activity, location and accuracy, time range, and image count, and opens its gallery. The all-locations control fits the entire collection; “近景” restores the nearby region. The map saves its viewport, selected activity, and all-locations mode for the return from a gallery. Only the main map displays OpenStreetMap attribution for the shared tile source.

### Small metadata chips

Existing metadata chips are quiet stone pills with a fine border. The interactive filter variant gains a light tint and border emphasis on hover and selection. Keep descriptive metadata visually distinct from an operable filter.

### Navigation and focus

Navigation inherits the shared body typography and neutral palette. Image-led links, framed artwork, prints, and thumbnails need an unambiguous `:focus-visible` treatment. Reduced motion removes the lift transition while preserving the selected and focused states.

## Do's and Don'ts

### Do:

- **Do** preserve original image identity, color, and aspect ratio in the work display.
- **Do** use warm wall, wood, and mat for the exhibition, and cool surface plus paper for photography.
- **Do** show light and dark material variants and a visible keyboard focus state.
- **Do** make motion optional under `prefers-reduced-motion: reduce`.

### Don't:

- **Don't** let ornamental graphics or interface chrome compete with the actual work.
- **Don't** make the museum frame or print stack a site-wide treatment for unrelated content.
- **Don't** turn the photography selection strip into a second owner of the image URL or global scroll lock.
