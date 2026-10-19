#!/bin/sh
# Run inside the isolated Linux builder described in docs/HOST-DEPLOYMENT.md.
set -eu
cd /app
cp /source/package.json /source/pnpm-lock.yaml /source/pnpm-workspace.yaml /source/.gitignore ./
if [ ! -f /opt/pnpm/bin/pnpm.cjs ]; then
  mkdir -p /opt/pnpm
  wget -q -T 60 -O /tmp/pnpm.tgz https://registry.npmjs.org/pnpm/-/pnpm-10.33.0.tgz
  tar -xzf /tmp/pnpm.tgz --strip-components=1 -C /opt/pnpm
fi
ln -sf /opt/pnpm/bin/pnpm.cjs /usr/local/bin/pnpm
pnpm install --frozen-lockfile
for item in src public messages drizzle scripts drizzle.config.ts next.config.ts tsconfig.json postcss.config.mjs; do
  cp -R "/source/$item" ./
done
mkdir -p content
cp -R /source/content/production-seed content/
pnpm db:migrate
pnpm db:seed
chown -R 1001:1001 /data/media
# Webpack avoids the prolonged Turbopack compilation seen on the shared host.
export CIRCLE_NODE_TOTAL=2
pnpm build --webpack
