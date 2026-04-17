# Practical Tips — Gotchas from Real Sessions

Real-world lessons that are **not obvious from the command reference**. Each tip includes the failing symptom and the working pattern.

---

## 1. Shell command chaining: PowerShell vs Bash

`playwright-cli` is commonly chained across multiple calls in one line. The chaining operator **differs by shell**.

### Symptom (Windows / PowerShell)
```powershell
playwright-cli open URL && playwright-cli screenshot
# ParserError: The token '&&' is not a valid statement separator
```

### Fix — use `;` on PowerShell
```powershell
playwright-cli open "http://localhost:3000/"; playwright-cli resize 1440 900; playwright-cli goto "http://localhost:3000/"; playwright-cli screenshot --filename=out.png; playwright-cli close
```

> Bash / zsh use `&&` (stop on error) or `;` (continue on error).
> **PowerShell 5.x only supports `;`**. PowerShell 7+ does support `&&`, but `;` is the portable choice.

---

## 2. `run-code --filename` requires an `async page => { … }` wrapper

The CLI wraps your file content as the body of an outer async function that receives `page`. Anything at the top level is treated as a function-body statement list, not a script.

### Symptom
File contents:
```js
const url = 'http://localhost:3000/'   //  SyntaxError: Unexpected token 'const'
await page.goto(url)                   //  SyntaxError: Unexpected identifier 'page'
```

### Fix — wrap in an arrow function
```js
// scripts/_pw-task.js
async page => {
  const url = 'http://localhost:3000/'
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'out.png' })
  return { ok: true }
}
```

Run:
```bash
playwright-cli run-code --filename=scripts/_pw-task.js
```

The CLI echoes back the wrapped code (`await (async page => { … })(page)`), confirming the wrapper expectation.

---

## 3. There is **no** `playwright-cli wait` command

Do not try `playwright-cli wait 2` — the binary will print full help and exit. Waiting belongs either in the shell layer or inside `run-code`/`eval`.

### Fix A — insert a sleep at the shell layer (same `default` session)
```powershell
playwright-cli goto "http://localhost:3000/"
Start-Sleep -Milliseconds 2500
playwright-cli screenshot --filename=after-reveal.png
```
Bash equivalent: `sleep 2.5`.

### Fix B — wait inside `run-code`
```bash
playwright-cli run-code "async page => { await page.waitForTimeout(2500) }"
```

### Fix C — wait on a real signal (preferred when possible)
```bash
playwright-cli run-code "async page => { await page.waitForLoadState('networkidle') }"
playwright-cli run-code "async page => { await page.locator('.hero-loaded').waitFor() }"
```

---

## 4. Scroll-reveal / IntersectionObserver animations ruin first-paint screenshots

Sites using reveal-on-scroll classes (`opacity: 0 → 1` after IntersectionObserver fires) will screenshot as **blank text** if you screenshot immediately after `goto`.

### Symptom
`goto` → `screenshot` produces a page where headings and body copy are missing, but the nav bar is visible.

### Fix A — sleep long enough for all delayed reveals to play
```powershell
playwright-cli goto "http://localhost:3000/"
Start-Sleep -Milliseconds 2500   # covers reveal-delay-1/2/3
playwright-cli screenshot --filename=full.png
```

### Fix B — disable animations with `prefers-reduced-motion`
Only works if the site respects this media query:
```bash
playwright-cli run-code "async page => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('http://localhost:3000/')
}"
```

### Fix C — scroll through the page and screenshot per viewport
Best for long pages where reveals are spread across the scroll. See `scripts/_pw-screenshots.js` pattern:
```js
async page => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(url, { waitUntil: 'networkidle' })
  const total = await page.evaluate(() => document.documentElement.scrollHeight)
  const vh = 900
  for (let i = 0; i < Math.ceil(total / vh); i++) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), i * vh)
    await page.waitForTimeout(650)   // let IO + transitions settle
    await page.screenshot({ path: `home-${String(i + 1).padStart(2, '0')}.png` })
  }
}
```

---

## 5. A/B visual comparison without touching source code

Comparing multiple hero images, themes, or copy variants without editing `.vue`/`.tsx`/`.css`: hot-swap the DOM node via `page.evaluate` and screenshot each variant. Framework reactivity does **not** overwrite attribute changes made from outside unless the underlying reactive value actually changes.

