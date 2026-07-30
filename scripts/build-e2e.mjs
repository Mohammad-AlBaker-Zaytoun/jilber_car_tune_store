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

// `shell: true` with a single command string, not an args array.
//
// On Windows `npx` resolves to npx.cmd, and since CVE-2024-27980 Node refuses to
// spawn a .cmd without a shell (EINVAL), so the shell is required here. Passing
// the command as one string also avoids DEP0190, which warns that an args array
// is concatenated unescaped when a shell is used. Every argument below is a
// hardcoded literal, so there is nothing to escape.
for (const command of ['npx prisma generate', 'npx next build']) {
  const res = spawnSync(command, { stdio: 'inherit', env, shell: true });

  // Report the real reason. A silent `exit(1)` here hid a broken build once
  // already, and a build step that fails without saying why is worse than one
  // that crashes.
  if (res.error) {
    console.error(`\nbuild-e2e: could not run \`${command}\`:`, res.error.message);
    process.exit(1);
  }
  if (res.signal) {
    console.error(`\nbuild-e2e: \`${command}\` was killed by ${res.signal}`);
    process.exit(1);
  }
  if (res.status !== 0) {
    console.error(`\nbuild-e2e: \`${command}\` exited with code ${res.status}`);
    process.exit(res.status ?? 1);
  }
}
