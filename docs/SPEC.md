# MASTER DESIGN & DEVELOPMENT PROMPT

## ฝ่ายฝึกวิชาชีพผู้ต้องขัง

### ทัณฑสถานบำบัดพิเศษกลาง

### Vocational Training, Product Showcase & CMS

Create a premium, cinematic, modern website specifically for:

**ฝ่ายฝึกวิชาชีพผู้ต้องขัง**
**ทัณฑสถานบำบัดพิเศษกลาง**

This project is **NOT** a full prison-management platform.

The scope is specifically:

1. Vocational training showcase
2. Rehabilitation through vocational skills
3. Product catalog
4. Product-category management
5. Product content management
6. Backend CMS for CRUD operations
7. News / activity content related specifically to vocational training
8. Public-facing presentation of vocational products and craftsmanship

Do NOT add unrelated prison-management systems such as:

- inmate administration
- discipline management
- relatives management
- online visitation
- online letters
- prison document routing
- general prison operations

Everything must remain within the scope of:

**ฝ่ายฝึกวิชาชีพผู้ต้องขัง**

---

# 1. CORE BRAND CONCEPT

The core message is:

**ฝึกอาชีพ สร้างทักษะ สร้างคุณค่า สร้างโอกาสใหม่**

The website should communicate:

- professional skill development
- craftsmanship
- discipline
- responsibility
- creativity
- vocational rehabilitation
- quality products
- real-world work experience
- employment readiness
- opportunities after release

The website should feel:

**Premium Craftsmanship × Modern Government × Human-Centered Rehabilitation × Apple-Level Presentation**

Do not make it feel like:

- an AI startup
- generic SaaS
- generic government portal
- prison-security website
- cheap marketplace template

---

# 2. ORGANIZATION IDENTITY

Primary organization:

**ฝ่ายฝึกวิชาชีพผู้ต้องขัง**

Institution:

**ทัณฑสถานบำบัดพิเศษกลาง**

Optional English supporting label:

**VOCATIONAL TRAINING & REHABILITATION**

Use the official logo exactly as supplied.

Never:

- redraw the logo
- modify the emblem
- change Thai lettering
- distort proportions
- generate a replacement government logo

---

# 3. PRODUCT CATEGORIES

The product catalog must initially contain exactly these four primary categories:

### 1. พวงหรีดแบ่งปัน

Products related to crafted condolence wreaths and appropriate related work produced through vocational training.

### 2. ไฟเบอร์กลาส และ ไม้

Products created through:

- fiberglass work
- woodwork
- decorative fabrication
- sculptures
- furniture
- functional items
- custom crafted pieces

### 3. ดอกไม้ประดิษฐ์

Handmade artificial-flower products and decorative floral arrangements.

### 4. เย็บปักถักร้อย

Products involving:

- sewing
- embroidery
- knitting
- fabric craft
- handmade textile products

---

# 4. CATEGORY ARCHITECTURE

Categories must NOT be hard-coded only in frontend components.

Create a proper database-backed category model.

Administrators must be able to:

- Create category
- Read category
- Update category
- Delete category
- Reorder category
- Enable / disable category
- Publish / unpublish category
- Change category image
- Change category icon
- Change description
- Change SEO metadata

The four initial categories should be seeded into the database.

The system architecture must still support adding additional categories later through the backend without changing frontend code.

---

# 5. CATEGORY DATA MODEL

Each category should support fields such as:

- `id`
- `name_th`
- `name_en`
- `slug`
- `short_description_th`
- `short_description_en`
- `description_th`
- `description_en`
- `cover_image`
- `thumbnail_image`
- `icon`
- `display_order`
- `status`
- `is_featured`
- `seo_title`
- `seo_description`
- `created_at`
- `updated_at`

Status may support:

- draft
- published
- hidden

Use sensible database constraints.

Slug must be unique.

---

# 6. PRODUCT MANAGEMENT

Every product must belong to at least one product category.

The backend must provide complete CRUD functionality.

Administrators must be able to:

