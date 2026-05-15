---
name: boot-worktree
description: One-shot setup for a freshly-entered git worktree — junction node_modules from the main repo, start Nuxt dev on the next free port bypassing the Node 22 gate, and write .dev-ready.json with the URL. Invoke right after EnterWorktree, before /visual-baseline-gallery or anything that needs a running dev server.
allowed-tools: Bash(node:*) Bash(npm:*) Bash(grep:*) Bash(ls:*) Bash(rm:*) Bash(cat:*) PowerShell(*) Read Write
---

# Boot Worktree

Removes the friction stack between `EnterWorktree` and `/visual-baseline-gallery`:

1. Worktrees don't share `node_modules` → must junction from main repo
2. `predev` runs `check-node.mjs` which gates on Node 22 → must set `SKIP_NODE_CHECK=1` (post-2026-05-15)
3. Default port (3000) is often taken by the human's already-running dev server → must pick a free port and remember it
4. Nuxt's "Local:" log line has ANSI colour codes → naive regex misses it

This skill collapses those into one procedure with a deterministic ready-state file.

## When to use

- Right after `EnterWorktree` succeeds, before any task that needs the dev server
- When `/visual-baseline-gallery` fails with "ECONNREFUSED 3000" — means no boot ran yet
- NOT for the main repo workflow — the human's dev server flow uses `npm run dev` directly

## Procedure

Run these from the worktree root. **Each step is one tool call**; don't chain them with `&&` — branching on intermediate state is easier when each step is discrete.

### 1. Junction node_modules (idempotent)

```powershell
if (-not (Test-Path node_modules)) {
  $repoRoot = (git worktree list | Select-Object -First 1).ToString().Split(' ')[0]
  New-Item -ItemType Junction -Path "node_modules" -Target "$repoRoot\node_modules" | Out-Null
  Write-Output "junction → $repoRoot\node_modules"
} else {
  Write-Output "node_modules already present"
}
```

On POSIX:
```bash
[ -e node_modules ] || ln -s "$(git worktree list | head -1 | awk '{print $1}')/node_modules" node_modules
```

### 2. Pick a free port

```bash
# Find first available port from 3003 upward (3000–3002 usually taken by the human's dev)
PORT=$(node -e "
const net = require('net');
const tryPort = (p) => new Promise(r => {
  const s = net.createServer().listen(p).on('listening', () => s.close(() => r(p))).on('error', () => r(null));
});
(async () => {
  for (let p = 3003; p < 3015; p++) {
    const ok = await tryPort(p);
    if (ok) { console.log(ok); return; }
  }
  process.exit(1);
})();
")
echo "PORT=$PORT"
```

### 3. Start dev in background, capture logs

PowerShell (Windows — preferred since Node 22 gate is set via `$env:`):
```powershell
$env:SKIP_NODE_CHECK = "1"
$env:NUXT_TELEMETRY_DISABLED = "1"
Start-Process -FilePath ".\node_modules\.bin\nuxt.cmd" `
  -ArgumentList "dev","--port","$env:PORT" `
  -RedirectStandardOutput ".dev.log" `
  -RedirectStandardError ".dev.err.log" `
  -PassThru -NoNewWindow | Select-Object -ExpandProperty Id | Set-Content ".dev.pid"
```

Bash:
```bash
SKIP_NODE_CHECK=1 NUXT_TELEMETRY_DISABLED=1 \
  node_modules/.bin/nuxt dev --port "$PORT" \
  > .dev.log 2> .dev.err.log &
echo $! > .dev.pid
```

### 4. Wait for ready (run_in_background)

```bash
# Use Bash with run_in_background:true. Nuxt prints "Local:" with ANSI codes —
# strip them before grep. grep -F is safe because the literal "Local:" never
# contains ANSI in the printable form.
until grep -aE "\\bLocal: " .dev.log >/dev/null 2>&1; do sleep 1; done
echo "ready"
```

Notification fires when grep matches → dev server is up.

If it hits 60s without firing, read `.dev.err.log` — likely a missing dep or port collision.

### 5. Write .dev-ready.json

```bash
PORT=$(grep -aoE "http://[^/]+:[0-9]+" .dev.log | head -1 | grep -oE "[0-9]+$")
PID=$(cat .dev.pid)
cat > .dev-ready.json <<EOF
{
  "url": "http://localhost:$PORT/young-portfolio/",
  "port": $PORT,
  "pid": $PID,
  "logFile": ".dev.log",
  "errFile": ".dev.err.log"
}
EOF
cat .dev-ready.json
```

Downstream skills (`visual-baseline-gallery`) read `.dev-ready.json` for the port.

## Teardown

When done with the worktree:

```bash
# Kill the dev server
if [ -f .dev.pid ]; then
  kill "$(cat .dev.pid)" 2>/dev/null || taskkill //F //PID "$(cat .dev.pid)" 2>/dev/null
  rm -f .dev.pid .dev-ready.json
fi
```

Or just rely on `ExitWorktree` — the worktree directory disappears, the process leaks until reboot but is harmless (it's listening on a free port).

## Why a junction not `npm install`

The main repo's `node_modules` is ~1.5GB. `npm install` in each worktree:
- Costs 1–2 minutes per boot
- Requires Node 22 (the gate triggers on `preinstall`)
- Duplicates 1.5GB to disk

A junction (Windows) or symlink (POSIX) is instant, share-only, and survives `nuxt prepare`. The trade-off: if the main repo runs `npm install` while the worktree dev is live, hot-reload may briefly break. Don't `npm install` in the main repo during an active worktree session.
