# บันทึกการพัฒนา

[English](DEVELOPMENT_LOG.md) · **ภาษาไทย** · [กลับไปที่ README](../README.th.md)

ปัญหาหลักที่เจอระหว่างทำโปรเจกต์นี้ สาเหตุ และวิธีแก้ ทุกการเปลี่ยนแปลงผ่าน pull request ที่มี CI ตรวจ และดูประวัติได้ใน repository

## ลำดับเวลา

| วัน                | งาน                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| วันที่ 1 (9 ต.ค.)  | ตั้ง repository, npm workspaces, โครง NestJS และ Next.js, Prisma, CI ทำ API ครบทุก endpoint พร้อม unit test และ e2e test ฝั่งเว็บทำ proxy, API client แบบมี type และการเริ่ม session |
| วันที่ 2 (10 ต.ค.) | หน้าแรกตามดีไซน์ Figma, component test, แก้ bug time zone, หน้าเกมพร้อม animation, health check, deploy และเอกสาร                                                                    |

## ปัญหาและวิธีแก้

### 1. เวลาเลื่อนไป 7 ชั่วโมง ([#19](https://github.com/Jakkapon-Dev/Games-Nextzy/issues/19))

- **ปัญหา:** บน PostgreSQL ที่ตั้ง time zone เป็น Asia/Bangkok รอบที่เล่นผ่าน API ถูกเก็บเร็วไป 7 ชั่วโมง ส่วนข้อมูลที่ client อื่นเขียนลงไปกลับถูกอ่านออกมาช้าไป 7 ชั่วโมง หน้าเว็บดูเหมือนถูกเพราะการเลื่อนสองทางหักล้างกันพอดี test จึงจับไม่ได้
- **สาเหตุ:** driver adapter `pg` ของ Prisma เขียนและอ่านเวลาเป็น UTC แต่ session ของฐานข้อมูลใช้ time zone ของเซิร์ฟเวอร์
- **วิธีแก้:** การเชื่อมต่อตั้ง `-c TimeZone=UTC` เพิ่ม e2e test ตรวจทั้งสองทิศทาง โดยเทียบกับเวลาที่เขียนด้วย SQL โดยตรง และ CI รัน PostgreSQL ด้วย `TZ=Asia/Bangkok` พร้อมเช็ก time zone ของ session ถ้า bug แบบนี้กลับมา build จะล้มทันที
- **บทเรียน:** test ที่เขียนและอ่านผ่านชั้นเดียวกันอาจซ่อน bug สองตัวที่หักล้างกันได้ ต้องเทียบกับแหล่งข้อมูลที่เป็นอิสระ

### 2. Deploy บนแพ็กเกจฟรี

- **Render แพ็กเกจฟรีไม่มีขั้น pre-deploy:** blueprint จึงรัน `prisma migrate deploy` ก่อน `node dist/main` ในคำสั่ง start ส่วน `start:prod` ไม่รัน migration การรันบนเครื่องจึงไม่แก้ฐานข้อมูลโดยไม่ตั้งใจ
- **เครื่องมือ build อยู่ใน devDependencies:** ถ้าตั้ง `NODE_ENV=production` คำสั่ง `npm ci` จะข้ามไป จึงใช้ `npm ci --include=dev --workspace=api` และ flag workspace ยังช่วยข้าม dependency ของเว็บด้วย
- **ไม่ได้ commit Prisma Client:** สคริปต์ `build` ของ API จึงรัน `prisma generate` ก่อน
- **การเชื่อมต่อ Supabase:** session pooler พอร์ต 5432 ใช้ได้ทั้งตอน API ทำงานและตอน migrate ส่วนการต่อตรงต้องใช้ IPv6 และ transaction pooler พอร์ต 6543 เหมาะกับ serverless
- **ปิด Supabase Data API:** ตารางอยู่ใน schema `public` ถ้าเปิด Data API ไว้ ตารางจะถูกเปิดผ่าน REST API ของ Supabase
- **Cookie ผ่าน proxy:** Vercel rewrite `/api/*` ไปที่ Render cookie จึงเป็นของ domain Vercel และเป็น first-party ตรวจบน production แล้วว่ามี `HttpOnly; Secure; SameSite=Lax`

