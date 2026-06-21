#!/usr/bin/env node
/**
 * CVE gate (static-site aware).
 *
 * `npm audit --audit-level=high` red-lights on *any* high/critical advisory in the
 * whole dependency tree — including build/dev-only tooling. This project ships a
 * **static SSG artifact** (`nuxt generate` → plain HTML/CSS/JS on GitHub Pages,
 * zero Node runtime), so a CVE in esbuild's dev server, the ws HMR socket, babel's
 * source-map handling, or shell-quote never reaches production. Those would block
 * every deploy with no actionable non-breaking fix (bumping the pinned esbuild
 * cascades into worse advisories — see wiki/inspirations/non-occluding-hint log
 * 2026-06-21 / commit history).
 *
 * This gate keeps the protection that matters: it still FAILS on any high/critical
 * advisory that is NOT on the explicit allowlist below — so a newly-disclosed CVE,
 * or one that actually reaches the shipped artifact, red-lights as before. The
 * allowlist is build/dev-only tooling, reviewed periodically; drop entries once
 * upstream (Nuxt/Vite) ships patched versions.
 *
 * Run locally the same way CI does:  node scripts/audit-gate.mjs
 */
import { execSync } from 'node:child_process'

/** GHSA id → why it is build/dev-only and safe for a static deploy. Revisit on upgrades. */
const ALLOWLIST = {
  'GHSA-4x5r-pxfx-6jf8': '@babel/core source-map arbitrary file read — build-time transform only',
  'GHSA-g7r4-m6w7-qqqr': 'esbuild dev-server file read (Windows) — dev only, not in SSG output',
  'GHSA-w7jw-789q-3m8p': 'shell-quote newline escaping — build tooling only',
  'GHSA-58qx-3vcg-4xpx': 'ws uninitialized memory — HMR dev socket only',
  'GHSA-96hv-2xvq-fx4p': 'ws fragment DoS — HMR dev socket only',
  'GHSA-fx2h-pf6j-xcff': 'vite dev-server advisory — dev only, not in SSG output',
  'GHSA-mm7m-92g8-7m47': 'nuxt build/SSR advisory — no Node runtime in static deploy'
}

function getAudit () {
  // npm audit exits non-zero when vulnerabilities exist; capture stdout regardless.
  try {
    return execSync('npm audit --json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch (e) {
    if (e.stdout) return e.stdout.toString()
    throw e
  }
}

// Strip a leading BOM (some shells/pipes prepend U+FEFF) without embedding the char in source.
let raw = getAudit()
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1)
const report = JSON.parse(raw)
const vulns = report.vulnerabilities || {}

/** Collect distinct high/critical advisories: { ghsa, pkg, severity, title }. */
const advisories = new Map()
for (const [pkg, v] of Object.entries(vulns)) {
  for (const via of v.via || []) {
    if (typeof via !== 'object' || !via.url) continue
    if (via.severity !== 'high' && via.severity !== 'critical') continue
    const m = via.url.match(/GHSA-[\w-]+/)
    if (m) advisories.set(m[0], { ghsa: m[0], pkg, severity: via.severity, title: via.title })
  }
}

const all = [...advisories.values()].sort((a, b) => a.ghsa.localeCompare(b.ghsa))
const blocking = all.filter(a => !(a.ghsa in ALLOWLIST))
const allowed = all.filter(a => a.ghsa in ALLOWLIST)

if (allowed.length) {
  console.log(`CVE gate: ${allowed.length} high/critical advisory(ies) allowlisted (build/dev-only, not in static output):`)
  for (const a of allowed) console.log(`  · [${a.severity}] ${a.ghsa} ${a.pkg} — ${ALLOWLIST[a.ghsa]}`)
}

if (blocking.length) {
  console.error(`\nCVE gate FAILED: ${blocking.length} non-allowlisted high/critical advisory(ies):`)
  for (const a of blocking) console.error(`  ✗ [${a.severity}] ${a.ghsa} ${a.pkg} — ${a.title}`)
  console.error('\nFix it (npm audit fix / upgrade), or if it is genuinely build/dev-only for this static site, add it to ALLOWLIST in scripts/audit-gate.mjs with a reason.')
  process.exit(1)
}

console.log(`\nCVE gate passed: no non-allowlisted high/critical advisories (${all.length} total high/critical, all allowlisted).`)
