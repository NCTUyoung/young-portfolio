import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const testArgs = process.argv.slice(2)

if (testArgs.length === 0) {
  console.error('Usage: npm run test:e2e:focused -- <spec-or-grep> [Playwright options]')
  process.exit(2)
}

const changesWorkerCount = testArgs.some(arg =>
  arg === '--workers' || arg.startsWith('--workers=') || arg.startsWith('-j')
)

if (changesWorkerCount) {
  console.error('The focused E2E runner fixes workers at 1 to avoid cold-route compile contention; omit --workers/-j.')
  process.exit(2)
}

const playwrightCli = resolve('node_modules/@playwright/test/cli.js')
const result = spawnSync(process.execPath, [playwrightCli, 'test', '--workers=1', ...testArgs], {
  cwd: process.cwd(),
  env: { ...process.env, PLAYWRIGHT_SKIP_GLOBAL_WARMUP: '1' },
  stdio: 'inherit'
})

if (result.error) {
  console.error(result.error)
  process.exitCode = 1
} else {
  process.exitCode = result.status ?? 1
}
