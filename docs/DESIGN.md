# Vocational design system

The site presents the work of the vocational division at the Central Special Treatment Institution. Its audiences are people exploring handmade products, prospective customers seeking an enquiry, and staff managing genuine content. The redesign combines the authority of the exact official emblem with the warmth of a craft publication.

## Visual direction

Warm ivory paper, forest green ink, restrained brass details, generous space and precise rules form the identity. The homepage opens with the supplied two-part scroll film: graphite shadows, ivory and gold Thai titles, a dark glass masthead and a chapter timeline. The illuminated second scene carries a serif signature and leads into the paper catalogue. The sequence is captioned as an illustrative concept. Category illustrations describe materials and techniques; they never stand in for product photographs. Authentic category uploads replace these illustrations.

All four published categories now use matching product-based studio photography: forest-green walls and floors, soft warm light, restrained foliage and ivory displays. Homepage tiles keep the products within their crop-safe composition, while category headers fill the entire banner and use a separate portrait source on mobile. Wreath backgrounds show three complete wreaths on black stands. Image delivery uses quality 90 and enough source pixels for the covered height of tall cards. Product photographs retain transparent backgrounds over the shared ivory studio presentation.

| Token | Default | Role |
| --- | --- | --- |
| `colorBg` | `#f8f6f0` | Page paper |
| `colorSurface` | `#efede5` | Secondary surfaces |
| `colorHeading` | `#243b32` | Headings |
| `colorText` | `#43544b` | Body text |
| `colorTextMuted` | `#667064` | Supporting text |
| `colorBrand` | `#294c3c` | Actions and links |
| `colorBrandTint` | `#e7eee6` | Selected and hover states |
| `colorBorder` | `#d8dbce` | Rules and field borders |
| `colorAccent` | `#0b7a3f` | Recognizable LINE action |

Public tokens resolve to the CMS-controlled theme. An exact match to the original, uncustomized stored palette adopts the new defaults without a database write. Customized palettes are retained, as are saved widths and corner radii. The versioned theme cache prevents the previous defaults from lingering after deployment.

## Typography and composition

The homepage opens with the craft scroll animation, followed immediately by a 3D product carousel, before the category index and gallery. The selected ivory card sits full-size in the centre, with neighbouring cards angled and recessed using CSS perspective, depth and layered shadows. Large studio photographs remain uncropped; forest-green type and brass details match the site. The carousel loops in both directions. Customers can select a side card, use arrow controls or keyboard arrows/Home/End, swipe on touch screens, drag with a mouse or use horizontal trackpad gestures. Vertical touch scrolling remains available. Only the active card's product links are interactive; side cards have separate selection buttons, and inactive product content is inert. The position announcement includes the selected product's name. Reduced motion removes transitions while preserving the static perspective layout.

The carousel shows CMS-featured products first, then fills remaining positions with distinct published catalogue products, up to twelve cards. The user's selected white sharing wreath occupies the first position. Product fields and feature flags remain under CMS control. It follows the complete film without overlapping it; images load lazily as visitors reach the products. The server renders the initial centre card and its real product links before JavaScript enhancement.

Keep the self-hosted variable Anuphan fonts, the official emblem and its proportions. Thai receives no letter spacing and enough line height for stacked marks. Latin supporting labels use a small tracked scale; serif accents are limited to indexes and the footer signature. Public headings use responsive sizes. Body text and inputs retain a 16px baseline. Small collection labels supplement readable Thai titles and descriptions.

The homepage moves from the cinematic craft story to product selection, collection links, four category tiles, a skills process and an enquiry. The film uses a 620svh journey on desktop and 540svh on phones, with the two stages sharing one pinned viewport. Interior pages share the same headings, borders, controls and content widths. Product images remain uncropped; category banners and news covers use purposeful proportional cropping. The catalogue supports its existing query parameters and pagination. An empty catalogue points to the training story without suggesting fabricated stock or events.

## Interaction and accessibility