- Create product
- Read product
- Edit product
- Delete product
- Duplicate product
- Publish product
- Unpublish product
- Archive product
- Restore product
- Search product
- Filter product
- Sort product
- Move product between categories
- Mark product as featured

Do not hard-code products in React components.

All public-facing products must come from the database/API.

---

# 7. PRODUCT DATA MODEL

Each product should support:

- `id`
- `sku`
- `name_th`
- `name_en`
- `slug`
- `category_id`
- `short_description_th`
- `short_description_en`
- `description_th`
- `description_en`
- `price`
- `sale_price`
- `price_display_mode`
- `cover_image`
- `gallery_images`
- `materials`
- `dimensions`
- `weight`
- `stock_status`
- `quantity`
- `made_to_order`
- `lead_time`
- `is_featured`
- `is_new`
- `status`
- `display_order`
- `seo_title`
- `seo_description`
- `created_at`
- `updated_at`

Possible product statuses:

- draft
- published
- out_of_stock
- archived
- hidden

---

# 8. PRICE DISPLAY LOGIC

Some vocational products may not require a fixed public price.

Support:

- Fixed price
- Starting price
- Contact for price
- Made-to-order
- Not for sale / showcase only

Do not force every product to have a numerical price.

The frontend should display the appropriate message depending on `price_display_mode`.

---

# 9. PRODUCT IMAGE MANAGEMENT

The CMS must support multiple images per product.

Administrators must be able to:

- upload images
- remove images
- reorder images
- choose cover image
- preview images
- replace images

Support:

- JPEG
- PNG
- WebP

Optimize uploaded images where appropriate.

Use responsive delivery on the frontend.

---

# 10. STRICT PRODUCT IMAGE RULE

Uploaded product photographs are authoritative.

Never automatically:

- regenerate the product
- change its shape
- change its color
- alter craftsmanship
- replace logos
- modify labels
- modify Thai text
- invent missing details

Frontend display may:

- proportionally resize
- crop safely when required
- position on backgrounds
- generate responsive image sizes

But the actual product itself must remain visually authentic.

---

# 11. PRODUCT LISTING PAGE

Create a premium product catalog.

The catalog page should provide:

- category navigation
- search
- filters
- sorting
- responsive product cards
- featured products
- new products

Primary category navigation:

**ทั้งหมด**

**พวงหรีดแบ่งปัน**

**ไฟเบอร์กลาส และ ไม้**

**ดอกไม้ประดิษฐ์**

**เย็บปักถักร้อย**

Do not overwhelm the interface.

Keep it editorial and premium.

---

# 12. PRODUCT CARD

Product cards should contain only essential information.

Possible structure:

- product image
- category
- Thai product name
- optional short English name
- price or price status
- short supporting label
- view-details action

Use generous spacing and refined typography.

Do not resemble a discount marketplace.

---

# 13. PRODUCT DETAIL PAGE

Each product needs its own URL.

Example:

`/products/[slug]`

Product detail layout should include:

- large image gallery
- product name
- category
- description
- materials
- dimensions where applicable
- price / inquiry status
- vocational-production information
- related products
- inquiry CTA

The page should emphasize both:

**the product**

and:

**the skill behind the product**

---

# 14. PRODUCT CATEGORY PAGE

Each category should have its own page.

Example:

`/products/category/[slug]`

Each category page should include:

- category hero
- category description
- category visual
- product grid
- featured products
- related vocational story

The four categories should each feel visually distinct while remaining within the same design system.

---

# 15. CATEGORY — พวงหรีดแบ่งปัน

Create a refined, respectful visual presentation.

The section should communicate:

- craftsmanship
- meaningful giving
- care
- social value
- vocational training

Avoid overly dark funeral imagery.

Keep it elegant, tasteful and respectful.

Possible headline:

**พวงหรีดแบ่งปัน**

Supporting concept:

**งานประดิษฐ์ที่ถ่ายทอดความตั้งใจ ผ่านการฝึกฝนและการสร้างคุณค่าจากทุกขั้นตอน**

---

# 16. CATEGORY — ไฟเบอร์กลาส และ ไม้

This category should visually emphasize:

- craftsmanship
- structure
- materials
- sculpting
- shaping
- sanding
- painting
- finishing
- assembly

