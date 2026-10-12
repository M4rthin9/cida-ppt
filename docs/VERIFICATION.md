# Verification

## Consistent product imagery - 12 October 2026

All public product cards, featured work, gallery images and gallery thumbnails share the same ivory studio treatment, forest-green frame and brass detail. Photographs remain uncropped and the original media files are retained. Catalogue cards now use square proportions and align product names and prices.

TypeScript, focused ESLint, all 234 existing tests and the production build pass. Browser checks cover all 29 published photographs across category pagination, catalogue and gallery layouts at 320, 390, 768 and 1440px, image containment, thumbnail switching and no runtime errors. Screenshots are saved under `test-results/product-theme/`.

## Fiberglass catalogue publication - 9 October 2026

Following the user's explicit publication request, all 29 imported fiberglass products were published through authenticated CMS forms. Stock remains Available now, as previously confirmed. Source prices, dimensions, materials and original-photo galleries are retained. The two wooden workbook entries remain outside this import.

- Reverified all 30 presentation images against their source hashes and saved upload bytes. Fourteen sideways photos have quarter-turn corrections; presentation preparation proves the original pixels are unchanged after reversing orientation and padding. No AI product images are used.
- Saved descriptive Thai alt text for all 30 photos through the CMS media editor. The ART TOY product retains both photos and includes a request to confirm the model/set before ordering; unspecified weight and quantity remain blank.
- `scripts/verify-published-fiberglass.mjs` passes on the production preview: 29 public product detail pages, 30 gallery images, original prices, available stock, all 29 entries across category pagination, mobile layouts and no browser runtime errors. All publication actors are disabled after completing their audited changes.
- Publication state, original draft snapshots and public verification are recorded in `content/fiberglass-drafts/publication.json`, `publication-before.json` and `public-verification.json`. This publishes CMS records in the connected local site; no remote deployment was performed.

## Generated studio category banner - 9 October 2026

Replaced the photo-frame collage with `content/category-banners/fiberglass-hero-v3.png`. The built-in image tool generated only the forest-green studio background and ivory plinth. The workbook's existing transparent Hanuman photograph is composited at native resolution with no product generation, resampling, segmentation or retouching; every opaque foreground RGB pixel matches the original. This preserves the user's requirement for the original character while providing a unified photographic setting.

The new banner was uploaded and assigned through the authenticated category form, preserving the category's other fields. Production browser checks pass at 1440, 390 and 320px for the saved image, text layout and product dropdown. The composition script passes lint. The product drafts and original files remain unchanged.

## Product navigation and fiberglass banner - 9 October 2026

The **ผลิตภัณฑ์** label itself is now the dropdown button; the separate arrow button and duplicate top-level product link are removed. The dropdown retains All products and four live category links, active styling, keyboard activation, Escape focus restoration, outside dismissal and mobile navigation.

The fiberglass category's Bento background was uploaded and assigned through the authenticated CMS form. It combines three original workbook photographs with forest-green artwork and ivory frames; no generated or retouched products are used. The category banner and publishing status were retained. `content/category-banners/cms-assignment.json` records the saved media, and `scripts/build-fiberglass-banner.mjs` reproduces the composition. The fiberglass tile uses contain sizing to preserve the entire composition on narrow screens.

Desktop and mobile browser checks at 1440, 390 and 320px pass label activation, Escape, the All products route, saved background image loading and overflow checks. ESLint and the production build pass.

## Category bento and background uploads - 9 October 2026

The homepage gallery is now a compact bento: a tall feature tile, a wide tile and two smaller tiles, with rounded corners, full-tile images and gradient-protected text. Tablet uses two columns and phones one. Categories without images retain their original craft illustrations. Incomplete groups expand to fill the available columns.

- Each category's existing `thumbnail_image` field supplies its independent bento background, followed by the category banner and illustrated fallback. The CMS control is labelled **ภาพพื้นหลัง Bento** and explains image size, centre cropping and saving. Existing authenticated upload, validation, auditing and original-file storage remain in use.
- A temporary owner tested the real CMS: upload a PNG, save a category, load the public background, reopen the editor, replace the image, remove it and return to the illustrated fallback. Original upload bytes were verified unchanged. Other categories retained their backgrounds; setting the test category to draft removed its public tile. Temporary account, category, media and audit records were removed; test files were archived under ignored `test-results`.
- `node scripts/verify-bento-layout.mjs` verifies 320, 390, 700, 768, 1050, 1100, 1440 and 1920px, contained titles/actions, aligned desktop bento geometry, keyboard activation, focus visibility and visible JavaScript-free content. Screenshots are saved under `test-results/bento`.
- All 234 tests, ESLint and the production build, including TypeScript, pass. The bento browser checks also pass against the production server. The original cinematic scrolling remains enabled and the fiberglass catalogue drafts remain unpublished.

