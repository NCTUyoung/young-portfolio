---
name: x-author-download
description: Download public images from an X/Twitter author profile with Playwright CLI. Use when the user asks to grab, save, scrape, or collect images from an X account, especially from the Media tab or from an already logged-in Edge session.
---

# X Author Download

## When to use

Use this skill when the user wants a few reference images from a public X author page.

Typical prompts:

- "幫我抓這個 X 作者幾張圖"
- "download some images from this X account"
- "從這個作者的 Media 頁存幾張圖"

## Defaults

- Prefer `playwright-cli`.
- Prefer the user's existing logged-in Edge session when available.
- Save files to `downloads/x-<handle>/`.
- Only download public content. Do not bypass protected/private accounts.

## Workflow

1. Read the target profile URL or handle.
2. Try the simplest path first:
   - If the profile is publicly visible, `playwright-cli open --browser=msedge "<url>"`.
   - If X blocks the fresh browser, or the user already has a logged-in Edge, attach to the existing Edge.
3. For attach flow:
   - Run `playwright-cli attach --cdp=msedge`.
   - If it fails with `DevToolsActivePort file not found`, ask the user to open `chrome://inspect/#remote-debugging` in Edge and enable remote debugging for the current browser instance.
   - If it fails while trying to connect to `ws://localhost:9222`, remote debugging is still off or not active for this Edge instance. Ask the user to enable it and retry.
   - On Windows, prefer `127.0.0.1` over `localhost` when manually specifying CDP endpoints (IPv6 edge cases).
   - Do not close or relaunch the user's Edge unless they explicitly approve it.
4. When attached to a real Edge profile, prefer reusing an already-open `https://x.com/<handle>/media` tab:
   - Parse `playwright-cli --raw tab-list`
   - `tab-select` the best match
   - Only open a new tab if no media tab exists (or the user passes `-ForceNewTab` in the bundled script).
5. Ensure the active tab is on `/<handle>/media`, then extract.
6. Extract `pbs.twimg.com/media/` image URLs, convert each to `name=orig`, and deduplicate them.
7. Download a small batch first, usually 4-8 images (or `-All` for full image sweep).
8. Verify the downloaded files exist and have non-zero size.

## Commands

### Attach to logged-in Edge

```powershell
playwright-cli attach --cdp=msedge
playwright-cli tab-new "https://x.com/<handle>"
playwright-cli tab-list
```

### Extract original media URLs

Use the bundled helper script:

```powershell
playwright-cli run-code --filename=".claude/skills/x-author-download/scripts/extract-x-media-urls.js"
```

The script returns an array of `pbs.twimg.com/media/...&name=orig` URLs from the current X media page.

It scrolls the Media grid until the URL list stops growing, so large batches like 100 images are feasible without hand-tuning loop counts.

### One-command download

Use the bundled PowerShell script:

```powershell
powershell -ExecutionPolicy Bypass -File ".claude/skills/x-author-download/scripts/download-x-author-images.ps1" -Handle "_karyln" -Count 6 -AttachEdge
```

Download everything found on the Media grid:

```powershell
powershell -ExecutionPolicy Bypass -File ".claude/skills/x-author-download/scripts/download-x-author-images.ps1" -Handle "_karyln" -All -AttachEdge -Resume
```

What it does:

- optionally attaches to the current logged-in Edge
- prefers an already-open `https://x.com/<handle>/media` tab when `-AttachEdge` is used
- otherwise opens a new tab for the target profile
- navigates to the `Media` page
- extracts original image URLs
- deduplicates by `pbs.twimg.com/media/<id>`
- downloads images into `downloads/x-<handle>/` using filenames like `<mediaId>.<ext>`
- with `-Resume`, skips non-empty files that already exist
- prints a short summary line (`unique_urls`, `downloaded`, `skipped`, `failed`)

### Download images

```powershell
$dir = "downloads/x-<handle>"
New-Item -ItemType Directory -Path $dir -Force | Out-Null
$urls = @(
  "https://pbs.twimg.com/media/....?format=jpg&name=orig"
)
for ($i = 0; $i -lt $urls.Length; $i++) {
  $n = $i + 1
  $out = Join-Path $dir ("x-" + $n.ToString("00") + ".jpg")
  Invoke-WebRequest -Uri $urls[$i] -OutFile $out
}
Get-ChildItem $dir | Format-Table -Property Name,Length -HideTableHeaders
```

Script options:

- `-Handle`: required X handle without `https://x.com/`
- `-Count`: number of images to download, default `6` when neither `-All` nor `-Count` is provided
- `-All`: download all unique image media IDs discovered after scrolling the Media grid to stability
- `-AttachEdge`: attach to an already logged-in Edge
- `-OpenFreshEdge`: open a fresh automated Edge instead
- `-OutputDir`: override the default output directory
- `-Resume`: skip downloads when the destination file already exists and is non-empty
- `-ForceNewTab`: always open a new tab (disables the default "reuse existing media tab" behavior)

## Practical notes

- On PowerShell, use `;` between commands instead of `&&` for portability.
- Logged-in Edge is usually much more reliable than a fresh automation browser on X.
- The X media grid may not expose tweet `article` elements. If `article` scraping returns nothing, query `img[src*="pbs.twimg.com/media/"]` directly.
- X profile "photos & videos" counts include videos. This workflow counts **unique image media IDs** (`pbs.twimg.com/media/...`) only, so totals can be lower than the UI count.
- Some entries in the Media tab are videos. Ignore non-image media unless the user explicitly asks for videos.
- Use `name=orig` to request the original image size.
- The one-command downloader names files using the X media id, for example `GulLo24XMAArGdy.jpg`.
- PowerShell JSON gotcha: `ConvertFrom-Json` may return a single string for a one-element JSON array. Do not wrap that string with `@(...)` blindly, or it becomes a char array. Normalize to a string array first.

## Troubleshooting

- Attach fails with `DevToolsActivePort file not found`:
  Ask the user to enable remote debugging in the current Edge instance.
- Attach fails with `Could not connect to msedge` / cannot connect to `ws://localhost:9222`:
  Remote debugging is not enabled for the running Edge, or Edge was not launched with an active DevTools port. Ask the user to enable remote debugging in `chrome://inspect/#remote-debugging` and retry.
- Media tab opens but no URLs are found:
  Wait a few seconds, scroll once or twice, then retry extraction.
- The page is visible in MCP/browser tools but not in `playwright-cli`:
  Prefer the attached real Edge session instead of a new Playwright browser.
- PowerShell throws parameter conversion errors mentioning `Url` while looping URLs:
  Usually means URL list parsing regressed into a char array. Fix JSON normalization (single-element JSON array → single string).

## Output

In the final reply:

- Tell the user where the files were saved.
- List the downloaded filenames.
- Mention whether you verified file sizes.
