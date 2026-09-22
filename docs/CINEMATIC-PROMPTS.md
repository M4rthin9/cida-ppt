# สร้างภาพต้น–ภาพปลาย → คลิป AI → 150 เฟรมสำหรับ hero

คู่มือนี้ปรับแนวทางจาก [prompt guide ที่คุณส่งมา](https://iodized-curio-93a.notion.site/AI-IMAGE-GENRATOR-3d4f8f4ea4578081b42ae725cc679868) และ [วิดีโออ้างอิงตั้งแต่นาที 6:09](https://www.youtube.com/watch?v=y1pM7bS6IY8&t=369s) ให้ใช้กับงานนำเสนอของ **ฝ่ายฝึกวิชาชีพ ทัณฑสถานบำบัดพิเศษกลาง** โดยยึดหลักภาพอ้างอิงต้น–ปลายและกล้องเคลื่อนต่อเนื่องในฉากเดียว Prompt ด้านล่างเขียนใหม่สำหรับโครงการนี้ ไม่ใช่คำสั่งออกแบบหน้าเว็บใหม่

เป้าหมายคือ **ภาพนิ่ง 2 ภาพ → วิดีโอหนึ่งช็อต → ZIP ที่มี 150 ภาพ** ไม่ต้องสั่ง AI สร้างภาพแยกกัน 150 ครั้ง เพราะรูปร่าง วัสดุ แสง และฉากจะไม่ต่อเนื่องกัน หน้าเว็บจะเลือกภาพตามตำแหน่ง scroll ส่วนความยาวคลิปใช้เฉพาะตอนเตรียมไฟล์

คู่มือนี้และ player ที่เตรียมไว้ยังไม่เปลี่ยนหน้าแรก ข้อความ เมนู ปุ่ม สี ระยะห่าง และรูปแบบ hero เดิมยังเป็นงานเดิมของคุณ

**ก่อนเริ่ม: เลือกผลงานจริงหนึ่งชิ้นเป็นต้นแบบ**

ตัวอย่างในคู่มือนี้ใช้ **ดอกไม้ประดิษฐ์จากผ้า 1 ชิ้นบนโต๊ะทำงาน** เพื่อให้รายละเอียดระยะใกล้และภาพกว้างเชื่อมต่อกันได้ง่าย นี่เป็นตัวอย่างแนวคิด ไม่ใช่การยืนยันว่าหน่วยงานผลิตผลงานชนิดนี้

หากมีผลงานจริง ให้ถ่ายภาพอ้างอิงอย่างน้อย 1 ภาพที่เห็นรูปร่าง สี และวัสดุชัดเจน ใช้ผลงานที่คุณต้องการนำเสนอจริงเป็นหลัก ภาพเพิ่มจากอีกมุมช่วยอธิบายรูปทรงได้ แต่ต้องเป็นชิ้นเดียวกัน

หากยังไม่มีภาพอ้างอิง สามารถใช้ prompt เพื่อทดลองภาพแนวคิดก่อน แล้วเปลี่ยนเป็นชิ้นงานจริงภายหลัง เก็บคำอธิบายว่าเป็น **ภาพแนวคิดที่สร้างด้วย AI** เมื่อนำไปแชร์หรือขอความเห็น ไม่ใช้ภาพสังเคราะห์เป็นหลักฐานของสถานที่หรือผลงานจริงของหน่วยงาน

แนวภาพใช้ฉากถ่านเข้ม แสงอุ่นคล้ายทอง และผิววัสดุที่ดูเป็นธรรมชาติ วางชิ้นงานใกล้กึ่งกลางค่อนไปทางขวา เผื่อด้านซ้ายที่มืดและเรียบให้ข้อความ hero เดิม อย่าวางรายละเอียดสำคัญชิดขอบขวา เพราะภาพแนวนอนจะถูกตัดด้านข้างเมื่อเปิดบนมือถือ

## 1. สร้างภาพเริ่มต้น — ใกล้จนเห็นรายละเอียดงานฝีมือ

เปิดเครื่องมือสร้างภาพที่รับภาพอ้างอิงได้ แนบภาพผลงานจริงถ้ามี เลือก **แนวนอน 16:9** แล้วคัดลอก prompt นี้ เปลี่ยนชนิดชิ้นงานให้ตรงกับภาพอ้างอิงก่อนใช้

```text
Create the START reference image for a single continuous cinematic camera shot.

Subject: one handcrafted fabric flower resting on a plain charcoal work mat on a dark craft table. If a product reference photograph is attached, preserve that exact product's shape, petal count, construction, fabric texture, stitching, and real colors. Do not redesign the product.

Composition: a close macro view of the flower's fabric folds and stitching, positioned near the center and slightly to the right. Keep the left third calm, dark, and low in detail so existing website text can sit over it. Keep important details away from the outer edges. At the edge of the shot, include only a small glimpse of the same work mat and a neatly folded piece of matching fabric. These are stationary objects in one physical scene.

Lighting and mood: a soft warm directional key light from the upper right, controlled deep shadows, subtle gold highlights on the fabric, rich charcoal surroundings, realistic material texture, quiet craftsmanship, restrained cinematic luxury. Preserve the true product colors. No glowing particles or artificial light effects.

Camera: realistic macro product photography, controlled shallow depth of field with the important stitching sharp, natural lens perspective, horizontal 16:9 framing. Fill the frame with the scene; no border or empty letterbox area.

Do not include text, captions, lettering, numbers, logos, watermarks, website UI, buttons, people, hands, uniforms, institutional buildings, extra flowers, or decorative gold objects. The image should not pretend to document any specific institution or location.
```

เลือกภาพที่รูปทรงถูกต้องและผิวงานไม่บิดเบี้ยว บันทึกเป็น `start.png` ก่อนทำภาพปลาย หากใช้ภาพผลิตภัณฑ์จริง ให้เทียบกับต้นฉบับก่อนดำเนินการ

## 2. สร้างภาพปลาย — เปิดให้เห็นชิ้นงานเดิมและโต๊ะมากขึ้น

ใช้ `start.png` เป็นภาพอ้างอิงหลักในการสร้างหรือแก้ไขภาพถัดไป แนบภาพผลงานจริงเพิ่มด้วยถ้าเครื่องมือรองรับ ตั้งอัตราส่วนและขนาดภาพให้ตรงกับภาพเริ่มต้น แล้วใช้ prompt นี้

```text
Create the END reference image for the same continuous camera shot shown in the attached START image. Use the START image as the authority for the product, arrangement, surface, light direction, colors, and atmosphere.

This is the exact same handcrafted fabric flower in the exact same position on the exact same charcoal work mat and dark craft table. Preserve its petal count, fabric folds, stitching, proportions, orientation, and real colors. Preserve the position and folds of the matching fabric already glimpsed in the START image. Nothing has been added, removed, rearranged, or transformed.

The only change is the camera: it has moved slowly backward in a straight line along the same viewing direction to reveal the entire flower and a little more of the same mat and table. Use a modest wider reveal, not a distant room view. Keep the flower near the center and slightly to the right. Keep the left third dark, simple, and low in detail for existing website text. Important product details must remain visible in a centered mobile crop.

Maintain the same soft warm key light from the upper right, deep charcoal shadows, restrained gold highlights, realistic fabric texture, exposure, white balance, and horizontal 16:9 framing. Let the wider view bring more of the stationary object into focus naturally. No dramatic lens change.

No new props, extra flowers, people, hands, text, logos, watermarks, UI, architecture, uniforms, particles, spotlight beams, borders, or letterboxing. This must look like the same scene viewed from a camera position slightly farther back, not a different generated scene.
```

บันทึกภาพเป็น `end.png` แล้วเปิดเทียบกับ `start.png` ตรวจจำนวนกลีบ รอยพับ รอยเย็บ ทิศทางชิ้นงาน ตำแหน่งผ้า แสง และสี หากไม่ตรง ให้แก้ภาพปลายก่อนสร้างคลิป การให้วิดีโอพยายามเชื่อมภาพที่ต่างกันมากมักทำให้ชิ้นงานเปลี่ยนรูปกลางทาง

หากชิ้นงานจริงเป็นงานไม้หรือสิ่งทอ ให้เปลี่ยนคำอธิบายชิ้นงานและรายละเอียดวัสดุใน **ทั้งสอง prompt** ให้ตรงกัน เช่น เนื้อไม้และรอยต่อ หรือเส้นด้ายและรอยทอ คงหลักการชิ้นเดียว ฉากเดียว และกล้องถอยออกเหมือนเดิม ไม่ผสมหลายประเภทงานใน sequence แรก

## 3. ทำภาพ 2 ภาพให้เป็นวิดีโอหนึ่งช็อต

เลือกเครื่องมือ image-to-video ที่มีช่องสำหรับ **ภาพเริ่มต้นและภาพปลาย** จริง ชื่อช่องอาจเป็น start/end frame หรือ first/last frame การแนบภาพสองภาพในช่องอ้างอิงทั่วไปไม่ได้แปลว่าเครื่องมือจะใช้เป็นจุดเริ่มและจุดจบเสมอไป

1. ใส่ `start.png` ในช่องภาพเริ่ม และ `end.png` ในช่องภาพปลาย
2. เลือก 16:9 และคลิปสั้นประมาณ 6–10 วินาที ตามระยะเวลาที่เครื่องมือรองรับ หากเลือกได้ ให้เริ่มทดลองที่ 8 วินาที
3. เลือกความละเอียด 1080p ถ้าเครื่องมือรองรับ หรือส่งออกที่ความละเอียดต้นฉบับที่มี ไม่จำเป็นต้องขยายภาพให้ใหญ่ก่อนแยกเฟรม
4. ใช้ motion prompt ด้านล่าง หากมีตัวควบคุมความแรงการเคลื่อนไหว ให้เริ่มจากระดับต่ำ
5. ดาวน์โหลดไฟล์วิดีโอ เช่น `hero.mp4` แล้วตรวจทั้งคลิปก่อนแยกเฟรม

```text
Animate one continuous cinematic product shot from the provided START image to the provided END image.

The handcrafted flower, its petals, stitching, fabric folds, mat, and table remain perfectly still and physically consistent for the entire shot. The camera alone moves: a very slow, steady backward dolly along the same viewing direction, gradually revealing the whole product and slightly more of its existing workspace. Follow a short, simple camera path with no orbit, pan, tilt, roll, or direction reversal.

Match the START image at the beginning and the END image at the end. Reveal only portions of the same stationary scene that become visible as the camera withdraws. Preserve object geometry, proportions, material texture, placement, and orientation in every frame. Keep the key light, shadows, exposure, white balance, and charcoal-and-warm-gold atmosphere stable. Maintain quiet negative space on the left for existing website text.

Use a single unbroken take at a slow, nearly constant camera speed. Natural depth of field, subtle physically plausible parallax, sharp craft details, no heavy motion blur. Calm, minimal, cinematic product photography.

No cuts, transitions, dissolves, morphing, teleporting, growing or disappearing parts, fabric movement, camera shake, sudden zoom, speed ramps, focus hunting, flicker, pulsing light, particles, text, logos, watermarks, UI, or new objects. Do not animate the product. Do not invent another location.
```

หากเครื่องมือรองรับเฉพาะภาพเริ่มต้น สามารถทดลองกล้องถอยออกจาก `start.png` ได้ แต่ไม่สามารถกำหนดภาพสุดท้ายให้ตรงกับ `end.png` ผ่านช่องภาพปลายที่ไม่มีอยู่ได้ หากต้องการตามขั้นตอนนี้ครบ ให้ใช้เครื่องมือที่รองรับภาพต้น–ปลาย

### ตรวจคลิปก่อนทำ 150 เฟรม

ดูคลิปเต็ม แล้วเลื่อนย้อนและหยุดดูช่วงต้น กลาง และท้าย เพื่อตรวจว่า:

- กลีบ รอยเย็บ และรอยพับยังเป็นชิ้นเดิม ไม่มีส่วนงอก หาย ละลาย หรือไหลเปลี่ยนรูป
- กล้องเคลื่อนต่อเนื่อง ไม่มีช่วงกระโดด ตัดภาพ หรือแสงวูบ
- ไม่มีข้อความ โลโก้ หรือวัตถุใหม่ปรากฏกลางคลิป
- ด้านซ้ายอ่านพาดหัวเดิมได้ และครอปตรงกลางสำหรับมือถือแล้วยังเห็นชิ้นงาน
- ไม่มีช่วงมืดสนิทหรือการค้างภาพยาวโดยไม่ได้ตั้งใจ

หากมีการเปลี่ยนรูปกลางทาง ให้ลดระยะถอยของกล้องและทำภาพปลายให้คล้ายภาพเริ่มมากขึ้น แล้วสร้างคลิปใหม่ การแยกเป็น PNG ไม่สามารถซ่อมความผิดพลาดที่อยู่ในวิดีโอต้นทางได้

## 4. แปลงวิดีโอเป็น `_150.zip`

โครงการมีตัวช่วยเตรียมเฟรมอยู่แล้ว ดูการติดตั้งและทางเลือก FFmpeg แบบละเอียดใน [คู่มือเตรียมเฟรม ขั้นตอน 4–6](SCROLL-SEQUENCE.md#4-ตรวจเครื่องมือครั้งแรก)

ตัวอย่างนี้สมมติว่าไฟล์อยู่ที่ `E:\video\hero.mp4` และมีช่วงที่ใช้ได้ยาว 8 วินาทีตั้งแต่ต้นคลิป เปิด Terminal ที่โฟลเดอร์โครงการ แล้วรันทีละบรรทัด:

```powershell
cd E:\cida-ppt
pnpm frames:make "E:\video\hero.mp4" --start 0 --duration 8
pnpm frames:import
```

หากคลิปยาว 6 วินาที ให้เปลี่ยนเป็น `--duration 6` หากมีช่วงเสียต้นคลิป ให้ใช้ `--start` เลือกจุดเริ่มใหม่ และลด `--duration` ให้จุดสิ้นสุดไม่เกินความยาวไฟล์ ไม่จำเป็นต้องทำให้คลิปมี 150 เฟรมตั้งแต่ในเครื่องมือ AI ตัวช่วยจะเลือกภาพ 150 ภาพจากช่วงที่กำหนด

หาก FFmpeg ไม่อยู่ใน PATH ใช้ตำแหน่งที่พบในเครื่องนี้:

```powershell
pnpm frames:make "E:\video\hero.mp4" --start 0 --duration 8 --ffmpeg "H:\New folder\ffmpeg\bin\ffmpeg.exe"
pnpm frames:import
```

ผลลัพธ์ที่ต้องได้คือ:

```text
public/frames/_150.zip
  frame-001.png
  frame-002.png
  ...
  frame-150.png
```

หลังนำเข้าจะมีภาพที่แตก ZIP และ `public/frames/manifest.json` ให้ player ใช้ ขนาดภาพทุกเฟรมต้องเท่ากัน ตัวช่วยใช้ความกว้างไม่เกิน 1280 พิกเซลเป็นค่าเริ่มต้น ชื่อที่โครงการคาดหวังคือ `_150.zip`; หากต้องการเก็บชื่อ `frame150.zip` เพิ่ม ดูตัวเลือก `--output` ในคู่มือเตรียมเฟรม

หากมี ZIP ชื่อเดิมอยู่แล้ว ตัวช่วยจะหยุดก่อนเขียนทับ เก็บรุ่นใหม่ด้วย `--output` หรือเพิ่ม `--overwrite` เมื่อคุณต้องการแทนที่ไฟล์เดิม

## 5. ทดลองกับ player เมื่อพร้อมเชื่อม hero

นำเข้าเฟรมเสร็จแล้วจึงนำชุดนี้ไปทดลองกับ reusable player การนำเข้าอย่างเดียวไม่เปลี่ยนหน้าแรกและไม่ deploy เว็บไซต์ เมื่อเชื่อมแล้วต้องตรวจว่าเลื่อนจากเฟรม 001 ถึง 150 และเลื่อนย้อนกลับได้โดยไม่กระโดด รวมถึงตรวจจอมือถือและ Reduce Motion ตาม [คู่มือตรวจ animation](SCROLL-SEQUENCE.md#7-เปิดเว็บและตรวจหลังเชื่อม-animation)

ภาพแต่ละเฟรมควรมีฉากเต็มถึงขอบเพื่อให้ canvas ครอปแบบเต็มจอได้ หากสีขอบภาพไม่กลืนกับ hero เดิม ให้ปรับฉากและแสงของภาพต้นทางให้เข้ากับสีที่มีอยู่ โดยรักษา UI เดิมตามที่คุณกำหนด

หากต้องการภาพของงานฝึกวิชาชีพจริงทั้งหมด ใช้ [เส้นทางถ่ายด้วยโทรศัพท์ตั้งแต่ต้น](SCROLL-SEQUENCE.md#1-เลือกภาพที่จะถ่าย) แทนขั้นตอนสร้างภาพและวิดีโอ AI แล้วใช้คำสั่งแยกเฟรมชุดเดียวกัน