Possible hero messaging:

**จากวัสดุ**
**สู่ผลงานที่มีรูปทรงและคุณค่า**

Use close-up production photography where available.

---

# 17. CATEGORY — ดอกไม้ประดิษฐ์

Visual direction:

- elegant
- refined
- handcrafted
- detailed
- soft
- premium

Focus on:

- texture
- arrangement
- color
- craftsmanship
- hand-made details

Avoid making the visual language overly feminine or decorative.

Keep it sophisticated and editorial.

---

# 18. CATEGORY — เย็บปักถักร้อย

Focus visually on:

- fabric texture
- thread
- embroidery
- sewing
- knitting
- pattern
- hand craftsmanship

Possible message:

**ทุกฝีเข็ม**
**คือการฝึกความละเอียดและความอดทน**

---

# 19. HOMEPAGE HERO

Create a cinematic homepage hero specifically for the vocational division.

Possible headline:

**ฝึกอาชีพ**
**สร้างโอกาสใหม่**

Supporting copy:

**พื้นที่แห่งการเรียนรู้และพัฒนาทักษะวิชาชีพ ผ่านการลงมือทำจริง สู่ผลงานที่มีคุณค่าและโอกาสในวันข้างหน้า**

Badge:

**ฝ่ายฝึกวิชาชีพผู้ต้องขัง**

CTA:

**ชมผลิตภัณฑ์**

Secondary CTA:

**เรียนรู้เรื่องงานฝึกวิชาชีพ**

Keep the hero minimal.

---

# 20. CINEMATIC SCROLL HERO

Use existing frames located at:

`public/frames/<set>/` — imported frame sequences, one folder per named set

Frames:

`frame-001.png`

through:

`frame-150.png`

Create a sticky full-screen HTML5 canvas.

Scroll controls the image sequence.

Approximately:

`400vh – 500vh`

Mapping:

- 0% → frame 001
- 25% → frame 038
- 50% → frame 075
- 75% → frame 113
- 100% → frame 150

Animation must be scroll-driven, not time-driven.

Implement:

- progressive preloading
- requestAnimationFrame
- interpolation
- lerp
- DPR support
- responsive resizing
- image cover logic
- reduced-motion support
- zero layout shift
- zero flicker

---

# 21. VOCATIONAL CATEGORY MARQUEE

Create two premium marquees beneath the hero.

Use the four product categories and related vocational language.

Examples:

**พวงหรีดแบ่งปัน**

**ไฟเบอร์กลาส และ ไม้**

**ดอกไม้ประดิษฐ์**

**เย็บปักถักร้อย**

**งานฝึกวิชาชีพ**

**CRAFTED WITH PURPOSE**

**SKILLS FOR A NEW BEGINNING**

Top row:

right → left

Bottom row:

left → right

Slow, seamless, understated.

---

# 22. BENTO GRID

Create a premium asymmetric Bento Grid using the supplied reference only for structural inspiration.

Suggested primary cards:

### พวงหรีดแบ่งปัน

### ไฟเบอร์กลาส และ ไม้

### ดอกไม้ประดิษฐ์

### เย็บปักถักร้อย

### เรื่องราวงานฝึกวิชาชีพ

### สินค้าแนะนำ

Each card should link to relevant content.

Do not add unrelated vocational categories unless they exist in the CMS.

---

# 23. FEATURED PRODUCTS

Create a configurable Featured Products section.

Admins must choose which products appear here through the CMS.

Do not determine featured products only from frontend code.

Use:

`is_featured = true`

or equivalent relational configuration.

Homepage should fetch featured products dynamically.

---

# 24. VOCATIONAL STORY

Create an editorial storytelling section.

Headline:

**จากการฝึกฝน**
**สู่ผลงานที่มีคุณค่า**

Supporting concept:

**ทุกขั้นตอนของการผลิตคือกระบวนการเรียนรู้ ทั้งทักษะ ความรับผิดชอบ ความละเอียด และมาตรฐานในการทำงาน**

Show:

- tools
- hands
- materials
- manufacturing process
- finishing details
- final products

---

