# Approved production catalogue

Run `pnpm db:migrate` followed by `pnpm db:seed` with `DATABASE_URL` and a writable persistent `MEDIA_DIR` configured. `pnpm db:seed:production` is an alias. In the runtime Docker image, run `node scripts/seed-production.mjs` after migration, mounting the same media volume used by the website. See [SETUP.md](../../SETUP.md).

The seed installs 4 categories and 76 published products: 29 fiberglass/wood, 13 artificial flowers, 11 sharing wreaths, and 23 needlework products. Wreaths have sharing price ฿1,700 and outright purchase price ฿4,000; the white wreath is the first featured product. The 22 shirts cost ฿399 and the tote costs ฿199. Flower prices, including the blue and purple vase pairs, follow the approved catalogue.

`catalogue.json` contains public catalogue rows and typed public settings. `media/` contains their image files, including transparent product photographs, category homepage images, panoramic desktop backgrounds and separate mobile backgrounds. Every file has a SHA-256 and byte count in the manifest; the installer validates all of them before writing.

Re-running preserves administrator edits to products, translations, galleries, settings and existing image files. It fills missing hero and homepage backgrounds for the existing category identities. Removed galleries do not reappear. Stable identities prevent duplicate products; conflicting slugs, SKUs and storage keys fail before database changes. `--dry-run` validates without changing files or data.

The export excludes user accounts, credentials, sessions, enquiries, audit history, click analytics, drafts, archived content and unused media. The phone field stays blank while LINE OA is selected. Public indexing stays at the existing configured value; choose the real contact destination and review stock in the CMS before launch. Rows newly created by the seed are marked `is_seed` and remain editable in the CMS.

`pnpm db:seed:export` explicitly refreshes this fixture from the current approved database and media directory. Run it only after reviewing published content. `pnpm db:seed:verify` tests migrations, fresh installation, every image hash, repeat runs, pricing and preservation of CMS edits in a temporary database, then removes that database. CI runs this check on pushes and pull requests. Browser verification of LINE mode switching is recorded in `line-verification.json`; seed verification is recorded in `verification.json`.