## Next.js 16 upgrade - 9 October 2026

Upgraded Next.js and its ESLint configuration to **16.4.0**, and React/React DOM to **19.3.0**. Both package-manager locks are synchronized; the canonical pnpm frozen install passes. Development and production builds now use Turbopack.

- Migrated middleware to the Node.js proxy convention, preserving authentication and locale routing. CMS mutations use `updateTag` for immediate cache invalidation. Native flat ESLint configuration and scoped React-rule fixes pass lint; TypeScript and all **234 tests across 28 files** pass.
- The production build passes with isolated `.next-production` output and `NEXT_STANDALONE=false` for local Windows review. Node-only startup validation is runtime-gated; the previous Edge warning no longer appears. The generated Next.js agent guidance is retained in `AGENTS.md`.
- Both public browser suites pass: cinematic scrolling forward/backward, deferred sequence loading, focus and skip controls, responsive layouts, reduced motion, JavaScript-disabled and failed-frame fallbacks, category navigation, catalogue filters and contact validation. No browser runtime errors were observed.
- Anonymous CMS access redirects to login and the media API denies access. A temporary owner authenticated through the real login form; authenticated dashboard, catalogue, media, users and editor routes passed. The media file chooser permits multiple files and invalid product submission focuses the required name.
- A real theme save immediately updated the public container width; saving the original value restored it. The temporary account, its audit records and theme metadata were cleaned up. Existing content and unpublished fiberglass review drafts remain intact.
- Both document layouts declare their smooth-scroll behavior for Next.js 16 route transitions. The cinematic opening and collection gallery remain enabled. Deployment and real-device/network performance are outside this local verification.

## Collection gallery refinement - 9 October 2026

The homepage categories now form a staggered two-column gallery, with larger framed illustrations, distinct material palettes, clear Thai descriptions and collection links. Category headers repeat the palette and artwork. Uploaded category images still take precedence over illustrations; counts only appear for published products.

- The gallery and all four category destinations pass layout checks at **320, 390, 700, 768, 1050, 1440 and 1920px**: no horizontal overflow, one primary heading and category cards contained within the viewport. A minimum-height/aspect-ratio interaction found at 320px was corrected with an explicit panel width.
- Keyboard navigation, hover/focus treatment, reduced motion and category navigation pass. Production checks confirm all four destinations and native category links with JavaScript disabled. No browser runtime errors were observed during the gallery checks.
- The previous public loading boundary could leave streamed content hidden without JavaScript. It was removed so public pages render directly; fallback checks now assert actual visibility rather than only DOM presence and computed opacity.
- TypeScript, ESLint, formatting and the production build pass. Screenshots: `docs/screenshots/collections-gallery-desktop.png` and `collections-gallery-mobile.png`. The local database has no category photograph uploads, so this visual review covers the original illustration fallback; the uploaded-image path is retained in the component.
- Category order, visibility, descriptions, routes and product counts still come from the existing public queries. No database content or fiberglass review drafts were changed.

## Animated opening restored and refined - 9 October 2026

The homepage opens automatically with the original two-part scroll sequence again, superseding the optional-film layout below. The new composition uses ivory/gold Thai titles, a dark glass masthead, timed captions, a framed chapter-progress rail and a brighter editorial reveal. The official emblem and catalogue data remain intact.

- All **234 tests across 28 files**, TypeScript, ESLint and changed-source formatting pass. The production build passes with `NEXT_STANDALONE=false` and `NEXT_DIST_DIR=.next-production`. Isolating the output avoids collisions with an existing development server; the default deployment directory is unchanged. The inherited Auth.js/Jose Edge compression warning remains.
- `node scripts/verify-cinematic-home.mjs` passes against the production server: automatic playback, deferred second-sequence downloads, both scene ranges, reverse scrolling, hidden-control focus gating, the collections shortcut and route cleanup. No browser runtime errors occurred.
- Opening and final-reveal headings and actions fit at **1920x1080, 1280x720, 768x1024, 390x844, 320x568 and 844x390**, with no horizontal overflow. Clean production screenshots are saved as `docs/screenshots/cinematic-*.png`.
- Reduced motion and JavaScript-disabled browsing use optimized posters with readable content and no raw sequence downloads. Deliberately failed frame requests preserve the opening poster and product shortcut.
- Public-route layouts pass at seven widths from 320 to 1920px. Navigation disclosure, Escape/outside dismissal, mobile menus, catalogue filters, contact validation and missing-product recovery pass against production. A hidden decorative wordmark intercepted clicks on the opening title; disabling its pointer events fixed the issue. Opening product actions also navigate successfully at 1440, 390 and 320px. The final production build passes after this correction.
- The isolated frame-player browser checks pass: exact frame pixels forward/backward, rapid jumps, resize/DPR, cleanup/restart, delayed and missing frames, mobile/landscape and runtime motion-preference changes. The fixture now loads the separated cinematic stylesheet and strips its leading byte-order mark when concatenating CSS.
- This pass changes presentation and local build isolation. The fiberglass catalogue review drafts remain unpublished. Real-device performance and remote-network throughput are outside these local browser checks.