# 25. BACKEND CMS

Build a complete protected administrative backend.

Suggested route:

`/admin`

The admin interface should be completely separate visually and functionally from the public marketing website.

It should prioritize:

- clarity
- efficiency
- speed
- data management
- reliability

Do not make the admin panel overly decorative.

---

# 26. ADMIN DASHBOARD

Dashboard should provide useful overview information such as:

- Total products
- Published products
- Draft products
- Archived products
- Products by category
- Featured products
- Out-of-stock products
- Recently updated products

Display useful data, not decorative charts with no purpose.

---

# 27. CATEGORY CRUD

Create:

`/admin/categories`

Administrators must be able to:

### CREATE

Add a new category.

### READ

View all categories.

### UPDATE

Edit:

- name
- slug
- description
- cover image
- ordering
- publication state
- SEO metadata

### DELETE

Delete appropriate categories with confirmation.

Before deletion:

If products still belong to a category, do not silently delete it.

Require either:

- moving those products
- selecting another category
- confirming archival behavior

Prevent orphaned records.

---

# 28. PRODUCT CRUD

Create:

`/admin/products`

Provide:

- searchable table
- category filtering
- status filtering
- pagination
- sorting
- bulk selection
- bulk status update where appropriate

Actions:

- View
- Edit
- Duplicate
- Publish
- Unpublish
- Archive
- Delete

---

# 29. CREATE PRODUCT

Route example:

`/admin/products/new`

The form should contain logical sections.

### Basic information

- Product name Thai
- Product name English
- SKU
- Slug
- Category

### Product description

- Short description
- Full description

### Media

- Cover image
- Image gallery

### Product information

- Materials
- Dimensions
- Weight

### Pricing

- Price type
- Price
- Sale price

### Inventory

- Stock status
- Quantity
- Made to order
- Lead time

### Publishing

- Draft / Published
- Featured
- New product
- Display order

### SEO

- SEO title
- SEO description

---

# 30. ADMIN VALIDATION

Use robust frontend and backend validation.

Examples:

- category is required
- Thai product name is required
- slug must be unique
- SKU must be unique if provided
- numerical prices cannot be negative
- image type must be accepted
- invalid records must not be submitted

Display clear Thai validation messages.

---

# 31. SAFE DELETE LOGIC

Do not immediately hard-delete important content.

Prefer soft deletion/archive for products.

Use something such as:

`deleted_at`

or:

`status = archived`

Allow administrators to restore products where appropriate.

For permanent deletion, require explicit confirmation.

---

# 32. BACKEND AUTHENTICATION

Protect all `/admin` pages.

Unauthorized users must never access CMS functions.

Implement appropriate authentication using the authentication solution already present in the project.

Do not unnecessarily replace the existing authentication system.

If no authentication exists, implement a secure, maintainable authentication system appropriate to the current stack.

Do not expose admin actions publicly.

---

# 33. AUTHORIZATION

Prepare role-based access.

Suggested roles:

### Super Admin

Can manage:

- users
- categories
- products
- system settings

### Admin / Editor

Can manage:

- products
- categories
- vocational content

Architecture should allow roles to expand later.

---

# 34. MEDIA MANAGEMENT

Create a reusable media-upload workflow.

Support:

- drag and drop
- upload progress
- image preview
- delete
- reorder
- replace

Keep storage architecture flexible.

If the existing project already uses cloud/object storage, continue using it.

Do not replace working storage infrastructure unnecessarily.

---

# 35. SEARCH

Public product search should search at minimum:

- Thai product name
- English product name
- description
- SKU
- category

Admin search should support fast management lookup.

---

# 36. FILTERS

Public filters may include:

- Category
- Availability
- New product
- Featured product

Admin filters should include:

- Category
- Status
- Stock status
- Featured
- Archived

Do not overload public users with unnecessary filters.

---

# 37. SORTING

Public product sorting may support:

- Featured
- Newest
- Name
- Price low → high
- Price high → low

Only show relevant options.

---

# 38. BACKEND API

Create clean backend APIs or server actions for:

### Categories

- create
- read
- update
- delete/archive
- reorder

### Products

