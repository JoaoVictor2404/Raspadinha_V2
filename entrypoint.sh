#!/usr/bin/env bash
set -euo pipefail

echo "==> Boot: NODE_ENV=${NODE_ENV:-}"
echo "==> Running migrations (drizzle-kit push) if DATABASE_URL is set..."

if [ -n "${DATABASE_URL:-}" ]; then
  # Evita crash se o banco ainda não estiver disponível imediatamente
  for i in 1 2 3 4 5; do
    npx drizzle-kit push && break || {
      echo "drizzle push failed, retrying ($i/5) in 3s..."
      sleep 3
    }
  done
else
  echo "DATABASE_URL not set; skipping drizzle push."
fi

echo "==> Starting app..."
# usa teu script start (tsx server/index.ts)
npm start
