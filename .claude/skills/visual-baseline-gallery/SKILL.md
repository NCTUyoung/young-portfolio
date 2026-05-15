---
name: visual-baseline-gallery
description: Capture and diff gallery UI screenshots across desktop / tablet / mobile widths and key scroll states. Use before/after any change to gallery layout, header, hero, or any chrome that affects multiple viewports. Invoke when user says "visual baseline", "拍 baseline", "對比改動前後", "screenshot the gallery", or as part of /ship-inspiration verification.
allowed-tools: Bash(npx:*) Bash(npm:*) Bash(ls:*) Bash(rm:*) Bash(mkdir:*) Read Write
---

# Visual Baseline — Gallery

Cheap, deterministic, single-purpose: capture a fixed screenshot matrix of the gallery page so UI changes get instant before/after.

## When to use

- Before a refactor / redesign of any `/gallery/**` route → run `baseline`
- After your change → run `current`, then compare
- As the visual gate inside `/ship-inspiration`

## Matrix

| Width × Height | Route | Scroll | Filename |
|---|---|---|---|
| 1440 × 900 | `/gallery/photography` | 0 | `desktop-overview-top.png` |
| 1440 × 900 | `/gallery/photography` | 1500 | `desktop-overview-mid.png` |
| 1440 × 900 | `/gallery/photography/Annber 外拍` | 0 | `desktop-event-cover.png` |
| 768 × 1024 | `/gallery/photography` | 0 | `tablet-overview-top.png` |
| 375 × 800 | `/gallery/photography` | 0 | `mobile-overview-top.png` |
| 375 × 800 | `/gallery/photography` | 700 | `mobile-overview-minibar.png` |

Six shots cover: lg+ rail / md fallback / sm top-stack / sticky mini bar / event-mode cover.

## Procedure

### 1. Pre-flight

Dev server must be running. The base URL is resolved in this priority order:

1. `BASE_URL` env var if set — full URL like `http://localhost:3007/young-portfolio`
2. `.dev-ready.json` in the working directory (written by `/boot-worktree`) — uses `url` field
3. Default `http://localhost:3000/young-portfolio`

```bash
# Resolve BASE_URL: env > .dev-ready.json > default
if [ -z "$BASE_URL" ] && [ -f .dev-ready.json ]; then
  BASE_URL=$(node -e "console.log(require('./.dev-ready.json').url.replace(/\\/$/, ''))")
fi
BASE_URL="${BASE_URL:-http://localhost:3000/young-portfolio}"
echo "BASE_URL=$BASE_URL"
```

If neither dev nor `.dev-ready.json` exist, run `/boot-worktree` (worktree workflow) or `npm run dev` (main repo) first.

Output dir: `tests/screenshots/baseline/` for the canonical set, `tests/screenshots/current/` for the post-change set. `current/` is gitignored; `baseline/` is committed.

### 2. Capture (baseline OR current mode)

Set `MODE` to `baseline` or `current`. Then run the matrix using the resolved `$BASE_URL`:

```bash
MODE=baseline   # or: current
OUT="tests/screenshots/$MODE"
mkdir -p "$OUT"

# Open session
npx --no-install playwright-cli -s=vb open "$BASE_URL/gallery/photography"

# 1440 × 900 — desktop overview top
npx --no-install playwright-cli -s=vb resize 1440 900
npx --no-install playwright-cli -s=vb eval "window.scrollTo(0, 0)"
npx --no-install playwright-cli -s=vb screenshot --filename="$OUT/desktop-overview-top.png"

# 1440 × 900 — desktop overview mid (scroll past hero into timeline)
npx --no-install playwright-cli -s=vb eval "window.scrollTo(0, 1500)"
npx --no-install playwright-cli -s=vb screenshot --filename="$OUT/desktop-overview-mid.png"

# 1440 × 900 — desktop event mode (immersive cover + rail)
npx --no-install playwright-cli -s=vb goto "$BASE_URL/gallery/photography/Annber%20%E5%A4%96%E6%8B%8D"
npx --no-install playwright-cli -s=vb eval "window.scrollTo(0, 0)"
npx --no-install playwright-cli -s=vb screenshot --filename="$OUT/desktop-event-cover.png"

# 768 × 1024 — tablet overview
npx --no-install playwright-cli -s=vb goto "$BASE_URL/gallery/photography"
npx --no-install playwright-cli -s=vb resize 768 1024
npx --no-install playwright-cli -s=vb eval "window.scrollTo(0, 0)"
npx --no-install playwright-cli -s=vb screenshot --filename="$OUT/tablet-overview-top.png"

# 375 × 800 — mobile overview top
npx --no-install playwright-cli -s=vb resize 375 800
npx --no-install playwright-cli -s=vb eval "window.scrollTo(0, 0)"
npx --no-install playwright-cli -s=vb screenshot --filename="$OUT/mobile-overview-top.png"

# 375 × 800 — mobile overview scrolled (mini bar visible)
npx --no-install playwright-cli -s=vb eval "window.scrollTo(0, 700)"
npx --no-install playwright-cli -s=vb screenshot --filename="$OUT/mobile-overview-minibar.png"

# Cleanup
npx --no-install playwright-cli -s=vb close
```

> Run each `playwright-cli` line as its own Bash call. Chaining them with `&&` in a single call costs more time and obscures which step failed. Where multiple lines have no shared state dependency (e.g. multiple resize/scroll/screenshot triples for **different** widths), batch into parallel tool calls.

### 3. Compare

After capturing `current/`, prefer the pixel diff over eyeball — invoke `/gallery-visual-diff`. It loops the matrix, emits red-overlay PNGs into `tests/screenshots/diff/`, and prints per-shot JSON `{ percent, regions: { tl…br } }`. Read each diff PNG once, glance at the JSON, and report:

- `percent < 0.1` → effectively unchanged
- Intended diff → describe in one sentence with the dominant region cells (e.g. "all change concentrated in `tl + ml + bl` — rail column only")
- Unintended diff → flag with file path + viewport + region

For one-off subjective checks (typography, hover states) you can still Read the baseline/current pair directly, but for repeatable iteration the diff skill is faster and more honest about what actually changed.

## Known hydration warnings

While capturing, console may show Vue hydration mismatches. See `tests/known-hydration-warnings.json` — if the noise matches the listed cases (`useGalleryEventRoute` SSR sync gap on event-mode), ignore. Anything outside that list is new and should be reported.

## Adding new routes

If you start screenshotting `/article` or `/`, add a new matrix table above and copy the procedure. Don't try to make this skill route-generic — explicit routes are easier to read than parameterized loops.
