# Fiberglass and wood catalogue drafts

Prepared from the supplied `รายละเอียดผลิตภัณฑ์ทั้งหมด ส่งขายออนไลน์.xlsx`. **All 29 fiberglass products are now published**, following the user's explicit request, with stock set to **Available now**. The two wooden products remain review files only. [publication.json](publication.json) records the publication, while [publication-before.json](publication-before.json) preserves the previous draft values. [public-verification.json](public-verification.json) records the public-page checks.

Open [cms-review.html](cms-review.html) for the imported products, links to their CMS editors and an original/prepared photo comparison. [cms-import.json](cms-import.json) records product and media IDs, source rows, review issues and verification. Imports use real authenticated CMS forms and the existing upload pipeline; the dedicated import actor is disabled after use while its audit attribution remains.

The user's final image requirement supersedes the initial AI styling request: **no AI images are used**. [presentation/manifest.json](presentation/manifest.json) describes the 30 original-preserving PNGs. Fourteen sideways photos receive a 90° clockwise rotation; all receive square ivory padding. Removing padding and reversing rotation reproduces every decoded original RGBA pixel exactly. No crop, resampling, repainting, background removal, perspective change or reconstructed detail is applied. Original embedded files are untouched. Normal CMS web renditions are derived from these files; each uploaded presentation PNG is also retained byte-for-byte by the media pipeline.

Photo associations follow the visual review; the original source ambiguities remain documented in the import report. The ART TOY listing asks customers to confirm the model and number of pieces before ordering. The unitless weight is left empty. All source prices are preserved and no selling unit, quantity or missing weight has been invented. Product images now have descriptive Thai alt text.

Open [review.html](review.html) in a browser for the photo catalogue, material filters and issues. [review.csv](review.csv) opens in Excel with Thai encoding. [drafts.json](drafts.json) contains structured drafts; [source.json](source.json) retains original cell values, merged ranges and photo anchors. `originals/` preserves all 34 embedded image files byte for byte, including one Excel WDP fallback that is not used on the review page.

The workbook contains **31 entries: 29 fiberglass and 2 wooden products**, in the existing `fiberglass-and-wood` category. Its 29 numbered items include three distinct Ganesha poses under source item 4. Prices range from **150 to 5,000 THB** and the source header says they include delivery. No selling unit, delivery coverage, effective price date or stock information is supplied.

## Review items

| Source row | Product | Review needed |
| --- | --- | --- |
| 13–14 | นิลพัด / หนุมาน ( การ์ตูน ) | The white cartoon Hanuman PNG is anchored beside Nilaphat. Its proposed assignment to row 14 is flagged for confirmation. |
| 19 | แจกัน | A uniform figurine PNG is incorrectly anchored beside the vase. The vase uses its JPEG; the uniform photo stays unassigned. |
| 20 | ART TOY ชุดปฏิบัติการ /ชุดทูโทน | Two photographs show different outfits and multiple figures. Confirm whether 500 THB is per item or per set and which variants are offered. |
| 21 | โมเดลรถตุ๊กตุ๊ก | `1,85 g` is ambiguous. Numeric weight remains unset. |
| 29 | ที่เปิดขวดกางเกงมวย | `72` has no weight unit. Numeric weight remains unset. |

Preserve source spellings. Missing dimension components remain null; no SKU, sale price, quantity, lead time, stock availability or made-to-order status is invented. Review draft stock and made-to-order fields are null because they require confirmation before conversion to the CMS's required enumerations.

Explicit gram values, including mixed Thai and Arabic digits, are converted to **kilograms**, matching the existing CMS. `weight_kg` maps to its `weight` field. Descriptions explicitly mention the source's delivery-inclusive price. `images` reference original files; they must be processed through the existing authenticated media-upload pipeline before their media IDs can be assigned to CMS products. Some photos are sideways: the review uses a CSS display rotation while preserving their original bytes. The proposed orientation is recorded in `display_rotation_degrees`.

## Reproduce

From the repository in PowerShell:

```powershell
./scripts/extract-catalogue-workbook.ps1 -Workbook 'F:/รายละเอียดผลิตภัณฑ์ทั้งหมด ส่งขายออนไลน์.xlsx' -Destination 'content/fiberglass-drafts'
node scripts/prepare-catalogue-drafts.mjs content/fiberglass-drafts
```

The extraction reads XML values and embedded media without Excel, macro execution, formula evaluation or external-resource loading. Workbook prose is treated as data. The preparation script checks the workbook hash because its photo corrections are specific to this source; changed workbooks require another review.

Creating actual CMS entries must use authenticated, role-checked product and media actions so validation and audit records are retained. All reviewed entries should be saved as drafts until stock, selling units and flagged data are confirmed.
