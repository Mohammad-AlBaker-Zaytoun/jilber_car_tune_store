/**
 * Structured logging.
 *
 * The app previously had 36 bare `console.*` calls with no levels, no request
 * correlation, and no machine-readable shape. On a VPS that means a production
 * failure is invisible until someone SSHes in and greps PM2 logs by eye.
 *
 * This emits ONE JSON object per line, which PM2 captures and any log shipper
 * (Vector, Promtail, Filebeat, `jq`) can parse:
 *
 *   {"ts":"2026-07-28T19:04:11.001Z","level":"error","event":"payment.settle_failed",
 *    "orderRef":"TUNE-20260728-K4M2X","err":{"name":"FetchError","message":"..."}}
 *
 * Deliberately dependency-free: pino/winston would be nicer, but this app runs a
 * single Node process behind PM2 and the value here is *shape and severity*, not
 * transports.
 *
 * ATTACHING AN ERROR TRACKER
 * Call `setErrorReporter()` once at startup (instrumentation.ts) with any
 * reporting function — Sentry's `captureException`, a webhook, whatever. Nothing
 * else in the codebase needs to know which vendor is in use. Until one is
 * attached, `logger.error` still writes a structured line, so failures are
 * recorded even with no tracker configured.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

/** Extra structured fields. Keep keys stable — they become log query columns. */
export type LogContext = Record<string, unknown>;

const LEVEL_RANK: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function minLevel(): Level {
  const raw = process.env.LOG_LEVEL as Level | undefined;
  if (raw && raw in LEVEL_RANK) return raw;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/** Serialises an Error without losing the name/stack, and without exploding. */
function serialiseError(err: unknown): LogContext {
  if (err instanceof Error) {
    return {
      err: {
        name: err.name,
        message: err.message,
        // Stacks are noisy but they are the whole point when triaging at 2am.
        stack: err.stack,
        ...(err.cause ? { cause: String(err.cause) } : {}),
      },
    };
  }
  return { err: { name: 'NonError', message: String(err) } };
}

// ---------------------------------------------------------------------------
// Pluggable error reporter
// ---------------------------------------------------------------------------

export type ErrorReporter = (error: unknown, context: LogContext) => void;

let reporter: ErrorReporter | null = null;

/** Attach an error tracker. Call once at startup. */
export function setErrorReporter(fn: ErrorReporter): void {
  reporter = fn;
}

export function hasErrorReporter(): boolean {
  return reporter !== null;
}

// ---------------------------------------------------------------------------

function emit(level: Level, event: string, context: LogContext = {}): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[minLevel()]) return;

  const line = {
    ts: new Date().toISOString(),
    level,
    event,
    ...context,
  };

  // One line, one JSON object. console.error goes to stderr so PM2 splits it
  // into error.log — keep that behaviour.
  const out = level === 'error' || level === 'warn' ? console.error : console.log;
  try {
    out(JSON.stringify(line));
  } catch {
    // Circular structure in the context — never let logging throw.
    out(JSON.stringify({ ts: line.ts, level, event, logSerialisationFailed: true }));
  }
}

export const logger = {
  debug: (event: string, context?: LogContext) => emit('debug', event, context),
  info: (event: string, context?: LogContext) => emit('info', event, context),
  warn: (event: string, context?: LogContext) => emit('warn', event, context),

  /**
   * Logs an error AND forwards it to the attached tracker.
   * `event` is a stable dot-namespaced identifier you can alert on, e.g.
   * 'payment.settle_failed' — not a human sentence.
   */
  error: (event: string, err?: unknown, context: LogContext = {}) => {
    const full = err === undefined ? context : { ...context, ...serialiseError(err) };
    emit('error', event, full);
    if (reporter) {
      try {
        reporter(err ?? new Error(event), { event, ...context });
      } catch (reportErr) {
        emit('error', 'logger.reporter_failed', serialiseError(reportErr));
      }
    }
  },
};
