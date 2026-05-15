---
name: ship-inspiration
description: End-to-end pipeline for landing a wiki inspiration card to master. Cherry-picks the worktree commit, runs verification, visually compares before/after via /visual-baseline-gallery, then updates the inspiration file + wiki/index.md + wiki/log.md. Use when user says "ship <slug>", "land <slug>", "把 <slug> ship 到 master", or when promoting from experimenting → shipped.
allowed-tools: Bash(git:*) Bash(npm:*) Bash(npx:*) Read Edit Write Grep Glob
---

# Ship Inspiration

Codifies the exact pipeline used 2026-05-15 to ship `gallery-left-rail`.

## Input

User provides slug: e.g. `gallery-left-rail`. Maps to:
- `wiki/inspirations/<slug>.md` — the proposal
- `worktree-<slug>` branch — usually present at `.claude/worktrees/<slug>/`, with one or more commits ahead of master

If user has a different naming, ask once; don't guess.

## Procedure

### 1. Sanity-read

Read `wiki/inspirations/<slug>.md`. Confirm:
- `status: experimenting`（若已是 shipped/adopted，先問是不是要 re-ship）
- 「狀態」區的 checklist 應 `[x] experimenting` 但 `[ ] shipped/adopted`

If file doesn't exist, stop and ask the user.

### 2. Find the source commit

```bash
git log master..worktree-<slug> --oneline
```

Expect 1 commit (the canonical case). If multiple:
- Group commits and present to user as「要 squash 還是 cherry-pick all-in-order?」 — don't pick yourself
- If 0 commits, the worktree branch never got a feat commit — stop and ask

Get the SHA. Show:

```bash
git show <sha> --stat
```

### 3. Verify clean apply

```bash
git status --short | grep -v '^??' | head
```

Working tree must be clean (no staged/modified tracked files). If dirty, stop and ask user to stash.

### 4. Capture baseline

Call `/visual-baseline-gallery` in `baseline` mode (assumes dev server up; start one if not). This freezes the pre-ship state.

### 5. Cherry-pick

```bash
git cherry-pick <sha>
```

If conflict: stop, surface the file list, ask user how to resolve. Don't auto-resolve.

### 6. Verify the change

```bash
node scripts/check-node.mjs && npx vitest run 2>&1 | tail -8
node scripts/check-node.mjs && npm run typecheck 2>&1 | grep -cE "error TS"
```

- vitest: must show `Tests N passed (N)` with 0 failed (worktrees are excluded since 2026-05-15)
- typecheck: capture count. Compare to master baseline (stash + re-run if unsure). New errors in **changed** files only matter — grep for them:

```bash
git diff --name-only HEAD~1 | xargs -I {} npm run typecheck 2>&1 | grep "{}"
```

If anything's red in changed files, stop. Otherwise continue.

### 7. Capture current + compare

Call `/visual-baseline-gallery` in `current` mode. Read each baseline/current pair, report per-shot diff (intended vs unintended). If unintended regression → stop and ask user.

### 8. Hydration warning audit

While dev server is up, snap browser console:

```bash
npx --no-install playwright-cli -s=vb console 2>&1 | grep -A 2 "Hydration"
```

Diff against `tests/known-hydration-warnings.json`. New entries → flag.

### 9. Update wiki

Three files, in order:

**a. `wiki/inspirations/<slug>.md`**
- Frontmatter: bump `updated:` to today, add `shipped` to `tags`
- 「狀態」section: mark `[x] shipped to master（YYYY-MM-DD，commit <hash>）`
- Add or extend 「驗收（YYYY-MM-DD dev 親檢）」section with the matrix you just captured
- Add 「已知（非本變更引入）」section if hydration audit surfaced anything

**b. `wiki/index.md`**
- Bump 「最後更新」 line (push previous one to 「前次更新」)
- In Inspirations > Experimenting, ensure the slug appears with a `shipped` tag

**c. `wiki/log.md`**
- Prepend a new entry `## [YYYY-MM-DD] meta | <slug> ship — cherry-pick 入 master`
- Include: 觸發、對應 inspiration、選項展示（若有）、ship 路徑、親檢 matrix、已知 bug、紀律 lessons

Each of these is a normal Edit. Don't auto-commit wiki — `wiki/` is gitignored anyway.

### 10. Report

Output the final summary table to user (commit hash, files changed, test counts, visual diff results, known-issues flagged). Ask whether to push (`git push`) — never push autonomously.

## Hard rules

- **Never** force push, `git reset --hard`, or skip hooks.
- **Never** auto-resolve a cherry-pick conflict.
- **Never** mark `adopted` in the wiki — that requires 2-week observation per AGENTS.md convention. Only mark `shipped`.
- **Never** edit `wiki/index.md` 「最後更新」 line without preserving the previous one as 「前次更新」.
- If the user says "stop" or "don't ship", abort cleanly: `git cherry-pick --abort` (if mid-pick) or `git reset HEAD~1` (if just committed) — confirm before either.

## Lessons baked in

- Trust the existing worktree commit if its commit message + diff are clean. Cherry-pick beats re-implement.
- `npm run lint` may fail on Node version; use the Node guard's error to distinguish env vs code issues.
- Hydration warnings noted in `known-hydration-warnings.json` are pre-existing — don't chase them inside a ship pipeline.
