# Verification

Implementation verified in an isolated test environment, September 2026. Test accounts, products, news and generated frame fixtures are not seeded or committed.

## Checks completed

- TypeScript strict typecheck, ESLint and Prettier checks pass.
- The optimized Next.js production build passes. The actual standalone output starts successfully, serves all main public routes, protects anonymous CMS/API access, and passes owner/editor login checks without browser errors. The bundled runtime migrator successfully re-runs against the migrated database.
- **223 unit tests across 26 files pass**, including pricing validation, required category/Thai name, gallery limits, publication dates and rejection of client-supplied authentication role/session-version updates.
- Drizzle migrations apply successfully to an empty PostgreSQL-compatible PGlite instance. Seeding twice leaves exactly four categories, zero products and zero news. Re-seeding after an administrator changes a category slug preserves that change and does not duplicate the category.
- Chromium browser tests exercise owner login, anonymous access rejection and editor access boundaries. Editors can edit content but cannot manage users or system settings.
- CMS browser tests cover category creation, edit, hide/publish, enable/disable, reordering, safe deletion with product reassignment; product creation, field validation, unique SKU enforcement, duplication, publishing, hiding, archive, restore, out-of-stock state and owner-confirmed permanent deletion.
- All five price modes render correctly. Public SKU search, featured/new/stock filters and featured homepage content read from the database. Public query parameters cannot enable administrative reads.
- Image uploads preserve original bytes exactly. Browser tests cover multiple images, cover reordering, replacement and removal. Referenced media deletion is blocked, as are cross-origin upload/deletion requests.
- News creation, future publication, local-time round trips, archive and restoration are exercised. Restoring news keeps it unpublished.
- Desktop and mobile views at 1440px, 390px and 360px were inspected. Public pages, product details and CMS tables do not overflow the page horizontally. Mobile navigation works.
- Public category URLs, product canonicals and sitemap visibility are checked. Hidden/future/unpublished content is excluded.
- The emblem is byte-identical to the original project asset.
- The scroll importer and canvas are tested with temporary synthetic PNGs: frame 001 / 038 / 075 / 113 / 150 at the required scroll positions, backwards scrolling, DPR 2, responsive resize and reduced motion. Those test frames were removed.

## Deployment limits

The supplied `frames_150.zip` is absent. Actual visual continuity, decoding cost and image quality of the intended 150-frame sequence must be reviewed after that archive is supplied. The built-in fallback is a labeled conceptual illustration from the original project.

No real products, product photos or vocational news have been invented. Administrators must populate the live catalog. No production host, DNS, TLS, SMTP or external backup restoration has been deployed or verified. Local integration checks use PGlite; the included GitHub CI workflow separately targets PostgreSQL 16.

The inherited Auth.js/Jose dependency produces a Next.js build warning about optional compression APIs in the Edge runtime. Its authentication behavior is checked through the browser; no authentication provider was replaced.

Screenshots: [desktop](screenshots/home-desktop.png), [mobile](screenshots/home-mobile.png), [CMS](screenshots/admin-desktop.png).
