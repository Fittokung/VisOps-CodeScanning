# คู่มือการติดตั้งและพัฒนาโปรเจกต์ VisOps Code Scanning (ภาษาไทย)

เอกสารนี้จะอธิบายขั้นตอนการติดตั้ง (Installation), การรันโปรเจกต์ (Running), และแนวทางการพัฒนา (Development Guide) สำหรับระบบ VisOps Code Scanning

---

## 🚀 1. สิ่งที่ต้องเตรียม (Prerequisites)

ก่อนเริ่มใช้งาน ต้องติดตั้งเครื่องมือเหล่านี้ในเครื่องของคุณ:

1.  **Node.js** (แนะนำเวอร์ชัน 18 หรือ 20 LTS)
2.  **Docker & Docker Compose** (สำหรับรัน Database และ RabbitMQ)
3.  **Git**
4.  **GitLab Account** (หรือ Self-hosted GitLab) สำหรับใช้เป็น CI/CD pipeline
5.  **PostgreSQL** (ถ้าไม่ได้ใช้ Docker)
6.  **RabbitMQ** (ถ้าไม่ได้ใช้ Docker)

---

## 📦 2. การติดตั้ง (Installation)

1.  **Clone โปรเจกต์**
    ```bash
    git clone <your-repo-url>
    cd my-scan
    ```

2.  **ติดตั้ง Dependencies**
    ```bash
    npm install
    ```

---

## ⚙️ 3. การตั้งค่า Environment Variables

สร้างไฟล์ `.env` ที่ root folder ของโปรเจกต์ และกำหนดค่าดังนี้:

```env
# --- Database Connect (Prisma) ---
# ตัวอย่าง: postgresql://user:password@localhost:5432/dbname
DATABASE_URL="postgresql://postgres:password@localhost:5432/visscan"

# --- Authentication (NextAuth) ---
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key"

# --- GitLab Integration ---
# URL ของ GitLab (ถ้าใช้ gitlab.com ให้ใส่ https://gitlab.com/api/v4)
GITLAB_API_URL="http://YOUR_GITLAB_IP/api/v4"
# Personal Access Token ของ Admin หรือ User ที่มีสิทธิ์สร้าง Pipeline
GITLAB_TOKEN="glpat-xxxxxxxxxxxxxxxxxxxx"
# ID ของโปรเจกต์ Scanner Engine ใน GitLab (ตัวที่เก็บ .gitlab-ci.yml หลัก)
GITLAB_PROJECT_ID="141"
# Token สำหรับ Trigger Pipeline (ตั้งใน CI/CD Settings ของ GitLab)
GITLAB_TRIGGER_TOKEN="xxxxxxxxxxxxxxxx"

# --- RabbitMQ (Queue System) ---
RABBITMQ_URL="amqp://localhost:5672"

# --- Other Settings ---
# URL ของ Backend ที่ GitLab CI จะยิง Webhook กลับมา
BACKEND_HOST_URL="http://YOUR_LOCAL_IP:3000"
```

---

## 🗄️ 4. การตั้งค่า Database

1.  **Start Database & RabbitMQ (ด้วย Docker)**
    ถ้าคุณมีไฟล์ `docker-compose.db.yml`:
    ```bash
    docker-compose -f docker-compose.db.yml up -d
    ```

2.  **Migrate Database Schema**
    คำสั่งนี้จะสร้างตารางใน Database ตามไฟล์ `prisma/schema.prisma`
    ```bash
    npx prisma migrate dev --name init
    ```

3.  **Generate Prisma Client**
    ```bash
    npx prisma generate
    ```

---

## ▶️ 5. การรันโปรเจกต์ (Running)

ระบบนี้ประกอบด้วย 2 ส่วนหลักที่ต้องรันพร้อมกัน คือ **Web Server** และ **Background Worker**

### Terminal 1: รันหน้าเว็บ (Next.js)
```bash
npm run dev
```
*เข้าใช้งานได้ที่: http://localhost:3000*

### Terminal 2: รัน Worker (Background Process)
Worker ทำหน้าที่รับงานจาก Queue, สร้าง Pipeline ใน GitLab, และคอยตรวจสอบสถานะ
```bash
npm run worker
# หรือ
npx tsx worker/index.ts
```

### (Optional) Terminal 3: ดูข้อมูลใน Database (Prisma Studio)
```bash
npx prisma studio
```
*เข้าใช้งานได้ที่: http://localhost:5555*

---

## 🛠️ 6. โครงสร้างโปรเจกต์ (Project Structure)

```
my-scan/
├── app/                  # Next.js App Router (หน้าเว็บและ API)
│   ├── api/              # Backend API Routes (เช่น /api/scan, /api/webhook)
│   ├── dashboard/        # หน้า Dashboard หลัก
│   └── scan/[id]/        # หน้าแสดงผลลัพธ์การสแกน
├── components/           # React Components (ปุ่ม, กราฟ, ตาราง)
├── lib/                  # Utility Functions, Database Config
│   ├── queue/            # RabbitMQ Connection logic
│   └── prisma.ts         # Prisma Client Instance
├── prisma/               # Database Schema (schema.prisma)
├── worker/               # Background Worker Logic
│   └── index.ts          # ไฟล์หลักของ Worker
└── public/               # Static Files (รูปภาพ, icons)
```

---

## 💻 7. แนวทางการพัฒนา (Development Guide)

### การเพิ่มฟีเจอร์ใหม่ (Web)
1.  สร้าง Folder ใหม่ใน `app/` เช่น `app/my-feature/page.tsx`
2.  เขียน React Component ตามปกติ
3.  เรียกใช้ Database ผ่าน `import { prisma } from "@/lib/prisma"` (ใช้ใน Server Component หรือ API)

### การแก้ไข API
*   ไฟล์ API อยู่ใน `app/api/`
*   ตัวอย่าง: `app/api/scan/route.ts` (GET, POST)
*   การเพิ่ม Route ใหม่: สร้างโฟลเดอร์ `app/api/hello/route.ts`

### การแก้ไข Worker (Logic การสแกน)
*   ถ้าต้องการเปลี่ยน Flow การยิง GitLab หรือ Logic การ Polling
*   แก้ไขที่ `worker/index.ts`
*   **สำคัญ:** ทุกครั้งที่แก้ Worker ต้อง Stop และ Start `npm run worker` ใหม่

### การแก้ไข Database Schema
1.  แก้ไฟล์ `prisma/schema.prisma`
2.  รัน `npx prisma migrate dev` เพื่ออัปเดต Database จริง
3.  รัน `npx prisma generate` เพื่ออัปเดต Type ในโค้ด

---

## ⚠️ ปัญหาที่พบบ่อย (Troubleshooting)

*   **Worker ไม่ทำงาน:** ตรวจสอบว่า `RABBITMQ_URL` ถูกต้องและ RabbitMQ รันอยู่
*   **GitLab Pipeline ไม่ขึ้น:** ตรวจสอบ `GITLAB_TOKEN` และ `GITLAB_PROJECT_ID`
*   **กด Push to Hub ไม่ได้:** ตรวจสอบว่าสถานะ Scan เป็น `SUCCESS` หรือ `MANUAL` และไฟล์ `.gitlab-ci.yml` ใน Scanner Engine มี Job `push_to_hub` หรือไม่

---
*Created by Antigravity*
