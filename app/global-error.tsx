'use client';

/**
 * Last-resort boundary: catches errors thrown in the ROOT layout itself, where
 * app/error.tsx cannot help because the layout that renders it is the thing that
 * failed. It therefore has to supply its own <html> and <body>.
 *
 * Deliberately dependency-free — no fonts, no providers, no lucide icons, no
 * Tailwind classes that depend on the layout's CSS being loaded. If the root
 * layout is broken, anything imported here could be broken too, so this uses
 * inline styles only.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090b',
          color: '#e4e4e7',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <p
            style={{
              fontSize: '10px',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: '#f87171',
              marginBottom: '16px',
            }}
          >
            Application error
          </p>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              margin: '0 0 20px',
              color: '#fff',
            }}
          >
            SOMETHING BROKE
          </h1>
          <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#a1a1aa', margin: '0 0 32px' }}>
            The site failed to start rendering. This has been logged. Please try
            reloading — if it persists, contact us and quote the reference below.
          </p>

          {error.digest && (
            <p
              style={{
                fontSize: '11px',
                color: '#71717a',
                fontFamily: 'ui-monospace, monospace',
                margin: '0 0 32px',
              }}
            >
              Reference: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              padding: '14px 24px',
              background: '#22d3ee',
              color: '#000',
              border: 'none',
              fontWeight: 900,
              fontSize: '12px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
