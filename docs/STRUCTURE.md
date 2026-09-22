# Website structure

The current phase completes the vocational website and CMS structure. The cinematic hero and `frames_150.zip` are explicitly deferred; they are not prerequisites for running or reviewing the application.

## Public routes

| Route | Purpose and data source |
| --- | --- |
| `/` | Static introduction, category collections, CMS-selected featured products, vocational story, published news and inquiry link |
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

## Deferred hero phase

The homepage imports the server-rendered `VocationalHero`; it does not import `ScrollSequence`, inspect the frame manifest or initialize a canvas. The existing conceptual image is explicitly captioned. The player and importer remain available for the later hero phase, but importing frames will not switch the homepage automatically.

Complete that phase by supplying the actual archive, importing it, reconnecting the player and reviewing the real images at desktop/mobile sizes, scroll landmarks and reduced-motion settings. See [SETUP.md](../SETUP.md) for runtime setup and [VERIFICATION.md](VERIFICATION.md) for verification evidence and limitations.
