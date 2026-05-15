#!/usr/bin/env node
const major = Number.parseInt(process.versions.node.split('.')[0], 10)
const REQUIRED = 22
if (major < REQUIRED) {
  console.error(`\n  ✗ Node ${REQUIRED}+ required (you have ${process.version}).`)
  console.error(`    .nvmrc pins this — run \`nvm use\` (or fnm / volta) before retrying.\n`)
  process.exit(1)
}