- The sticky masthead uses dark glass on the homepage and a paper surface on interior pages. Category disclosure and mobile menus have explicit buttons, expanded states, outside dismissal, Escape handling and focus restoration.
- Touch controls have generous targets. Desktop menus collapse before they become crowded. Categories use a rounded bento grid: one tall feature tile, one wide tile and two compact tiles on desktop, two columns on tablets and one on phones. Background photographs fill each tile beneath a dark readability gradient; category artwork supplies the fallback. The CMS field ภาพพื้นหลัง Bento controls each category independently, with the banner image used when no tile background is selected. Product counts only appear for published work.
- Focus outlines, semantic headings, field labels, contextual errors and alt text remain visible. Failed contact submissions focus the first invalid control and retain the visitor's text.
- Reveals use a small translation and short duration. No magnetic controls, pointer-driven tilts or continuous decorative loops are needed. Reduced motion disables enhancement and displays readable film stills.
- The film opens automatically, with server-rendered optimized posters before any canvas paints. The second sequence prewarms near the hand-off. Players stop after the scene leaves view and when the route unmounts. A persistent product shortcut skips directly to the collections. Invisible stage controls become inert. Reduced motion and JavaScript-free browsing use readable static compositions without sequence downloads.
- Not-found and error pages use the shared public system. Public content renders directly rather than behind a streaming loading boundary, preserving readable pages when JavaScript is unavailable. Existing metadata, consent, authentication, audit records and visibility rules remain intact.

## CMS and implementation

The CMS keeps its working navigation, forms, rich-text editor, tables, media library and role enforcement. Its canvas, palette and corner tokens align with the public site while preserving a focused workspace. All database and server-action behavior is retained.

`src/app/globals.css` owns shared fonts and theme utilities. `src/app/vocational.css` owns public layouts; `collections.css` owns the collection gallery and coordinated category headers. `src/app/cinematic.css` isolates the film choreography; `cinematic-opening.css` defines its opening composition, chapter chrome and responsive art direction. `src/app/effects.css` contains modest interaction enhancement. CMS styles remain in `cms.css` and `cms-refresh.css`. Colours used across components resolve through tokens rather than scattered component values.

## Product photography

`src/components/media/product-image.tsx` and its CSS module provide the shared photographic treatment for all catalogue cards, featured products, detail galleries and thumbnails. Square cards use an ivory studio gradient, a fine forest-green frame and a restrained brass rule; gallery images use the same treatment within their existing responsive proportions. Colours follow the CMS theme. The current catalogue uses AI-assisted transparent commercial photographs generated from the supplied high-resolution product references, as explicitly requested on 12 October. `content/product-studio/manifest.json` records the source associations and prompts; originals and previous CMS media remain retained. Images stay fully visible with `object-fit: contain`. A soft drop shadow integrates the cutouts with the shared studio surface, without colour blending; Next.js quality 90 retains painted detail. Hover enlargement respects reduced motion. Product names reserve two lines and prices align across each catalogue row.

## Category studio photography

The sharing-wreath collection contains eleven distinct designs from the supplied photographs. Duplicate views do not create duplicate products. Each uses a transparent commercial photograph against the same ivory studio treatment as other products. The white “ขาวพิสุทธิ์” design is the first featured product. A compact two-row price display labels “ราคาแบ่งปัน” (1,700 THB) and “ราคาขายขาด” (4,000 THB) separately on cards and detail pages. These are separate options, with no discount styling. Both values are editable in the CMS; sharing terms and delivery arrangements are handled by staff enquiry.

The fiberglass category header now uses a full-width photograph behind its title and description. A dedicated panoramic composition reserves dark green space for desktop copy; a portrait composition keeps the three products visible above the copy on phones. `CategoryHeroImage` uses Next.js `getImageProps` and native picture art direction, selecting the hero's versioned mobile rendition up to 760px. The image and contrast gradient fill the entire header. The homepage tile and the other three categories retain their preceding appearance.

Only the fiberglass and wood homepage tile and category hero use the new forest-green studio, warm-ivory plinths and soft commercial lighting, following the user's scope clarification. `content/category-banners/studio-v4/` retains the two active native-resolution assets, exact prompts, product references and CMS assignments. The three unused craft scenes are archived and unassigned; wreath, flower and needlework categories retain their previous artwork and palettes. Category images do not add catalog products. The fiberglass images request Next.js quality 90. Its homepage image fills the wide desktop tile and preserves the complete product group on narrow tiles.

## Verification

Run the repository's typecheck, lint, test and build scripts. For browser verification, start a correctly configured local server and run `node scripts/verify-design.mjs` (Chrome must already be available). `DESIGN_QA_URL` selects another origin. The check covers public pages and category routes at seven widths, catalogue filters, contact error focus, menus, the film shortcut and route cleanup. `node scripts/verify-cinematic-home.mjs` checks both scene ranges, reverse scrolling, deferred reveal loading, focus gating, landscape/portrait bounds, reduced motion and JavaScript-free content. Screenshots are saved under `test-results/cinematic/`.

Use a temporary local QA account to inspect CMS routes without changing an existing account. Check product editors, settings, navigation, field errors and contained tables on desktop and mobile. Never add fake published business content to fill empty layouts.
