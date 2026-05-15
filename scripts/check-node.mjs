#!/usr/bin/env node
const major = Number.parseInt(process.versions.node.split('.')[0], 10)
const REQUIRED = 22

// Escape hatch for sandbox / CI environments where Node 20 happens to work
// (e.g. agent worktrees, ephemeral runners). The .nvmrc still pins 22 for
// humans — this just stops the gate from blocking the rare case where the
// caller has consciously verified compatibility.
if (process.env.SKIP_NODE_CHECK) {
  if (major < REQUIRED) {
    console.warn(`  ! Node ${REQUIRED}+ recommended; running on ${process.version} (SKIP_NODE_CHECK set).`)
  }
  process.exit(0)
}

if (major < REQUIRED) {
  console.error(`\n  ✗ Node ${REQUIRED}+ required (you have ${process.version}).`)
  console.error(`    .nvmrc pins this — run \`nvm use\` (or fnm / volta) before retrying.`)
  console.error(`    Or set SKIP_NODE_CHECK=1 to bypass (use only when you've verified).\n`)
  process.exit(1)
}
