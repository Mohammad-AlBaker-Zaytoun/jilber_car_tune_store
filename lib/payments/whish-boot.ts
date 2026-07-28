/**
 * Boot-time assertion for the Whish payment environment.
 *
 * `whish-pay` picks its API host from NODE_ENV with no way to inspect or
 * override the choice:
 *
 *   NODE_ENV === 'production'  ->  https://lb.whish.money      (real money)
 *   anything else              ->  https://lb.sandbox.whish.money (no money)
 *
 * So a production deploy that forgets `NODE_ENV=production` runs live
 * credentials against the sandbox: checkout completes, the customer sees a
 * success page, and no money ever moves. Nothing in the app noticed this — it
 * was silent by construction.
 *
 * Kept in its own module (not lib/payments/whish.ts) so importing it at startup
 * doesn't pull in the whish-pay client.
 */

import { isWhishConfigured, isWhishProduction } from './whish';

/** Set to '1' to run configured Whish credentials against the sandbox on purpose. */
const SANDBOX_OPT_IN = 'WHISH_ALLOW_SANDBOX';

export function assertWhishEnvironment(): void {
  if (!isWhishConfigured()) {
    console.info('[whish] not configured — card checkout will return 503.');
    return;
  }

  if (isWhishProduction()) {
    console.info('[whish] configured, environment=PRODUCTION (real charges).');
    return;
  }

  if (process.env[SANDBOX_OPT_IN] === '1') {
    console.warn(
      `[whish] configured, environment=SANDBOX (no real charges). ` +
        `${SANDBOX_OPT_IN}=1 is set, so this is intentional.`
    );
    return;
  }

  throw new Error(
    [
      '',
      'Whish credentials are set but NODE_ENV is not "production".',
      `  NODE_ENV = ${JSON.stringify(process.env.NODE_ENV)}`,
      '',
      'whish-pay would silently use the SANDBOX API: customers would complete',
      'checkout and see a success page while no money is actually collected.',
      '',
      'Fix one of:',
      '  • Set NODE_ENV=production for a real deployment.',
      `  • Set ${SANDBOX_OPT_IN}=1 if you are deliberately testing against sandbox.`,
      '  • Unset WHISH_CHANNEL / WHISH_SECRET to disable card payments entirely.',
      '',
    ].join('\n')
  );
}
