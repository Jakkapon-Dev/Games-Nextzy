# Nextzy Points Game

[English](README.md) · **ภาษาไทย**

เกมสะสมคะแนนขนาดเล็ก ทำเป็นแบบทดสอบ full-stack ผู้เล่นกดสุ่มคะแนน สะสมได้สูงสุด 10,000 คะแนน และกดรับรางวัลได้เมื่อถึง 5,000, 7,500 และ 10,000 คะแนน

- **เว็บไซต์:** https://games-nextzy.vercel.app
- **API:** https://nextzy-api.onrender.com (health check: [`/api/health`](https://nextzy-api.onrender.com/api/health))
- **บันทึกการพัฒนา:** [docs/DEVELOPMENT_LOG.th.md](docs/DEVELOPMENT_LOG.th.md)

> API ใช้แพ็กเกจฟรีของ Render ถ้าไม่มีคนใช้ 15 นาทีเซิร์ฟเวอร์จะหลับ คำขอแรกหลังจากนั้นอาจต้องรอประมาณ 1 นาที

## ภาพหน้าจอ

|                                           หน้าแรก                                            |                                              รับรางวัล                                              |                                      ประวัติรางวัล                                       |
| :------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------: |
| <img src="docs/screenshots/home.jpg" width="250" alt="หน้าแรก 5,000 คะแนน พร้อมรับรางวัล A"> | <img src="docs/screenshots/home-claim-modal.jpg" width="250" alt="หน้าต่างยืนยันว่าได้รับรางวัล A"> | <img src="docs/screenshots/home-reward-history.jpg" width="250" alt="แท็บประวัติรางวัล"> |

|                                     หน้าเกม                                     |                                        กำลังสุ่ม                                         |                                            ผลลัพธ์                                            |
| :-----------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------: |
| <img src="docs/screenshots/game-start.jpg" width="250" alt="หน้าเกมก่อนกดสุ่ม"> | <img src="docs/screenshots/game-playing.jpg" width="250" alt="ตัวเลือกถูกคัดออกทีละตัว"> | <img src="docs/screenshots/game-result.jpg" width="250" alt="หน้าต่างผลลัพธ์ได้ 1,000 คะแนน"> |

ทุกภาพถ่ายที่ความกว้าง 375px จากเว็บที่ deploy จริง

## ความสามารถ

- **หน้าแรก:** คะแนนสะสม, แถบความคืบหน้าพร้อม checkpoint 3 จุด, ปุ่มรับรางวัล, ปุ่มรีเซ็ต และแท็บประวัติการเล่นกับประวัติรางวัล (โหลดเพิ่มทีละหน้า)
- **หน้าเกม:** สุ่มได้ 300, 500, 1,000 หรือ 3,000 คะแนน ตัวเลือกอื่นจะถูกคัดออกทีละตัว แล้วขึ้นหน้าต่างแสดงผล เล่นต่อได้โดยไม่ต้องออกจากหน้า
- **ผู้เล่นแบบไม่ต้องสมัคร:** เบราว์เซอร์เก็บ session cookie แบบ HttpOnly ไว้ 180 วัน
- **Responsive:** ออกแบบสำหรับมือถือ 300–500px และใช้บนแท็บเล็ตได้
- **Accessibility:** ใช้ `<dialog>` ของเบราว์เซอร์, ใช้คีย์บอร์ดได้, มีข้อความแจ้ง screen reader และรองรับการลด animation (reduced motion)

## เทคโนโลยีที่ใช้

| ส่วน       | เครื่องมือ                                                                         |
| ---------- | ---------------------------------------------------------------------------------- |
| Web        | Next.js 16 (App Router), React 19, Tailwind CSS 4, TanStack Query 5                |
| API        | NestJS 12, Prisma 7 กับ driver adapter `pg`, class-validator                       |
| ฐานข้อมูล  | PostgreSQL (production ใช้ Supabase)                                               |
| การทดสอบ   | Vitest, Testing Library, Supertest กับฐานข้อมูล PostgreSQL จริง                    |
| เครื่องมือ | npm workspaces, TypeScript 6, ESLint (web), oxlint (API), Prettier, GitHub Actions |
| Hosting    | Vercel (web), Render (API), Supabase (ฐานข้อมูล) อยู่ที่สิงคโปร์ทั้งหมด            |

## สถาปัตยกรรม

```text
Browser ──► Next.js บน Vercel ──rewrite /api/*──► NestJS บน Render ──► PostgreSQL บน Supabase
            (หน้าเว็บ + proxy)                      (กฎของเกม, session)
```

