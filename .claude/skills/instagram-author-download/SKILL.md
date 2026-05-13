---
name: instagram-author-download
description: Download public images from an Instagram author profile with Playwright CLI. Use when the user asks to grab, save, scrape, or collect images from an Instagram account, especially from an already logged-in Edge session.
---

# Instagram Author Download

## When to use

Use this skill when the user wants reference images from a public Instagram author page.

Typical prompts:

- "幫我抓這個 IG 作者幾張圖"
- "download some images from this Instagram account"
- "從這個 IG 帳號存幾張圖"

## Defaults

- Prefer `playwright-cli`.
- Prefer the user's existing logged-in Edge session — Instagram aggressively blocks logged-out and automated browsing.
- Save files to `downloads/ig-<username>/`.
- Only download public content. Do not bypass private accounts or stories.

## Workflow

1. Read the target profile URL or username.
2. Attach to a logged-in Edge instead of opening a fresh browser. Instagram usually shows a login wall to fresh Playwright browsers.
   - Run `playwright-cli attach --cdp=msedge`.
   - If it fails with `DevToolsActivePort file not found`, ask the user to enable remote debugging in Edge (`chrome://inspect/#remote-debugging`) and retry.
   - On Windows, prefer `127.0.0.1` over `localhost` when specifying CDP endpoints.
   - Do not close or relaunch the user's Edge unless they explicitly approve it.
3. When attached, prefer reusing an already-open `https://www.instagram.com/<username>/` tab:
   - Parse `playwright-cli --raw tab-list`
   - `tab-select` the best match
   - Only open a new tab when no match exists (or the user passes `-ForceNewTab` to the bundled script).
4. Ensure the active tab is on the profile page (not Reels / Tagged / a specific post), then extract.
5. Extract image URLs from the post grid, pick the largest variant from each `srcset`, and deduplicate by the CDN basename (the `<hash>_n.jpg` part is the stable identity).
6. Download a small batch first, usually 6 images (or `-All` to sweep everything found after scroll-to-stability).
7. Verify the downloaded files exist and have non-zero size.

## Commands

### Attach to logged-in Edge

```powershell
playwright-cli attach --cdp=msedge
playwright-cli tab-new "https://www.instagram.com/<username>/"
playwright-cli tab-list
```

### Extract original media URLs

Use the bundled helper script:

```powershell
playwright-cli run-code --filename=".claude/skills/instagram-author-download/scripts/extract-ig-media-urls.js"
```

The script:

- Scrolls the profile feed until the URL list stops growing.
- Picks images that live under post / reel links (`a[href*="/p/"]`, `a[href*="/reel/"]`) so profile photo, suggested-user thumbs, and story rings are excluded.
- Returns the highest-resolution candidate from each `srcset`.

### One-command download

```powershell
powershell -ExecutionPolicy Bypass -File ".claude/skills/instagram-author-download/scripts/download-ig-author-images.ps1" -Username "yu198877526" -Count 6 -AttachEdge
```

#### Presets

The `-Preset` switch packs the common flag combinations:

| Preset | Equivalent flags | Use when |
|---|---|---|
| `Quick`  | `-Count 12 -AttachEdge -Resume`                       | grab a fast small batch of grid thumbnails |
| `Sample` | `-Count 3 -AttachEdge -Resume -IncludeCarousel`       | sanity-check the carousel pipeline on 3 posts |
| `Full`   | `-All -AttachEdge -Resume -IncludeCarousel`           | full sweep, every image of every post (slow) |

```powershell
# Quick
powershell -ExecutionPolicy Bypass -File ".claude/skills/instagram-author-download/scripts/download-ig-author-images.ps1" -Username "yu198877526" -Preset Quick

# Sample (carousel walkthrough on 3 posts)
powershell -ExecutionPolicy Bypass -File ".claude/skills/instagram-author-download/scripts/download-ig-author-images.ps1" -Username "yu198877526" -Preset Sample

# Full sweep
powershell -ExecutionPolicy Bypass -File ".claude/skills/instagram-author-download/scripts/download-ig-author-images.ps1" -Username "yu198877526" -Preset Full
```

