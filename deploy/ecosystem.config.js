/**
 * PM2 process definition for the JILBER store.
 *
 *   pm2 start deploy/ecosystem.config.js
 *   pm2 save && pm2 startup     # survive reboots
 *
 * FORK MODE, ONE INSTANCE — this is a correctness constraint, not a preference.
 * lib/rate-limit.ts keeps its counters in a per-process Map, so every extra
 * worker multiplies the effective limits (5 login attempts/min becomes 5 x N).
 * Moving to cluster mode requires moving the limiter to a shared store first.
 */
module.exports = {
  apps: [
    {
      name: 'jilber',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/srv/jilber',

      exec_mode: 'fork',
      instances: 1,

      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // One reverse proxy (nginx) in front — see deploy/nginx.conf and the
        // TRUSTED_PROXY_COUNT docs in lib/rate-limit.ts.
        TRUSTED_PROXY_COUNT: '1',
      },

      // Restart policy: back off rather than hot-loop if the app crashes at boot
      // (a missing AUTH_SECRET or a sandbox-vs-production Whish mismatch both
      // throw from instrumentation.ts by design).
      autorestart: true,
      max_restarts: 10,
      min_uptime: '30s',
      restart_delay: 2000,

      // Recycle if the process balloons — the frame-preloading routes are memory
      // hungry and a leak should not take the box down.
      max_memory_restart: '768M',

      error_file: '/var/log/jilber/error.log',
      out_file: '/var/log/jilber/out.log',
      merge_logs: true,
      time: true,

      kill_timeout: 10000,
      listen_timeout: 15000,
    },
  ],
};
