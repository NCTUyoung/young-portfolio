#!/usr/bin/env node
const [major, minor] = process.versions.node.split('.').map(Number)
const SUPPORTED = (major === 22 && minor >= 19) || (major === 24 && minor >= 11) || major >= 26
const REQUIRED = '22.19+, 24.11+, or 26+'

// Escape hatch for environments that have consciously verified compatibility
// with a Node release outside Nuxt's supported engine ranges.
if (process.env.SKIP_NODE_CHECK) {
  if (!SUPPORTED) {
    console.warn(`  ! Node ${REQUIRED} required by Nuxt; running on ${process.version} (SKIP_NODE_CHECK set).`)
  }
  process.exit(0)
}

if (!SUPPORTED) {
  console.error(`\n  ✗ Node ${REQUIRED} required by Nuxt (you have ${process.version}).`)
  console.error(`    .nvmrc pins this — run \`nvm use\` (or fnm / volta) before retrying.`)
  console.error(`    Or set SKIP_NODE_CHECK=1 to bypass (use only when you've verified).\n`)
  process.exit(1)
}
