---
name: gallery-visual-diff
description: Pixel-diff the gallery six-shot matrix between tests/screenshots/baseline/ and tests/screenshots/current/. Use after running visual-baseline-gallery in both modes. Invoke when user says "diff the screenshots", "what changed visually", "對比像素差", or as the second half of /ship-inspiration visual verification.
allowed-tools: Bash(node:*) Bash(npm:*) Bash(ls:*) Bash(mkdir:*) Read
---

# Gallery Visual Diff

Pairs with `visual-baseline-gallery`. That skill captures matrices; this one compares them.

## When to use

- After `visual-baseline-gallery` ran in both `baseline` and `current` modes
- During iteration on subtle visual changes (color, spacing, opacity) where eyeballing two PNGs is slow
- As the second half of `/ship-inspiration` — confirms the change landed where intended and didn't leak elsewhere

## How it works

`scripts/visual-diff.mjs` (sharp-based; no extra npm deps) takes two same-size PNGs, emits:
- A red-overlay diff PNG (changed pixels red-tinted, unchanged pixels pale grey)
- JSON to stdout with `{ changedPixels, percent, regions: { tl,tc,tr,ml,mc,mr,bl,bc,br } }`

The 3×3 region breakdown is the fast signal — if `tl + ml + bl` (left column) carries all the diff, the change is rail-local; if it's spread across all 9 cells, you probably regressed a global token.

## Procedure

Output dir: `tests/screenshots/diff/` (gitignored — add to `.gitignore` if not already).

```bash
mkdir -p tests/screenshots/diff

for shot in desktop-overview-top desktop-overview-mid desktop-event-cover tablet-overview-top mobile-overview-top mobile-overview-minibar; do
  echo "=== $shot ==="
  node scripts/visual-diff.mjs \
    tests/screenshots/baseline/$shot.png \
    tests/screenshots/current/$shot.png \
    tests/screenshots/diff/$shot.png
done
```

Then **Read each diff PNG** with the absolute path — they render inline as before/after collapsed onto one image (red = changed).

## Reading the JSON

| Signal | Likely meaning |
|---|---|
| `percent < 0.1%` | Effectively unchanged (subpixel antialiasing only) |
| `percent 0.1–2%` | Surgical change — typical for a targeted edit (one component, one color token) |
| `percent 2–10%` | Broad change — re-layout, font swap, theme touch |
| `percent > 10%` | You either rewrote the page or your dev port is serving the wrong build |
| `regions` concentrated in 1–2 cells | Localised, intended |
| `regions` spread across ≥6 cells | Cross-cutting — likely a global token, double-check it was meant |

## Threshold tuning

Default `--threshold=12` (channel delta out of 255) ignores font antialiasing and JPEG-ish PNG re-compression noise. Bump to `--threshold=24` if you want only "human-eye obvious" diffs. Drop to `--threshold=4` if you're chasing a 1-pixel border move.

```bash
node scripts/visual-diff.mjs baseline.png current.png diff.png --threshold=24
```

## Known noise sources

Two shots tend to register false-positive % even when nothing changed in the code:

- **`desktop-overview-mid.png`** — captured mid-scroll, the masonry timeline is lazy-loaded and reveal-animated. Different runs catch images at different load/reveal stages → red blobs in the `tc + tr` cells that aren't real layout changes.
- **`mobile-overview-minibar.png`** — same problem at smaller scale; the bottom-right image often renders slightly differently between captures.

**How to tell noise from regression**: open the diff PNG. Real layout changes are sharp-edged and follow component bounds (rail column, button area). Lazy-load noise is splotchy and follows image rectangles. If you see splotchy red inside a known image area, it's noise — ignore it.

Future v2: add `waitForNetworkIdle` + animation-complete waits in `visual-baseline-gallery` before each screenshot.

## Failure modes

- **Dimension mismatch** (`exit 3`): one capture went out at the wrong viewport. Re-run that single shot.
- **Missing input** (`exit 2`): you forgot to capture one mode. Run `visual-baseline-gallery` for the missing side.
- **0% diff when you expected change**: dev server might be serving a stale build, or `current/` was captured before the edit hot-reloaded. Touch the file and re-capture.

## Composing with /ship-inspiration

```
1. /visual-baseline-gallery (baseline mode, on master)
2. cherry-pick or implement change
3. /visual-baseline-gallery (current mode)
4. /gallery-visual-diff      ← this skill
5. Read diff PNGs + JSON to decide ship/iterate
```

If diff JSON shows the change is local and intended, the visual gate is passed.