### Pattern
```js
// scripts/_pw-hero-candidates.js
async page => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const candidates = [
    { slug: '01-snow',   src: '/images/snow.webp'   },
    { slug: '02-forest', src: '/images/forest.webp' },
    { slug: '03-city',   src: '/images/city.webp'   }
  ]

  const results = []
  for (const c of candidates) {
    await page.evaluate((src) => {
      const img = document.querySelector('section img')  // tweak selector per page
      if (img) img.setAttribute('src', src)
    }, c.src)
    await page.waitForTimeout(1200)                       // let the new image decode
    const file = `hero-candidate-${c.slug}.png`
    await page.screenshot({ path: file, type: 'png' })
    results.push({ slug: c.slug, file })
  }
  return { results }
}
```

Also useful: hide the element entirely to preview a no-photo/blank-state variant.
```js
await page.evaluate(() => {
  const img = document.querySelector('section img')
  if (img) img.style.display = 'none'
})
await page.screenshot({ path: 'hero-no-photo.png' })
```

> Caveat: If the framework later triggers a re-render (e.g. route change, Vue HMR, React state update that re-binds `src`), your DOM edit gets reverted. Stay on the same page and do all comparisons in a single session.

---

## 6. Non-ASCII paths must be URL-encoded per segment

Serving assets from folders that contain CJK characters, spaces, or other non-ASCII bytes: the browser will 404 unless each path segment is individually encoded.

### Symptom
```
Failed to load resource: 404 (Page not found: .../photography/峨嵋湖風鈴木/DSC_1823.webp)
```

### Fix
```js
const toUrl = (relativePath) => {
  const rel = relativePath.replace(/\.[^.]+$/i, '') + '.webp'
  const enc = rel.split('/').map(encodeURIComponent).join('/')
  return `/app-base/images/_thumbs/800w/${enc}`
}
toUrl('photography/峨嵋湖風鈴木/DSC_1823-編輯-1.jpg')
// → /app-base/images/_thumbs/800w/photography/%E5%B3%A8%E5%B5%8B%E6%B9%96%E9%A2%A8%E9%88%B4%E6%9C%A8/DSC_1823-%E7%B7%A8%E8%BC%AF-1.webp
```

Also keep **screenshot filenames** ASCII-only — terminal logs and CI artifacts often render CJK filenames as mojibake.

---

## 7. Sessions persist across calls — don't re-`open`

The `default` session stays alive between independent `playwright-cli` invocations until you explicitly `close`. Re-running `open` on a live session is tolerated but unnecessary, and running `screenshot` **without** any prior `open` in the shell lifetime fails with:

```
The browser 'default' is not open, please run open first
```

### Idiomatic full flow (PowerShell, same session)
```powershell
playwright-cli open "http://localhost:3000/"
playwright-cli resize 1440 900
playwright-cli goto "http://localhost:3000/"
Start-Sleep -Milliseconds 2500
playwright-cli screenshot --filename=desktop.png

playwright-cli resize 390 844
playwright-cli goto "http://localhost:3000/"
Start-Sleep -Milliseconds 2500
playwright-cli screenshot --filename=mobile.png

playwright-cli close
```

For parallel work across sessions use `-s=<name>`:
```powershell
playwright-cli -s=a open URL
playwright-cli -s=b open URL
playwright-cli -s=a screenshot --filename=a.png
playwright-cli -s=b screenshot --filename=b.png
playwright-cli close-all
```

---

## 8. Check whether a dev server is already running before `npm run dev`

Starting a second dev server makes Nuxt/Vite pick a different port (`3000 → 3001 → 3002…`), silently breaking any hard-coded URL in your scripts.

### Pattern
```powershell
# Inspect the terminals folder first: look for an existing "npm run dev" process and its port
# Then either reuse that port, or stop the old server:
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
# or kill the pid you started earlier:
taskkill /F /PID <pid>
```

If you must start fresh, read the first few lines of the new terminal output to grab the actual port (`Local: http://localhost:3003/...`) before hard-coding it into a script.

---

## Quick checklist before running any screenshot workflow

- [ ] Correct shell separator (`;` on PowerShell, `&&` on Bash)
- [ ] Dev server running? On what port?
- [ ] `playwright-cli open` called at least once in this shell lifetime?
- [ ] Waited long enough after `goto` for reveal animations / font swaps / image decode?
- [ ] Non-ASCII paths URL-encoded per segment?
- [ ] Screenshot filenames are ASCII?
- [ ] `run-code` scripts wrapped in `async page => { … }`?
