/**
 * Builds the app for the Playwright suite.
 *
 * The E2E servers are `next start` over plain HTTP, and the production CSP sends
 * `upgrade-insecure-requests`. Safari honours that directive even on an http://
 * origin, so every asset is requested over https://, nothing connects, and the
 * app renders blank in WebKit while looking fine in Chromium. ALLOW_PLAINTEXT_HTTP
 * drops just that one directive (see next.config.ts).
 *
 * This exists as a script rather than an inline `VAR=1 npm run build` because
 * that syntax does not work in cmd.exe or PowerShell, and adding cross-env for
 * one variable is not worth a dependency.
 */
import { spawnSync } from 'node:child_process';

const env = { ...process.env, ALLOW_PLAINTEXT_HTTP: '1' };

// npx.cmd on Windows, so no shell is needed — passing args with `shell: true`
// concatenates them unescaped (Node DEP0190).
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

for (const args of [['prisma', 'generate'], ['next', 'build']]) {
  const res = spawnSync(npx, args, { stdio: 'inherit', env });
  if (res.status !== 0) {
    console.error(`\nbuild-e2e: \`npx ${args.join(' ')}\` failed`);
    process.exit(res.status ?? 1);
  }
}
