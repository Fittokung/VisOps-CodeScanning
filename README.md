# VisScan - DevSecOps Scanning Platform

## 📖 Overview (ภาพรวมของแพลตฟอร์ม)

**VisScan** เป็นแพลตฟอร์มสำหรับการสแกนความปลอดภัยของโค้ด (DevSecOps Scanning) ที่ช่วยสนับสนุนกระบวนการพัฒนาซอฟต์แวร์ ตัวระบบทำหน้าที่เป็นศูนย์รวมในการสแกนโค้ด (SAST) และจัดการ Container Image (Container Scanning) โดยช่วยให้ฝั่ง Developer และ Admin สามารถทำงานร่วมกับระบบ Security Workflow ได้ราบรื่นและสะดวกขึ้น

## 🎯 Objectives (วัตถุประสงค์หลัก)

- **Shift-Left Security:** เพิ่มการตรวจสอบ (Security Layer) ลงในขั้นตอนการพัฒนา เพื่อช่วยให้ตรวจเจอช่องโหว่และแก้ไขได้ง่ายตั้งแต่เนิ่นๆ
- **Comprehensive Scanning:** ช่วยสแกนความปลอดภัยของโค้ดโปรเจกต์ ทั้งในระดับ Source Code (SAST, Secrets) และระดับ Docker Image ก่อนที่จะนำไป Deploy
- **Pipeline Automation:** ช่วยรันสแกนอัตโนมัติและรวบรวมผลลัพธ์จากเครื่องมือต่างๆ (เช่น Gitleaks, Semgrep, Trivy) มาสรุปไว้ในหน้าเดียว ช่วยลดขั้นตอนที่ต้องทำ Manual
- **Centralized Visibility:** มี Dashboard ส่วนกลางให้ Admin สามารถเข้ามาติดตาม (Tracking) และดูสถานะ (Monitoring) ของโปรเจ็กต์ต่างๆ ได้สะดวก

## 🛠 Tech Stack
- **Frontend:** Next.js 16 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, Lucide React Icons
- **Authentication:** NextAuth.js v4 with Credentials / Google OAuth
- **Database:** PostgreSQL 15
- **ORM:** Prisma 6
- **Message Queue:** RabbitMQ 3
- **API:** RESTful APIs with Next.js API Routes / tRPC
- **Real-time Updates:** SWR for data fetching
- **Security:** bcryptjs for encryption, JWT for sessions

---

## Setup & Installation (การตั้งค่าแบบ Local)

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
เริ่มต้น PostgreSQL และ RabbitMQ ด้วย Docker Compose:
```bash
docker compose -f docker-compose.db.yml up -d
```

### 3. Environment Configuration
สร้างไฟล์ `.env` ที่ตำแหน่ง Root และตั้งค่าตามตัวอย่าง `.env.example`:
- `DATABASE_URL`
- `NEXTAUTH_SECRET` (สร้างด้วย: `openssl rand -base64 32`)

### 4. Database Schema Setup
```bash
# สร้าง Prisma Client
npx prisma generate

# Push schema ไปยัง database
npx prisma db push
```

### 5. Start Development Servers

**Terminal 1 - Web Application:**
```bash
npm run dev
```

**Terminal 2 - Background Worker:**
```bash
npm run worker:dev
```

---

## Production Deployment ( Docker Compose)

ใช้คำสั่งเพื่อทำการบิวด์และรันระบบทั้งหมด:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

> **Superadmin Setup**: 
```bash
docker compose -f docker-compose.prod.yml logs worker
```


---

## 🧩 Features (ฟังก์ชันการทำงานหลัก)

### 👤 User Features
- **Security Scan Workflow:** รองรับการทำ Static Analysis (SAST) และ Container Scanning แบบครบวงจรผ่าน Pipeline
- **Interactive Security Dashboard & Report:** แสดงรายละเอียดผลการสแกน โดยแสดง Findings จาก Scanning Tools (Gitleaks, Semgrep, และ Trivy) พร้อมแบ่ง Findings ตามความรุนแรง 
- **Scan Comparison:** ระบบเปรียบเทียบผลลัพธ์ระหว่างการสแกนแต่ละครั้ง เพื่อติดตามและวัดผลการแก้ไขช่องโหว่ในอดีต

### 🛡️ Admin Features
- **Centralized User & Quota Management:** ควบคุมดูแลผู้ใช้งาน อนุมัติสิทธิ์เข้าถึง (User Approval Flow) และการกำหนดโควต้าจำกัดการใช้งาน
- **Real-time Global Scan Monitoring:** ตรวจสอบและติดตามสถานะการสแกนจากทุกโปรเจ็กต์และผู้ใช้ทั้งหมดในระบบได้แบบเรียลไทม์
- **Docker Template Management:** จัดการและสร้าง Template ของสภาพแวดล้อม Docker เพื่อกำหนดรูปแบบมาตรฐานในการรันโค้ดและสแกนของทั้งแพลตฟอร์ม

### 🔐 Identity & Access Management (IAM)
- ระบบ Authentication ความปลอดภัยสูงด้วย NextAuth.js
- Role-Based Access Control การแบ่งแยกสิทธิ์การใช้งานของผู้ใช้ทั่วไป (User) และผู้ดูแลระบบ (Admin) อย่างชัดเจนเต็มรูปแบบ

## 📁 Project Structure

```text
├── src/                  # Next.js Source Code (Frontend & Backend APIs)
│   ├── app/              # App Router Pages
│   ├── components/       # Reusable UI Components
│   └── lib/              # Utility functions & Configurations
├── worker/               # Background Jobs (RabbitMQ Consumers)
├── prisma/               # Database Schema & Migrations
├── public/               # Static assets & Images
└── docker-compose.*.yml  # Deployment configurations
```

## 📸 Screenshots

ภาพรวมการทำงานและระบบต่างๆ ภายใน VisScan:

### 📊 Dashboard
![Dashboard](./public/landing/dashboard.png)

### 🔍 Scan Pipeline & Process
![Scan Pipeline](./public/landing/scan-pipeline.png)

### 🛡️ Vulnerability Results & Details
![Scan Results](./public/landing/scan-result.png)

### 📈 Compare Scan Results
![Compare Scan](./public/landing/compare-scan.png)

### 📜 Scan History
![Scan History](./public/landing/scan-history.png)

## 👨‍💻 Developer:
- Ronnachai Sitthichoksathit (Backend)
- Kittiwat Yasarawan (Frontend)