# Shared Windows Docker host

This host uses `docker-compose.host.yml`, independently of the VPS stack in
`docker-compose.yml`. Always specify the host file and environment file:

```powershell
docker compose --env-file .env.host.local -f docker-compose.host.yml --profile internet up -d
docker compose --env-file .env.host.local -f docker-compose.host.yml --profile internet ps
```

Public URL: https://cidapt.dpdns.org. LAN URLs: http://192.168.1.46:8082 and
http://192.168.0.46:8082 (subject to the host's current IP addresses). Use the
public HTTPS URL for CMS login and editing; authentication and upload origins
are configured for that URL.

The `cida-ppt` project owns its network, database, media and backup volumes.
Only the proxy publishes a port, 8082. ERP and POS ports, networks, containers,
volumes and Cloudflare tunnel are separate. Do not run global Docker cleanup or
stop/restart Docker Desktop during a deployment.

Secrets are stored in ignored `.env.host.local` and
`.local/secrets/cloudflare-tunnel-token`. The Cloudflare tunnel is named
`cida-ppt-production`; its only published hostname is `cidapt.dpdns.org`, with
origin `http://proxy:8080` and a final `http_status:404` ingress rule. The proxied
DNS CNAME points to this tunnel's `<id>.cfargotunnel.com`. Configure these through
the Cloudflare dashboard or API. Neither secret file belongs in an image or Git.

## Build an updated image

The runtime Dockerfile requires Linux standalone output. Build in a temporary
Linux container on `cida-ppt_default`, using `node:22-alpine`, `/app` as a Docker
volume, a read-only source mount at `/source`, and `cida-ppt_media` at
`/data/media`. Set the same database/auth/site/media environment variables as
the web service, plus `NEXT_TELEMETRY_DISABLED=1` and
`NODE_OPTIONS=--max-old-space-size=1024`. Run:

The host build script uses Webpack and limits Next.js to one build worker with
`CIRCLE_NODE_TOTAL=2`. This avoids prolonged Turbopack compilation and limits
worker memory use on this shared host.

From this repository directory in PowerShell (after starting `db`):

```powershell
$settings = Get-Content .env.host.local | ConvertFrom-StringData
docker volume create cida-ppt-build
docker run -d --name cida-ppt-build --network cida-ppt_default `
  --cpus 2 --memory 1536m --memory-swap 3g `
  -v "${PWD}:/source:ro" -v cida-ppt-build:/app -v cida-ppt_media:/data/media `
  -e "DATABASE_URL=postgres://cida:$($settings.POSTGRES_PASSWORD)@db:5432/cida" `
  -e "AUTH_SECRET=$($settings.AUTH_SECRET)" `
  -e AUTH_URL=https://cidapt.dpdns.org -e NEXT_PUBLIC_SITE_URL=https://cidapt.dpdns.org `
  -e MEDIA_DIR=/data/media -e LINE_OA_URL=https://line.me/ti/p/~0829414312 `
  -e NEXT_TELEMETRY_DISABLED=1 -e NODE_OPTIONS=--max-old-space-size=1024 `
  node:22-alpine sh /source/scripts/build-host.sh
docker logs -f cida-ppt-build
docker inspect cida-ppt-build --format '{{.State.ExitCode}}'
```

Limit the builder to 1536 MB RAM and two CPUs on this eight-CPU shared host. The script
installs the locked dependencies, migrates and seeds this project's database,
prepares media ownership for runtime UID 1001, and produces a production build.
Seeding uses the repository's approved production catalogue. Review catalogue
changes before running it against an existing CMS database.

After the builder exits successfully, copy its output and package it:

```powershell
docker run --rm --cpus 0.5 --memory 256m --volumes-from cida-ppt-build node:22-alpine sh /source/scripts/package-host.sh
docker cp cida-ppt-build:/app/cida-ppt-image.tar .local/image-context.tar
cmd /c "docker build -t cida-ppt-web:local - < .local\image-context.tar"
docker compose --env-file .env.host.local -f docker-compose.host.yml --profile internet up -d
```

For later builds, use a new builder name or remove only the stopped
`cida-ppt-build` container first. Preserve database, media and backup volumes.
Docker Desktop must be running for both LAN access and the tunnel to work.

## Backups and checks

The backup service runs at 03:15 Asia/Bangkok, retaining seven daily and four
weekly database/media snapshots. To run a backup immediately:

```powershell
docker compose --env-file .env.host.local -f docker-compose.host.yml exec backup sh /usr/local/bin/backup.sh
```

Check `/api/health`, the Thai and English catalogue, a product image, static
assets, and `/admin/login` over LAN and public HTTPS. Compare the existing ERP
and POS container IDs and start times before and after deployment.
