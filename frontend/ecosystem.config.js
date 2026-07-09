// ecosystem.config.js — PM2 process manager config for Vita AI
// Server pe use karo: pm2 start ecosystem.config.js
// ================================================================

module.exports = {
  apps: [
    // ── Backend: Node.js / Express ──────────────────────────────
    {
      name: 'vita-backend',
      cwd: '/var/www/html/vita/backend',
      script: 'server.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
      out_file: '/var/log/vita/backend-out.log',
      error_file: '/var/log/vita/backend-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },

    // ── Frontend: Next.js ────────────────────────────────────────
    {
      name: 'vita-frontend',
      cwd: '/var/www/html/vita/frontend',
      script: 'npm',
      args: 'start',
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
      out_file: '/var/log/vita/frontend-out.log',
      error_file: '/var/log/vita/frontend-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