- create
- read
- update
- delete/archive
- restore
- publish
- unpublish
- duplicate

### Media

- upload
- delete
- reorder

Validate all server-side input.

Never trust client input alone.

---

# 39. DATABASE RELATIONSHIP

At minimum:

`Category`

has many

`Product`

and

`Product`

belongs to

`Category`

Design relations with proper:

- foreign keys
- indexes
- unique constraints

Avoid orphaned products.

---

# 40. SEED INITIAL CATEGORIES

On initial setup, seed:

1. `พวงหรีดแบ่งปัน`
2. `ไฟเบอร์กลาส และ ไม้`
3. `ดอกไม้ประดิษฐ์`
4. `เย็บปักถักร้อย`

Do not insert fake products unless clearly marked as placeholder seed data.

---

# 41. NEWS / ACTIVITIES

The website may include news and activities only when related to:

- vocational training
- product development
- training programs
- exhibitions
- vocational projects
- workshops
- product launches
- skills development

The CMS architecture may support CRUD for this content as a separate content type.

Do not introduce general prison news unless specifically requested later.

---

# 42. NEWS CRUD

If the News / Activities module is implemented, support:

- Create
- Read
- Update
- Delete/archive
- Draft
- Publish
- Cover image
- Gallery
- Publish date
- SEO metadata

Admin route:

`/admin/news`

Public route:

`/news`

`/news/[slug]`

---

# 43. NAVIGATION

Public navigation should remain focused.

Suggested:

**หน้าแรก**

**ผลิตภัณฑ์**

**งานฝึกวิชาชีพ**

**เรื่องราวของเรา**

**ข่าวและกิจกรรม**

**ติดต่อ**

Do not add prison-management links.

---

# 44. PRODUCT NAVIGATION

Products dropdown or mega-menu may expose:

**พวงหรีดแบ่งปัน**

**ไฟเบอร์กลาส และ ไม้**

**ดอกไม้ประดิษฐ์**

**เย็บปักถักร้อย**

plus:

**สินค้าทั้งหมด**

Keep it simple.

---

# 45. CONTACT / PRODUCT INQUIRY

The platform should support product inquiries without forcing a full e-commerce checkout unless specifically requested.

Possible CTA:

**สอบถามสินค้า**

**ติดต่อสั่งซื้อ**

**ดูรายละเอียด**

If LINE integration already exists or is planned, prepare product-detail CTA architecture so product information can later be passed into LINE.

Example information:

- product name
- SKU
- product URL

Do not build fake payment functionality.

---

# 46. SEO

Provide proper:

- title
- meta description
- canonical URLs
- Open Graph data
- structured metadata
- product metadata where appropriate
- sitemap
- robots configuration

Thai content should be primary where appropriate.

---

# 47. RESPONSIVE DESIGN

Build for:

- desktop
- laptop
- tablet
- mobile

Do not simply shrink desktop layouts.

On mobile:

- stack Bento cards
- preserve image quality
- simplify hero typography
- maintain Thai readability
- provide usable filters
- use mobile-friendly admin tables/forms
- prevent horizontal overflow

---

# 48. THAI TYPOGRAPHY

Thai rendering must be flawless.

Recommended fonts:

- Noto Sans Thai
- IBM Plex Sans Thai
- Prompt

Pay special attention to Thai:

- vowels
- tone marks
- upper marks
- lower marks
- line-height

Never clip Thai glyphs.

---

# 49. NEXT.JS REQUIREMENTS

Next.js is already installed.

Do NOT:

- reinstall Next.js
- create a separate nested app
- replace the existing framework
- rewrite working infrastructure unnecessarily

First inspect:

- App Router or Pages Router
- existing database
- existing ORM
- authentication
- components
- global CSS
- design tokens
- storage
- APIs
- current project architecture

Then extend the current application cleanly.

---

# 50. RECOMMENDED APPLICATION STRUCTURE

Example:

`app/`

`app/page.tsx`

`app/products/page.tsx`

`app/products/[slug]/page.tsx`

`app/products/category/[slug]/page.tsx`

`app/news/page.tsx`