Sweep everything currently visible after a full scroll:

```powershell
powershell -ExecutionPolicy Bypass -File ".claude/skills/instagram-author-download/scripts/download-ig-author-images.ps1" -Username "yu198877526" -All -AttachEdge -Resume
```

Same sweep, but also walking each post's carousel for every image (batched per `-BatchSize` posts, image network loads aborted, downloads run in parallel via `-Concurrency`):

```powershell
powershell -ExecutionPolicy Bypass -File ".claude/skills/instagram-author-download/scripts/download-ig-author-images.ps1" -Username "yu198877526" -All -AttachEdge -Resume -IncludeCarousel
```

What it does:

- optionally attaches to the current logged-in Edge
- prefers an already-open `https://www.instagram.com/<username>/` tab when `-AttachEdge` is set
- otherwise opens a new tab for the profile
- scrolls the grid with human-ish pacing (random 600–1100px wheel, 0.9–1.6s pauses, occasional micro-scroll-back), collecting post URLs and thumbnails until the list stops growing
- caches the grid result to `<OutputDir>/_meta/posts.json` so re-runs with `-Resume` skip the scroll entirely
- with `-IncludeCarousel`, batches `-BatchSize` posts per `playwright-cli` call and inside that call uses `page.route(..., resourceType in {image,media,font} → abort)` to skip pixel downloads — only the DOM `img.src` is needed
- walks the carousel via the locale-aware "Next" button, collecting every slide
- filters post photos by URL convention (`/v/t51.<x>-15/`) — IG profile pics use `-19/` and are excluded
- picks the largest variant from each `srcset`
- deduplicates by the CDN basename (`<hash>_n.jpg`)
- downloads images into `downloads/ig-<username>/` named like `<basename>.jpg` via a runspace pool (`-Concurrency`)
- with `-Resume`, skips non-empty files that already exist
- prints a summary line (`posts_found`, `posts_selected`, `posts_visited`, `batch_calls`, `used_cached_posts`, `unique_image_urls`, `concurrency`, `downloaded`, `skipped`, `failed`)

Script options:

- `-Username`: required IG username without `https://www.instagram.com/`
- `-Count`: number of images, default `6` when neither `-All` nor `-Count` is provided
- `-All`: download every unique image found after scrolling the grid to stability
- `-AttachEdge`: attach to an already logged-in Edge
- `-OpenFreshEdge`: open a fresh automated Edge instead (usually hits a login wall)
- `-OutputDir`: override the default output directory
- `-Resume`: skip downloads when the destination file already exists and is non-empty; also reuse the cached post URL list at `<OutputDir>/_meta/posts.json` instead of re-scrolling the grid
- `-ForceNewTab`: always open a new tab (disables the default "reuse existing profile tab" behavior)
- `-IncludeCarousel`: for each selected post, navigate into `/p/<shortcode>/` and walk through the carousel ("下一步" / "下一個" / "Next" / "次へ" buttons) to collect every image. Without this flag, only the grid thumbnail (first image of each post) is downloaded.
- `-BatchSize` (default `25`): number of posts processed per `playwright-cli run-code` invocation in carousel mode. Larger = fewer Node startups; smaller = more failure-resilience.
- `-Concurrency` (default `6`): number of parallel image downloads via runspace pool. Set `1` for sequential.

## Performance architecture

The carousel-walking path is the slow one. Three optimizations that matter:

