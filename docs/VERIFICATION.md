# Verification

Implementation verified in isolated test environments, September 2026. Test accounts, products, news and generated frame fixtures are not seeded or committed.

## Real footage imported — 22 September 2026

The supplied `frames/merged_20s_frames` set is now driving the hero. It holds 185 JPEGs numbered `frame_001` to `frame_187` with gaps, at 1280x720 and roughly 930 KB each.

- Sampled to exactly 150 frames and imported to `public/frames/hero`. Confirmed in the browser against the real sequence: 0% scroll renders frame 001, 25% frame 038, 50% frame 075, 75% frame 113, 100% frame 150, over a 400vh section with one canvas.
- **The original bytes were too heavy to serve.** 150 of them is 139 MB, which no amount of progressive preloading keeps ahead of a scroll. The importer gained an opt-in `--encode` step, which re-encodes through the project's existing sharp dependency at JPEG quality 76 and at most 1280px: **139 MB to 17.3 MB**, an average of 118 KB a frame. The source folder is untouched, and without the flag the importer still copies original bytes.
- The importer now also refuses to publish a sequence that would serve more than 40 MB, naming the flags that bring it down. Verified: importing the raw set without `--encode` stops with that error and leaves nothing behind.
- Two defects found and fixed in the encoder while checking its output: it reported the source size as zero, and it handed the encoded buffer back to sharp to save, re-encoding every frame a second time (19.5 MB written against 17.3 MB produced, for a second generation of loss).
- A soft radial scrim was added behind the hero copy. The sequence runs from a dark perimeter wall to a bright sunlit workshop, and at frame 075 the lede lost its contrast against the bright frame. The scrim sits above the footage but outside it, so it is unaffected by the 75% media opacity and leaves the 35% veil reduction unchanged; it has no edge, keeps the frame's corners open, and fades out with the copy at the hand-off.
- All **249 tests across 30 files** pass. TypeScript, ESLint and Prettier pass. `scripts/verify-scroll-sequence.mjs` passes. The production build passes with `NEXT_STANDALONE=false`.
- Still unverified: playback on a real network and on real mobile hardware. 17.3 MB is a normal weight for a full-screen 150-frame sequence, but the decode cost and cache behaviour on a mid-range phone have only been exercised in a desktop browser here.

## Cinematic opening — 22 September 2026

The homepage now opens on two scroll-driven stages: `CinematicHero`, whose frame sequence is scrubbed frame by frame, and `ApertureSection`, which opens from its centre line onto a second sequence with the copy set on the right. The retired `VocationalHero` and `ScrollSequence` are removed, along with their CSS.

- **No real footage reached this environment.** Every browser check below used temporary synthetic frames, generated locally and deleted afterwards; `public/frames` is empty in the commit. Visual continuity, decode cost and image quality of the intended clips are therefore **not** verified, and remain to be reviewed against the real sequences after import.
- With no sequence imported — the committed state — both sections render their static composition: zero canvases in the document, the hero exactly one viewport tall, and no frame requests. Confirmed in the browser.
- With synthetic 60-frame sets imported into both `hero` and `reveal`, reviewed at 1440×900 and 390×844 across the hero's start, middle and exit, the hand-off band, and the aperture's slit, opening, open and closing states. The hero's last frame blurs and desaturates into a feathered seam; the aperture rests on a lit slit rather than on a black screen, and resolves its blur as it widens.
- `node scripts/verify-scroll-sequence.mjs` passes against the rebuilt fixture, which now loads the real player, stage tracker and manifest modules and wires them exactly as the component does: frames 001/038/076/113/150 by pixel value at their scroll positions, backwards scrolling, rapid jumps converging, idle frames not advancing, DPR 2 backing size, resize, cleanup and restart, a deliberately slow frame converging without another scroll event, a 404 frame retaining the nearest loaded image without blanking the canvas, and 390×844 / 320×568 / 844×390 with no clipped hero content or horizontal overflow.
- Reduced motion is verified end to end: each stage rests where its content is readable — the hero on its opening frame, the aperture fully open — and only frame 001 is ever requested. Toggling the preference at runtime starts and stops playback in both directions.
- The importer accepts a folder as well as a ZIP, PNG or JPEG, any source length, and samples down to exactly 150 frames by default (8–600 via `--max`) into a named set. Exercised against a 37-frame folder, a 12-frame JPEG ZIP and a 60-frame set per stage; a rejected import leaves the previous sequence and its manifest intact.
- The navigation is a floating pill bar. It is solid over ordinary pages and glass only over the cinematic opening, selected with `:has()` so a browser without it keeps the solid, legible bar. Panels inside the bar carry their own ground, because a parent with `backdrop-filter` is a backdrop root and a blur on a child of it never lands.
- Short viewports are sized against height as well as width: at 844×390 the opening previously pushed its button out of the pinned stage, which the browser check now covers.
- All **249 tests across 30 files** pass, including 17 new ones over the manifest contract, frame naming and URL construction, stage progress, range remapping and preload anchors. TypeScript, ESLint and Prettier checks pass. The production build passes with `NEXT_STANDALONE=false`.
- The database was not touched. No product, event or photograph is invented: the hero's no-footage fallback is the existing labeled conceptual illustration, and the aperture falls back to a typographic panel. The supplied emblem is used unmodified, on a light chip for contrast on the dark bar.

## Visual redesign — 22 September 2026

- Reworked public typography, navigation, collection cards, story sections, catalog filters, empty states, contact panels and footer. The static introduction uses the original labeled conceptual image; cinematic activation remains deferred.
- Reworked CMS surfaces and the sign-in page around white/cloud panels and burgundy accents. Account creation, authentication, role checks and data mutations are unchanged.
- Browser inspection covers the complete homepage and catalog at 1440px and 390px, contact at 1440px and 360px, and login at 1440px and 390px. Inspected pages have no horizontal document overflow. Mobile menu opening and Escape dismissal work. Contact validation displays inline errors and burgundy borders without creating an inquiry.
- The database still has no published products or news. Product cards, galleries and authenticated CMS screens were reviewed against their markup and CSS; this pass does not claim a populated-catalog or authenticated CMS browser test.
- All **228 tests across 28 files** pass. TypeScript, ESLint and formatting checks pass. Public-route and anonymous-access smoke checks pass, including four category pages, missing-record 404s, protected CMS routes and anonymous media-upload rejection.

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

The hero sequence is imported and verified in a desktop browser; the `reveal` set has no footage yet and renders its typographic panel. Playback has not been measured on a real network or on mobile hardware. The supplied frames are institutional and vocational footage from the project owner; nothing here is invented or sourced elsewhere.

No real products, product photos or vocational news have been invented. Administrators must populate the live catalog. No production host, DNS, TLS, SMTP or external backup restoration has been deployed or verified. Local integration checks use PGlite; the included GitHub CI workflow separately targets PostgreSQL 16.

The inherited Auth.js/Jose dependency produces a Next.js build warning about optional compression APIs in the Edge runtime. Its authentication behavior is checked through the browser; no authentication provider was replaced.

Screenshots: [desktop](screenshots/home-desktop.png), [mobile](screenshots/home-mobile.png), [CMS](screenshots/admin-desktop.png).
