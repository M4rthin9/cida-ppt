# Website structure

The vocational website and CMS structure are complete, and the homepage now opens on the scroll-driven cinematic sequence. Imported footage is optional: with none installed both opening sections render their static composition, so no frame archive is a prerequisite for running or reviewing the application.

## Public routes

| Route | Purpose and data source |
| --- | --- |
| `/` | Scroll-driven cinematic opening and aperture reveal, category collections, CMS-selected featured products, vocational story, published news and inquiry link |
| `/products` | Database catalog with search, category/stock/featured/new filters, sorting and pagination |
| `/products/category/[slug]` | Published category description, cover and filtered products |
| `/products/[slug]` | Product gallery, price mode, specifications, vocational context, related products and inquiry |
| `/vocational` | Vocational training approach and current CMS categories |
| `/story` | Skills, craftsmanship and rehabilitation story |
| `/news` and `/news/[slug]` | Published vocational activities and articles |
| `/contact` | Contact settings and persisted inquiries; SMTP is optional |

Thai is the default locale. Legacy category/product URLs redirect to the canonical catalog URLs. Database visibility rules exclude disabled, hidden, archived, deleted and future content from public results.

## Administrative routes

| Route | Purpose |
| --- | --- |
| `/admin` | Product status counts, category breakdown and recent updates |
| `/admin/categories` | CRUD, publication, enable/disable, ordering, images, icons and SEO |
| `/admin/products` | Search, filters, pagination, bulk status changes and duplication |
| `/admin/products/new` and `/admin/products/[id]/edit` | Product content, category, gallery/cover, pricing, stock, publication and SEO |
| `/admin/news` | Vocational news, drafts, scheduled publication, media and archival |
| `/admin/media` | Original images, generated display sizes, reusable uploads and usage protection |
| `/admin/messages` | Stored inquiries |
| `/admin/users` | Owner-managed administrator accounts |
| `/admin/settings/*` | Owner-managed contact, LINE, SEO, theme and general settings |
| `/admin/audit` | Recorded administrative changes |

Auth.js identifies administrators; every CMS mutation rechecks database-backed roles and validates input. Products are archived before permanent owner-confirmed deletion. Category deletion requires reassignment when products still reference it.

## Data and content

PostgreSQL and Drizzle remain the source of truth. The idempotent seed adds exactly these initial categories without adding products or news:

1. พวงหรีดแบ่งปัน
2. ไฟเบอร์กลาส และ ไม้
3. ดอกไม้ประดิษฐ์
4. เย็บปักถักร้อย

Additional categories, actual products, photographs and vocational activities are entered through the CMS. Empty catalog and news states are intentional until authentic content is supplied. Uploaded originals and the supplied institutional emblem are preserved.

## Scroll-driven opening

The homepage resolves both frame manifests on the server and passes them to `CinematicHero` and `ApertureSection`. A set that is missing or half-imported resolves to `undefined`, and the section renders its static composition with no canvas and no frame requests — decided before any HTML is sent, so the page height never changes once the browser takes over.

Each stage owns one scroll listener (`lib/vocational/scroll-stage.ts`) and publishes its position as custom properties that the CSS reads; the player (`lib/vocational/scroll-player.ts`) only decodes, caches and paints, which is what lets two sequences of different lengths run on one page. Reduced motion parks each stage where its content is readable and downloads a single frame.

Supply the real footage, import it, then review at desktop and mobile sizes, at the scroll landmarks and with reduced motion on. See [SCROLL-SEQUENCE.md](SCROLL-SEQUENCE.md) for the import path, [SETUP.md](../SETUP.md) for runtime setup and [VERIFICATION.md](VERIFICATION.md) for verification evidence and limitations.