## Complete visual redesign - 9 October 2026

The public site now uses a warm ivory and forest green craft direction, preserving the official emblem, Thai content, real catalogue data, settings, authentication and server actions. The CMS shares the palette and restrained corner treatments. The original film remains available through an explicit, dynamically loaded experience.

- All **234 tests across 28 files**, TypeScript, ESLint and Prettier pass.
- Browser checks cover the homepage, catalogue, four real category pages, training, story, news and contact at **320, 390, 768, 1100, 1280, 1440 and 1920px**, with one primary heading and no horizontal document overflow. Intermediate laptop widths and a mobile viewport with JavaScript disabled were also inspected.
- Catalogue search, stock and featured filters retain state across category transitions and reset correctly. Category disclosure and mobile navigation support Escape, outside dismissal and focus restoration. Failed contact submissions focus the invalid field and retain enquiry text; no enquiry was created during validation checks.
- The final production screenshot review corrected the contact navigation button's active text colour. Both active and hover states pass WCAG AA text contrast at desktop and mobile widths; the final production build was repeated after this correction.
- No film frame requests occur before activation. Opening loads the players; closing unmounts them. Film skip links, reduced-motion stills and the mobile layout were checked. Public missing-record recovery renders correctly, with no browser runtime errors.
- A temporary local owner account authenticated through the real login form. All 20 CMS dashboard, listing, editor and settings routes passed layout checks at **1440, 768, 390 and 320px**. Product validation focuses the invalid name field; the mobile menu closes with Escape. Native colour inputs and positioned table accessibility labels were corrected after tablet/mobile checks. The temporary account and its audit entries were removed; existing accounts and content were retained.
- The optimized production build passes with `NEXT_STANDALONE=false`, the documented Windows packaging option. Linux/Docker standalone output is unchanged. The inherited Auth.js/Jose Edge compression warning remains. Production login, product validation, mobile menu, theme settings and the users table also pass. The local QA browser maps the configured port-3000 login return URL to the isolated port-3001 server without changing `.env`.
- The local database has no published products or news. Populated product-detail and news-detail browser flows therefore remain outside this pass; their existing renderers, image handling and business logic are retained. No fabricated content was published.
- Clean production screenshots are saved under `docs/screenshots/redesign-*.png`; additional review screenshots are under `test-results/redesign/`. The repeatable public check is `node scripts/verify-design.mjs`; `DESIGN_QA_URL` selects the server origin. Next.js streams the missing-product recovery with a `noindex` robots tag; an already streamed response can have HTTP 200 while rendering the 404 state.

The September sections below are historical verification of earlier designs and film configurations.

Implementation verified in isolated test environments, September 2026. Test accounts, products, news and generated frame fixtures are not seeded or committed.

## Hero refinement — 22 September 2026

The reference brief for this pass described a different product's hero — a left-aligned "DreamFrame" headline in white-to-lavender with a pink glow. Confirmed with the owner that it was a reference to translate rather than branding to adopt, and that the headline stays centred. The three treatments were applied to this site's own identity and palette: no DreamFrame wordmark, no lavender or pink, and the institutional emblem and Thai content untouched.

- The atmospheric shade behind the copy is centred rather than weighted to the left, matching the centred headline. It sits above the footage but outside it, so the 75% media opacity and the 35% veil reduction are both unchanged.
- The headline carries one white-to-gold gradient across both lines and one weight step (300 to 400/450), lit with `drop-shadow` rather than `text-shadow` — a shadow cast by text whose own colour is transparent for `background-clip: text` shows straight through the glyphs as a halo.
- The wordmark is the site's own name at 90vw on the floor of the stage, in the same gradient with a warm glow. It repeats the name in the bar and the badge, so it is `aria-hidden` rather than read out a third time, and it leaves with the copy at the hand-off.
- Measured across 1920x1080, 1440x900, 1280x720, 1024x768, 768x1024, 390x844, 320x568 and 844x390: nothing clipped outside the pinned stage, no horizontal overflow at any of them. Two clipping defects were found and fixed this way — Thai vowels below the baseline hitting the floor of the stage at the wordmark's original leading, and the whole composition overflowing at 1280x720, a common laptop size, because a pinned stage cannot scroll and the headline was sized against width alone. It is now sized against height between 621px and 820px.
- All **249 tests across 30 files**, TypeScript, ESLint, Prettier, `scripts/verify-scroll-sequence.mjs` and the production build pass.

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
