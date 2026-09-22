# Verification

Implementation verified in isolated test environments, September 2026. Test accounts, products, news and generated frame fixtures are not seeded or committed.

## Structure follow-up — 22 September 2026

The frame archive and cinematic hero are intentionally deferred. The homepage now renders `VocationalHero` without a canvas or frame references; the existing scroll player remains disconnected for the later hero phase.

- On the Windows workspace, all **228 unit tests across 28 files** pass, including catalog query normalization, duplication length limits, valid publication timestamps and database-compatible weight precision.
- TypeScript, ESLint and source formatting checks pass. The existing storage-path test now uses a platform-correct absolute expected path, so it runs on Windows and Linux.
- The production build passes with `NEXT_STANDALONE=false`, and `next start` serves it successfully. Default standalone compilation succeeded but Windows refused deployment-package symlinks (`EPERM`); that packaging path still needs Linux/CI or a Windows environment with symlink permission. The default Linux/Docker output is unchanged. The inherited Auth.js/Jose Edge compression warning remains.
- An isolated, persistent PGlite socket fixture successfully ran migrations twice and the seed twice. Assertions verified four applied migrations, exactly the four requested published/enabled categories, and zero products, news or users. Fixture scripts/data remain ignored under `test-results/`; application dependencies and the lockfile are unchanged.
- Browser checks confirmed the static homepage, authentic empty catalog state, 390px catalog layout without horizontal overflow, Thai search, category navigation retaining the search, and mobile menu open/Escape-close behavior.
- Production route checks returned 200 for the homepage, catalog, all four category pages, vocational/story/news/contact pages and login, and 404 for nonexistent products/categories/news. Anonymous admin requests return Next.js streaming redirects without protected CMS content; the browser reaches `/admin/login`. Anonymous media upload returns 401. The homepage response contains neither a canvas nor frame image references.
- Public links and metadata now use the existing locale-aware helpers. Product inquiries can prefill the contact form from a published product record. JSON-LD uses the existing safely escaped renderer.
- CMS page and layout errors have retry surfaces, and CMS loading has an accessible status. No authentication or database infrastructure was replaced.

The earlier baseline checks below describe the previous implementation verification; they are not a claim that every CMS operation or synthetic frame scenario was repeated during this follow-up. Local database checks use PGlite rather than native PostgreSQL 16.

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

Work on `frames_150.zip` is deferred by request. Actual visual continuity, decoding cost and image quality of the intended 150-frame sequence will be reviewed in the later hero phase. The current introduction is a labeled static conceptual illustration from the original project; importing frames does not activate the player automatically.

No real products, product photos or vocational news have been invented. Administrators must populate the live catalog. No production host, DNS, TLS, SMTP or external backup restoration has been deployed or verified. Local integration checks use PGlite; the included GitHub CI workflow separately targets PostgreSQL 16.

The inherited Auth.js/Jose dependency produces a Next.js build warning about optional compression APIs in the Edge runtime. Its authentication behavior is checked through the browser; no authentication provider was replaced.

Screenshots: [desktop](screenshots/home-desktop.png), [mobile](screenshots/home-mobile.png), [CMS](screenshots/admin-desktop.png).
