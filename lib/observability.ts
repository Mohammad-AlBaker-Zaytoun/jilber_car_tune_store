/**
 * Wires an error tracker into the logger, if one is configured.
 *
 * DELIBERATELY VENDOR-NEUTRAL. The app ships with no tracker SDK as a
 * dependency: adding one forces an account, a DSN, and a data-processing
 * decision that belongs to whoever operates the deployment. Instead:
 *
 *   - `logger.error()` always writes a structured JSON line, so nothing is ever
 *     silently lost even with no tracker attached.
 *   - If `ERROR_WEBHOOK_URL` is set, errors are additionally POSTed there. That
 *     works with a Slack/Discord incoming webhook, a Sentry "webhook" endpoint,
 *     or anything else that accepts JSON — no SDK required.
 *
 * TO USE SENTRY PROPERLY INSTEAD:
 *   npm i @sentry/nextjs
 * then replace the body of registerErrorReporter() with:
 *   import * as Sentry from '@sentry/nextjs';
 *   Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
 *   setErrorReporter((err, ctx) => Sentry.captureException(err, { extra: ctx }));
 * Nothing else in the codebase changes — that is the point of the seam.
 */

import { setErrorReporter, logger, type LogContext } from '@/lib/logger';

/** Fields that must never leave the server in an error report. */
const REDACT = /password|secret|token|authorization|cookie|apikey|api_key/i;

/**
 * Recursive redaction.
 *
 * A one-level pass was not enough: `context` is arbitrary and this payload is
 * POSTed off-box to a webhook (in practice a Slack/Discord channel, which is a
 * chat log, not a secrets store). `{ body: { password } }` or
 * `{ headers: { cookie } }` sailed straight through.
 */
function redact(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (depth > 6) return '[depth-limit]';
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1, seen));

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    out[key] = REDACT.test(key) ? '[redacted]' : redact(v, depth + 1, seen);
  }
  return out;
}

export function registerErrorReporter(): void {
  const webhook = process.env.ERROR_WEBHOOK_URL;

  if (!webhook) {
    logger.info('observability.no_tracker', {
      detail:
        'ERROR_WEBHOOK_URL is unset — errors are logged as structured JSON only. ' +
        'Set it, or wire an SDK in lib/observability.ts, to get alerted off-box.',
    });
    return;
  }

  setErrorReporter((err, context) => {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;

    // Fire-and-forget with a hard timeout: alerting must never delay or fail a
    // request, and must never throw back into the logger.
    void fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'jilber',
        env: process.env.NODE_ENV,
        message,
        stack,
        context: redact(context) as LogContext,
        ts: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {
      // Swallow: a failed alert is logged by the caller's structured line
      // already, and retrying here risks an infinite error loop.
    });
  });

  logger.info('observability.tracker_attached', { transport: 'webhook' });
}
