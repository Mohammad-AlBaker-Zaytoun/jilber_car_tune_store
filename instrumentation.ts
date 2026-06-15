export async function register() {
  // Run only in the Node.js runtime (not Edge) — the data layer uses Prisma,
  // which is not supported on the Edge runtime.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateAuthSecret } = await import('./lib/auth');
    // Throws immediately on startup if AUTH_SECRET is missing or too short,
    // surfacing the misconfiguration before any request is served.
    validateAuthSecret();
  }
}