1. **Image route abort inside the batch script.** Once on a post page we only need `img.src` to be set by IG's React — we never display the image. `await page.route('**', r => ...)` aborts every `resourceType` in `{image, media, font}`. Cuts per-post load from ~3–4s to ~1s, and saves bandwidth.
2. **Chunked single-call batching.** `extract-ig-posts-batch.js` accepts `process.env.IG_POSTS` (JSON of post URLs) and walks them all inside one `playwright-cli run-code` invocation. PowerShell processes 25 posts per call (`-BatchSize`), eliminating ~24× Node startup cost compared to one call per post.
3. **Parallel downloads via a runspace pool.** Sequential `Invoke-WebRequest` is dominated by TLS setup. Six concurrent runspaces (`-Concurrency`) typically gives 4–6× wall-clock speedup with no extra dependencies.

Cache: the grid post list is written to `<OutputDir>/_meta/posts.json` after a successful scroll. Re-runs with `-Resume` load that file and skip the grid scroll entirely. Delete this file to force a fresh scroll.

## Practical notes

- On PowerShell, use `;` between commands instead of `&&`.
- Logged-in Edge is essentially required. A fresh Playwright Edge will usually see only a login wall and produce zero post URLs.
- The grid is virtualized. Off-screen posts unmount, so the script collects URLs **during** scroll, not after.
- Instagram images come from `scontent-*.cdninstagram.com` or `*.fbcdn.net`. The same image may be served under different `_nc_ohc` / signature query strings — dedupe on the URL **path** basename, not on the full URL.
- Post photo vs avatar is distinguishable by the CDN path: `/v/t51.<x>-15/` is post content, `/v/t51.<x>-19/` is profile / avatar. The carousel walker uses this to skip headers.
- The "next" button is locale-aware: zh-tw says `下一步`, zh-cn says `下一個`, ja says `次へ`, en says `Next`. All four are matched.
- Carousel walking uses a viewport heuristic — slides sit at `top<200` and `>=400x400`; the suggested-posts row below sits at `top>~750`. Don't lift these without re-probing IG's layout.
- The largest size Instagram normally serves on web is 1080w. `srcset` candidates above that are uncommon; pick the max regardless.
- Some grid tiles are video / reel covers (still `<img>` elements). The cover is downloaded as a jpg — there is no separate "is video" filter unless the user explicitly wants to skip those.
- Direct download with `Invoke-WebRequest` works on the signed CDN URLs without cookies, but signatures expire (~a few hours). Don't cache an old extracted URL list across days.
- **`URL` is not a Node global in `playwright-cli run-code`.** Do all URL parsing inside `page.evaluate(...)` (browser context). Pulling it out into the Playwright Node side throws `ReferenceError: URL is not defined` silently and the script returns `[]`.
- `process.env` **does** work in `run-code` (the function is wrapped via `new Function(...)` in regular Node, so Node globals are visible). The batch script uses `process.env.IG_POSTS` to receive its chunk of post URLs.
- Image-load aborts inside `page.route` are safe for URL extraction because IG's React assigns `img.src` and `srcset` before the browser fetches — aborting the fetch leaves the DOM attributes intact.
- PowerShell JSON gotcha: `ConvertFrom-Json` may return a single string for a one-element JSON array. Normalize to a string array before iterating.

## Troubleshooting

- Attach fails with `DevToolsActivePort file not found`:
  Ask the user to enable remote debugging in the current Edge instance and retry.
- Attach fails with `Could not connect to msedge` / cannot connect to `ws://localhost:9222`:
  Remote debugging is not enabled for the running Edge. Ask the user to enable it and retry.
- Extraction returns 0 URLs:
  Most likely the page is at a login wall or in a non-grid view (Reels / Tagged / a single post). Confirm the active tab is the profile root.
- Download returns `403 Forbidden`:
  The signed CDN URL has expired. Re-run extraction to refresh signatures, then download immediately.
- The grid loads slowly and the script stops too early:
  Increase scroll patience via the constants in `extract-ig-media-urls.js` (`maxSteps`, `maxStableRounds`), or run again — the dedupe by basename means re-runs just top up the set.

## Output

In the final reply:

- Tell the user where the files were saved.
- List the downloaded filenames (or count, if many).
- Mention whether you verified file sizes.
