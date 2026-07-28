import { type Instrumentation } from 'next';

export async function register() {
  // Run only in the Node.js runtime (not Edge) — the data layer uses Prisma,
  // which is not supported on the Edge runtime.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateAuthSecret } = await import('./lib/auth');
    // Throws immediately on startup if AUTH_SECRET is missing or too short,
    // surfacing the misconfiguration before any request is served.
    validateAuthSecret();

    const { assertWhishEnvironment } = await import('./lib/payments/whish-boot');
    assertWhishEnvironment();

    const { registerErrorReporter } = await import('./lib/observability');
    registerErrorReporter();
  }
}

/**
 * Next's server-error hook. Fires for every uncaught error in a Server
 * Component render, route handler, server action, or the proxy — the errors
 * that previously vanished into PM2's stdout with no structure and no alert.
 *
 * Kept lightweight and non-throwing: an error inside the error handler would
 * take down the request path it is meant to be observing.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  const { logger } = await import('./lib/logger');

  // React may wrap the original error during RSC rendering; `digest` is the
  // stable identifier that correlates this log line with what the browser saw.
  const digest =
    typeof err === 'object' && err !== null && 'digest' in err
      ? String((err as { digest?: unknown }).digest)
      : undefined;

  logger.error('request.unhandled', err, {
    digest,
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
    revalidateReason: context.revalidateReason,
  });
};