- เบราว์เซอร์คุยกับแอป Next.js เท่านั้น Next.js ส่งต่อ `/api/*` ไปที่ API (`API_ORIGIN`) cookie ของ session จึงเป็น first-party และไม่ถูกบล็อกแบบ third-party cookie
- API เป็นผู้ตัดสินคะแนนทุกครั้ง หน้าเว็บแค่แสดง animation ตามผลที่ได้รับ จึงแก้ผลจากฝั่งเบราว์เซอร์ไม่ได้

```text
apps/
  api/                 NestJS API
    prisma/            schema และ SQL migration (มี CHECK constraint)
    src/
      session/         session cookie แบบไม่ต้องสมัคร และ guard
      player/          ความคืบหน้า (GET /api/me) และการรีเซ็ต
      game/            การเล่นและประวัติ; domain/ เก็บกฎของเกมแบบ pure function
      reward/          การรับรางวัลและประวัติรางวัล
      health/          health check
      common/          รูปแบบ error, validation, pagination
    test/              e2e test กับฐานข้อมูลสำหรับทดสอบ
  web/                 แอป Next.js
    src/app/           หน้าแรกและหน้า /game
    src/components/    คอมโพเนนต์ UI, หน้าแรก และหน้าเกม
    src/lib/           API client, TanStack Query hooks, การจัดรูปแบบ
docs/                  ภาพหน้าจอและบันทึกการพัฒนา
render.yaml            Render blueprint ของ API
```

### API

ทุก endpoint อยู่ใต้ `/api` error ใช้รูปแบบ `{ "code": "...", "message": "..." }` เสมอ โดย message เป็นภาษาไทยที่หน้าเว็บแสดงให้ผู้เล่นเห็นได้เลย

| Method | Path                     | คำอธิบาย                                                       |
| ------ | ------------------------ | -------------------------------------------------------------- |
| POST   | `/session`               | สร้างหรือใช้ session เดิม และตั้ง cookie                       |
| GET    | `/me`                    | คะแนนสะสม, progress version, ตัวเลือกคะแนน และสถานะ checkpoint |
| POST   | `/me/reset`              | ล้างคะแนน รอบการเล่น และรางวัล แล้วเริ่ม progress version ใหม่ |
| POST   | `/game-rounds`           | สุ่มคะแนน (idempotent ด้วย `requestId`)                        |
| GET    | `/game-rounds`           | ประวัติการเล่น (`page`, `limit`)                               |
| POST   | `/checkpoints/:id/claim` | รับรางวัลของ checkpoint                                        |
| GET    | `/reward-claims`         | ประวัติรางวัล (`page`, `limit`)                                |
| GET    | `/health`                | เช็กว่า API ต่อฐานข้อมูลได้                                    |

## กฎของเกม

- แต่ละรอบสุ่ม 300, 500, 1,000 หรือ 3,000 ด้วยโอกาสเท่ากัน ใช้ `crypto.randomInt` บนเซิร์ฟเวอร์
- คะแนนรวมไม่เกิน 10,000 ถ้าใกล้เต็มจะบวกให้เฉพาะส่วนที่เหลือ และหน้าต่างผลลัพธ์จะแสดงทั้งคะแนนที่สุ่มได้และคะแนนที่ได้จริง
- checkpoint 5,000, 7,500 และ 10,000 รับได้จุดละครั้ง ไม่ต้องเรียงลำดับ รับได้เมื่อคะแนนถึง และการรับรางวัลไม่หักคะแนน
- การรีเซ็ตจะตั้งคะแนนเป็น 0, ลบประวัติการเล่นและประวัติรางวัล และเพิ่ม `progressVersion` โดยยังใช้ session เดิม

### การตัดสินใจเพื่อความถูกต้องของข้อมูล