### 3. โค้ดยังไม่ตรงกับสถาปัตยกรรมที่วางไว้

- **ปัญหา:** เมื่อตรวจสถาปัตยกรรมพบว่ากฎเกมเป็น pure function แล้ว แต่ service ของฟีเจอร์ยัง import Prisma และ HTTP DTO จึงยังไม่ตรงกับการแยก dependency ที่วางแผนไว้
- **วิธีแก้:** แยก use case เป็น TypeScript ธรรมดาและให้ Application เป็นเจ้าของ port ย้าย controller/DTO ไป Presentation และ persistence/crypto implementation ไป Infrastructure แล้วเชื่อมผ่าน NestJS module ส่วนการตรวจ session คืน player snapshot ของชั้นภายในแทน Prisma type
- **ความเสี่ยงและ trade-off:** การแยก write คนละ repository อาจทำให้ transaction ไม่ครอบทั้งขั้นตอน จึงใช้ progress unit-of-work port ร่วมกัน ให้เล่น รับรางวัล และ reset ใช้ transaction เดียวพร้อมล็อกผู้เล่น interface มีเฉพาะ operations ที่สาม workflow ต้องใช้ ไม่สร้าง generic repository framework
- **การตรวจสอบ:** คง HTTP E2E เดิมเรื่อง concurrency, เพดานคะแนน, idempotency, error รางวัล และ reset เพิ่ม use-case tests ที่ไม่ใช้ฐานข้อมูล, dependency-boundary tests และ PostgreSQL tests ที่บังคับ write ให้ล้มเหลวเพื่อพิสูจน์ rollback ของรอบเกมและประวัติที่ถูกล้าง พร้อมทดสอบ reset แข่งกับเล่น/รับรางวัล และ response เมื่อ health probe ล้มเหลว ไม่ต้องเปลี่ยน schema หรือ Frontend

## การตัดสินใจที่ควรรู้

- **เซิร์ฟเวอร์เป็นผู้ตัดสินคะแนน:** หน้าเว็บขอผลจาก API ก่อน แล้วค่อยเล่น animation ไปหาผลนั้น เบราว์เซอร์จึงเลือกผลเองไม่ได้
- **ลำดับ error ตอนรับรางวัลคงที่:** 404 ถ้าไม่มี checkpoint → ตรวจ version → `CHECKPOINT_LOCKED` → `REWARD_ALREADY_CLAIMED` สถานะเดียวกันจะได้คำตอบเดียวกันเสมอ
- **รีเซ็ตแล้วยังใช้ session เดิม** และเพิ่ม `progressVersion` แท็บอื่นที่เปิดอยู่จะรู้และโหลดใหม่ แทนที่จะเขียนทับความคืบหน้าเก่า
- **ตอนใกล้เต็ม หน้าต่างผลลัพธ์แสดงทั้งสองตัวเลข** คือคะแนนที่สุ่มได้และคะแนนที่ได้จริง ผู้เล่นจะไม่งงว่าทำไมสุ่มได้ 3,000 แต่คะแนนขึ้นแค่ 200
- **จังหวะ animation:** ระหว่างรอผลจาก API ไฟวิ่งช่องละ 0.07 วินาที (อย่างน้อย 0.9 วินาที) จากนั้นช้าลง 8 จังหวะ (0.1 ถึง 0.95 วินาที) ค้างที่ช่องที่ได้ 0.35 วินาที และรอ 0.4 วินาทีก่อนแสดงผล ถ้าผู้ใช้ตั้ง `prefers-reduced-motion` จะไม่มี animation
