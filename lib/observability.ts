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

/** One error, already redacted, ready to be shaped for a transport. */
type Report = {
  service: string;
  env: string | undefined;
  message: string;
  stack: string | undefined;
  context: unknown;
  ts: string;
};

/**
 * Chat webhooks each require their own body shape — Telegram wants
 * `{chat_id, text}`, Slack `{text}`, Discord `{content}` — and every one of
 * them rejects the generic JSON below with a 4xx.
 *
 * That matters more than it looks: delivery is fire-and-forget and failures are
 * swallowed (by design, so alerting can never break a request), so a mis-shaped
 * body means alerts disappear in total silence. The module would report itself
 * as "tracker_attached" while nothing ever arrived.
 *
 * Shaping by URL host keeps this dependency-free and keeps ERROR_WEBHOOK_URL as
 * the single knob. Anything unrecognised still receives the raw JSON payload.
 */
function buildRequest(webhook: string, report: Report): { url: string; body: unknown } {
  let url: URL;
  try {
    url = new URL(webhook);
  } catch {
    return { url: webhook, body: report };
  }

  const lines = [
    `[${report.service}/${report.env ?? 'unknown'}] ${report.message}`,
    `at ${report.ts}`,
  ];
  const ctx = JSON.stringify(report.context ?? {});
  if (ctx && ctx !== '{}') lines.push(`context: ${ctx}`);
  if (report.stack) lines.push('', report.stack.split('\n').slice(0, 8).join('\n'));
  const text = lines.join('\n');

  const host = url.hostname.toLowerCase();

  if (host === 'api.telegram.org') {
    // chat_id must travel in the BODY. Telegram does not merge query-string
    // parameters with a JSON body, so leaving it in the URL yields
    // "Bad Request: chat_id is empty".
    const chatId = url.searchParams.get('chat_id');
    url.searchParams.delete('chat_id');
    return {
      url: url.toString(),
      // Telegram hard-caps a message at 4096 characters.
      body: { chat_id: chatId, text: text.slice(0, 4000), disable_web_page_preview: true },
    };
  }

  if (host === 'hooks.slack.com') {
    return { url: webhook, body: { text } };
  }

  if (host.endsWith('discord.com') || host.endsWith('discordapp.com')) {
    // Discord caps content at 2000 characters.
    return { url: webhook, body: { content: text.slice(0, 1900) } };
  }

  return { url: webhook, body: report };
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

    const { url, body } = buildRequest(webhook, {
      service: 'jilber',
      env: process.env.NODE_ENV,
      message,
      stack,
      context: redact(context) as LogContext,
      ts: new Date().toISOString(),
    });

    // Fire-and-forget with a hard timeout: alerting must never delay or fail a
    // request, and must never throw back into the logger.
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    })
      .then((res) => {
        // A rejected payload is the one failure this module cannot afford to
        // hide: it would keep reporting "attached" while every alert vanished.
        // This lands in the structured log, not back through the reporter.
        if (!res.ok) {
          logger.info('observability.webhook_rejected', {
            status: res.status,
            detail: 'The alert transport rejected the payload — alerts are NOT being delivered.',
          });
        }
      })
      .catch(() => {
        // Swallow network errors: the caller's structured line already recorded
        // the original problem, and retrying risks an infinite error loop.
      });
  });

  logger.info('observability.tracker_attached', { transport: 'webhook' });
}