- **เล่นซ้ำไม่บวกซ้ำ (idempotent):** ทุกการเล่นส่ง `requestId` (UUID) ถ้าส่งคำขอเดิมซ้ำจะได้รอบเดิมกลับมา ไม่บวกคะแนนสองครั้ง
- **Progress version:** ทุกการเล่น การรับรางวัล และการรีเซ็ต จะส่ง `progressVersion` ที่หน้าเว็บแสดงอยู่ไปด้วย ถ้ามีอีกแท็บรีเซ็ตไปแล้ว API จะตอบ `409 PROGRESS_VERSION_MISMATCH` และหน้าเว็บจะโหลดข้อมูลล่าสุดใหม่
- **ล็อกแถวข้อมูล:** การเล่นและการรับรางวัลจะล็อกแถวของผู้เล่น (`SELECT … FOR UPDATE`) คำขอที่เข้ามาพร้อมกันจึงดันคะแนนเกิน 10,000 หรือรับรางวัลซ้ำไม่ได้
- **Constraint ในฐานข้อมูล:** CHECK constraint และ unique key ใน migration บังคับช่วงคะแนนและการรับรางวัลจุดละครั้ง แม้โค้ดฝั่งแอปจะมี bug ก็ตาม
- **ลำดับการตรวจ error ตอนรับรางวัลคงที่:** ไม่มี checkpoint นี้ (404) → version เก่า (409) → คะแนนยังไม่ถึง (`CHECKPOINT_LOCKED`, 409) → รับไปแล้ว (`REWARD_ALREADY_CLAIMED`, 409)
- **เวลาเก็บเป็น UTC:** การเชื่อมต่อฐานข้อมูลบังคับ `TimeZone=UTC` และหน้าเว็บแสดงเวลาตาม Asia/Bangkok

## รันบนเครื่อง

ต้องมี Node.js 24 และ PostgreSQL บนเครื่อง (CI ใช้ PostgreSQL 18)

```bash
npm ci
```

สร้างไฟล์ `apps/api/.env` โดยคัดลอกจาก `apps/api/.env.example` แล้วตั้ง `DATABASE_URL` ให้ชี้ฐานข้อมูลบนเครื่อง เช่น `nextzy_dev` ฝั่งเว็บใช้ค่าเริ่มต้นได้เลยโดยไม่ต้องมีไฟล์ `.env`

```bash
npm run prisma:migrate:deploy -w api
```

```bash
npm run dev
```

เปิด http://localhost:3000 ส่วน API รันที่ http://localhost:3001

## การทดสอบและการตรวจคุณภาพโค้ด

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run test:e2e -w api
```

```bash
npm run format:check
```

- **Unit test ของ API:** กฎของเกม, การแปลง error, session token และการตั้งค่า
- **E2e test ของ API:** ทุก endpoint กับฐานข้อมูล PostgreSQL จริงชื่อ `nextzy_test` บนเซิร์ฟเวอร์เดียวกับ `DATABASE_URL` (หรือใช้ `TEST_DATABASE_URL`) ระบบสร้างและ migrate ให้อัตโนมัติ และจะไม่ยอมรันถ้าชื่อฐานข้อมูลไม่ลงท้ายด้วย `_test`
- **Test ของเว็บ:** คอมโพเนนต์และ hooks ด้วย Testing Library รวมถึง flow การเล่นและสถานะ error

GitHub Actions รัน format, lint, typecheck, unit, e2e และ build ทุก pull request โดยใช้ PostgreSQL 18 ที่ตั้ง time zone เป็น Asia/Bangkok เพื่อให้ bug เรื่อง time zone โผล่ใน CI

## การ Deploy

| ส่วน      | ที่ไหน         | การตั้งค่า                                                                      |
| --------- | -------------- | ------------------------------------------------------------------------------- |
| Web       | Vercel         | Root directory `apps/web`, ตัวแปร `API_ORIGIN=https://nextzy-api.onrender.com`  |
| API       | Render (ฟรี)   | Blueprint ใน [`render.yaml`](render.yaml); กรอก `DATABASE_URL` ในหน้า dashboard |
| ฐานข้อมูล | Supabase (ฟรี) | Session pooler พอร์ต 5432; ปิด Data API                                         |

แพ็กเกจฟรีของ Render ไม่มีขั้น pre-deploy API จึงรัน `prisma migrate deploy` ตอน start เพื่อใช้ migration ที่ยังค้าง

### PageSpeed Insights (มือถือ)

| Performance | Accessibility | Best Practices | SEO |
| :---------: | :-----------: | :------------: | :-: |
|     97      |      96       |      100       | 100 |

ข้อที่ Accessibility ไม่ผ่านมีข้อเดียว คือสีตัวอักษรบางจุดตัดกับพื้นหลังไม่พอ สีเหล่านี้มาจากดีไซน์ และตั้งใจคงไว้ให้ตรงกับ Figma

## ข้อจำกัดที่รู้อยู่แล้ว

- API แพ็กเกจฟรีจะหลับเมื่อไม่มีคนใช้ คำขอแรกหลังจากนั้นจะช้า
- ผู้เล่นผูกกับเบราว์เซอร์เดียว ถ้าล้าง cookie จะเริ่มเป็นผู้เล่นใหม่
- ปุ่ม "แชร์คะแนน" ใช้ Web Share API ถ้าเบราว์เซอร์รองรับ ถ้าไม่รองรับจะคัดลอกข้อความคะแนนพร้อมลิงก์แทน