`app/news/[slug]/page.tsx`

`app/admin/page.tsx`

`app/admin/products/page.tsx`

`app/admin/products/new/page.tsx`

`app/admin/products/[id]/edit/page.tsx`

`app/admin/categories/page.tsx`

`app/admin/news/page.tsx`

Components:

`components/vocational/CinematicHero.tsx`

`components/vocational/ApertureSection.tsx`

`components/vocational/CategoryMarquee.tsx`

`components/vocational/CategoryBento.tsx`

`components/products/ProductCard.tsx`

`components/products/ProductGrid.tsx`

`components/products/ProductGallery.tsx`

`components/admin/ProductForm.tsx`

`components/admin/CategoryForm.tsx`

`components/admin/MediaUploader.tsx`

Adapt this structure to the current repository rather than blindly replacing it.

---

# 51. ADMIN UX

Admin interface should prioritize speed.

Use:

- clear sidebar
- breadcrumbs
- searchable lists
- visible status badges
- confirmation dialogs
- toast notifications
- loading states
- error states
- empty states
- autosave where appropriate
- unsaved-change warning

Use Thai labels for administrators where appropriate.

---

# 52. AUDIT-FRIENDLY ARCHITECTURE

Prepare important records to support fields such as:

- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

For important publishing changes, architecture may support future audit logging.

Do not over-engineer it, but do not design the CMS in a way that makes accountability impossible.

---

# 53. PERFORMANCE

Optimize:

- image loading
- database queries
- server rendering
- caching
- pagination
- scroll animation
- JavaScript bundle size

Do not load all product records on every page.

Do not load all 150 cinematic frames at full priority.

---

# 54. ACCESSIBILITY

Ensure:

- semantic HTML
- keyboard navigation
- focus states
- readable font sizes
- color contrast
- alt text
- reduced-motion support
- accessible forms
- accessible error messages

---

# 55. VISUAL PHILOSOPHY

Public website:

**cinematic + editorial + craftsmanship**

Backend:

**clean + practical + efficient**

Do not apply heavy cinematic animation to the CMS.

The public website can be emotionally engaging.

The backend must be fast and functional.

---

# 56. FINAL PUBLIC EXPERIENCE

The public site should tell this story:

**ฝึกฝน**

→

**พัฒนาทักษะ**

→

**สร้างผลงาน**

→

**สร้างคุณค่า**

→

**สร้างโอกาสใหม่**

The product catalog becomes evidence of real skills and craftsmanship rather than simply a sales inventory.

---

# 57. FINAL BACKEND REQUIREMENT

The CMS is a core part of this project, not an optional demo.

All four categories and their products must be manageable without editing source code.

An authorized administrator must be able to log into the backend and independently:

- add a category
- edit a category
- hide a category
- reorder categories
- add products
- edit products
- upload product images
- change prices
- assign products to categories
- publish products
- unpublish products
- archive products
- restore products
- delete products when appropriate
- mark featured products
- manage stock status
- search and filter products

Changes must be reflected dynamically on the public website.

---

# 58. CRITICAL SCOPE RULE

This application represents:

**ฝ่ายฝึกวิชาชีพผู้ต้องขัง**
**ทัณฑสถานบำบัดพิเศษกลาง**

Primary product categories:

**พวงหรีดแบ่งปัน**

**ไฟเบอร์กลาส และ ไม้**

**ดอกไม้ประดิษฐ์**

**เย็บปักถักร้อย**

These categories and their products must be managed through the CMS.

Do not convert the project into a complete prison-management system.

Do not add unrelated administrative modules.

Every feature should support one of these areas:

**Vocational Training**

**Product Showcase**

**Product Management**

**Craftsmanship**

**Rehabilitation**

**Skills Development**

**Public Product Discovery**

The final result should feel like a modern premium vocational-product platform operated by:

**ฝ่ายฝึกวิชาชีพผู้ต้องขัง**
**ทัณฑสถานบำบัดพิเศษกลาง**

here is the repo

```
git remote add origin https://github.com/M4rthin9/cida-ppt.git
git branch -M main
git push -u origin main
```

for any further authentication for git hub please ask