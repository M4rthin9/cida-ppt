# Website structure

The homepage opens with the supplied two-part cinematic sequence, controlled by scrolling. Posters render immediately, and the second sequence prewarms near the hand-off. A persistent shortcut leads to the database-driven collections. See [DESIGN.md](DESIGN.md) for the shared visual system.

## Public routes

| Route | Purpose and data source |
| --- | --- |
| `/` | Cinematic scroll journey, category collections, vocational story, CMS-selected featured products, published news and inquiry link |
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

## Cinematic opening

The homepage resolves both frame manifests on the server and passes them to `CraftJourney`. `CinematicHero` and `ApertureSection` share one pinned scroll range when both sets exist. `JourneyChrome` supplies chapter progress and a collections shortcut. The second player starts near the hand-off; both players clean up after leaving the scene or unmounting. A missing or half-imported set resolves to `undefined`. Reduced-motion and JavaScript-free rendering use the static compositions and original poster images.

Each stage owns one scroll listener (`lib/vocational/scroll-stage.ts`) and publishes its position as custom properties that the CSS reads; the player (`lib/vocational/scroll-player.ts`) only decodes, caches and paints, which is what lets two sequences of different lengths run on one page. Reduced motion parks each stage where its content is readable and uses optimized posters without sequence downloads.

Supply the real footage, import it, then review at desktop and mobile sizes, at the scroll landmarks and with reduced motion on. See [SCROLL-SEQUENCE.md](SCROLL-SEQUENCE.md) for the import path, [SETUP.md](../SETUP.md) for runtime setup and [VERIFICATION.md](VERIFICATION.md) for verification evidence and limitations.
