# Deployment and recovery reference

Start with [SETUP.md](../SETUP.md). The repository has not been deployed to a production host during this work. Docker, TLS, firewall rules, SMTP delivery and backup restoration still need to be verified on the chosen host.

## Release

1. Configure the real HTTPS origin in GitHub variable `SITE_URL`.
2. Run the manual Release workflow to build and publish an immutable GHCR image.
3. Back up PostgreSQL and uploaded media before applying a release.
4. On the configured host, run `scripts/deploy.sh <immutable-image-tag>`. It applies the bundled Drizzle migrations before swapping the application image and checks process health.
5. Verify login, a product read, image delivery, contact submission and LINE destination against the real origin. Enable indexing only after content and contact details are ready.

Deployment requires an existing configured Compose network/database and the values listed in SETUP.md. Initial provisioning is separate. `scripts/provision.sh` changes operating-system, firewall and Docker configuration; review it against the target host before use.

## Backups

`scripts/backup.sh` runs in the backup container and keeps database dumps and media archives. The configured job retains seven daily and four weekly copies. Keep an encrypted off-host copy as well; local volumes do not protect against losing the host.

To make an on-demand backup on the configured host:

```bash
docker compose exec -T backup sh /usr/local/bin/backup.sh
```

A successful database dump alone is insufficient: confirm the media archive completed too. Test `scripts/restore.sh` against a disposable environment and compare record counts and image hashes before using the process for recovery. No production restore was performed or verified in this implementation session.

## Account recovery

From a trusted checkout with access to the production database, supply `ADMIN_PASSWORD` securely and run:

```bash
pnpm admin:create existing-admin@example.org "ผู้ดูแลระบบ" owner
```

This resets the password, reactivates the account and revokes its previous sessions. It records the action in the audit log. Do not share real passwords through repository files or command arguments.

## Rollback

Use the previous immutable application image only if its code remains compatible with the current schema. Database migrations are not automatically rolled back. A destructive schema rollback requires a verified backup restoration and may lose changes since that backup.

`GET /api/health` checks process availability, not database correctness. Inspect server errors and verify an authenticated CMS read when investigating a database problem.
