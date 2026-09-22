# Project guidance

Read README.md, SETUP.md and docs/SPEC.md. This repository is the vocational division's product showcase and CMS, not a general prison-management system.

Preserve Next.js App Router, PostgreSQL/Drizzle, Auth.js, media storage and the exact supplied institutional emblem. The public UI is Thai-first. Seed only the four requested categories; never invent real products, institutional events or product photography.

All CMS mutations require server-side authentication, role checks, Zod validation, database constraints and audit records. Public queries exclude hidden, disabled, archived, deleted or future content. Keep the original uploaded image bytes. Product deletion is archive-first; category deletion must not orphan products.

Use the existing scripts for typecheck, lint, formatting, tests and build. Do not commit secrets, local databases, node_modules or build output. Deployment is a separate explicit action; no automatic deployment is configured.
