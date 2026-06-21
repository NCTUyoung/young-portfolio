#!/usr/bin/env bash
# Stop hook — wiki bookkeeping drift guard.
# The wiki is its OWN git repo (wiki/.git, gitignored from the main repo — see
# .gitignore "由 wiki/.git 獨立追蹤"), so drift is checked against that sub-repo.
# Fires when wiki CONTENT pages have uncommitted changes but index.md / log.md
# do NOT — the exact drift AGENTS.md §3.1/§4 requires syncing after ingest/lint.
#
# Loop-safe: blocks the Stop at most once. After the reminder, Claude either
# updates the bookkeeping (next stop: no drift -> clean exit) or stops anyway
# (next stop: stop_hook_active=true -> clean exit).

input="$(cat 2>/dev/null || true)"

# Already continuing from a prior Stop-hook block -> let it stop.
if printf '%s' "$input" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -z "$root" ] && exit 0
wiki="$root/wiki"

# Only act when wiki is its own git repo.
git -C "$wiki" rev-parse --git-dir >/dev/null 2>&1 || exit 0

# Porcelain paths are relative to the wiki repo root (e.g. " M index.md").
status="$(git -C "$wiki" status --porcelain 2>/dev/null || true)"
[ -z "$status" ] && exit 0

# Any content page changed? (pages or reference assets)
content_changed="$(printf '%s\n' "$status" | grep -E '(sites|concepts|patterns|system|inspirations)/[^/]+\.md|sources/assets/' || true)"
[ -z "$content_changed" ] && exit 0

# Are the two bookkeeping files among the changes? (only one index.md/log.md exists, at wiki root)
index_changed="$(printf '%s\n' "$status" | grep -E 'index\.md' || true)"
log_changed="$(printf '%s\n' "$status"   | grep -E 'log\.md'   || true)"

missing=""
[ -z "$index_changed" ] && missing="${missing} index.md"
[ -z "$log_changed" ]   && missing="${missing} log.md"
[ -z "$missing" ] && exit 0

# Genuine drift -> block once with a reminder fed back to the model (stderr + exit 2).
echo "wiki 內容頁有未提交變更，但尚未同步：${missing}。依 wiki/AGENTS.md §3.1 步驟 5–6 / §4：每次 ingest/lint 須更新 index.md 對應分區並追加 log.md 條目。請補上後再結束；若本次改動確實不需登錄（例如僅改 sources/assets 或純修字），忽略本提醒直接再結束即可。" >&2
exit 2
