#!/bin/sh
# Keep Linux dependency symlinks inside a tar archive when building on Windows.
set -eu
test -f /app/.next/standalone/server.js
test ! -f /app/.next/standalone/.env
cp /source/Dockerfile /app/Dockerfile
tar -cf /app/cida-ppt-image.tar \
  -C /app Dockerfile .next/standalone .next/static public drizzle \
  scripts/migrate.mjs scripts/seed-production.mjs content/production-seed
