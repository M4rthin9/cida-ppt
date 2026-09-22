# Contributing

Follow [CLAUDE.md](CLAUDE.md) and the vocational scope in [docs/SPEC.md](docs/SPEC.md). Keep UI content readable in Thai, preserve official assets, and manage catalog content through the database.

Run typecheck, lint, format:check and tests before committing. For schema changes generate a Drizzle migration, test it against a disposable PostgreSQL database, and run the seed twice. Exercise affected CMS workflows with owner/editor/anonymous users and check mobile layouts.

Do not include credentials, real enquiry data or test products in commits. Use environment variables for credentials and deployment configuration.
