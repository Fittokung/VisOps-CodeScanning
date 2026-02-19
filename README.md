# VisScan - DevSecOps Scanning Platform (Current Version)

## Overview

VisScan เป็นแพลตฟอร์มสำหรับจัดการการสแกนความปลอดภัยของ Code (Code Scanning) ที่เน้นการจัดการ Workflow ระหว่าง Developer และ Admin ในการ implement ต่อกับ Project VisOps

## Objective

- เพิ่ม security layer ให้ VisOps
- ตรวจสอบ code & image ก่อน deploy
- สามารถ Tracking & Monitoring by Admin


## Tech Stack Details

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, Lucide React Icons
- **Authentication:** NextAuth.js v4 with Google OAuth
- **Database:** PostgreSQL 15
- **ORM:** Prisma 6
- **Message Queue:** RabbitMQ 3
- **API:** RESTful APIs with Next.js API Routes
- **Real-time Updates:** SWR for data fetching
- **Security:** bcryptjs for encryption, JWT for sessions


## Setup & Installation

### 1. Clone Repository & Install Dependencies
```bash
cd my-scan
npm install
```

### 2. Database Setup
เริ่มต้น PostgreSQL และ RabbitMQ ด้วย Docker Compose:
```bash
docker-compose -f docker-compose.db.yml up -d
```

Services ที่จะถูกสร้าง:
- **PostgreSQL**: Port 5432 (Database)
- **RabbitMQ**: Port 5672 (Message Queue), Port 15672 (Management UI)

### 3. Environment Configuration
สร้างไฟล์ `.env` ในโฟลเดอร์ `my-scan` และตั้งค่าตามตัวอย่างนี้:

```env
# Base URL ของแอปพลิเคชัน
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Database Connection
DATABASE_URL="postgresql://VisScan:VisScan1234@localhost:5432/scandb?schema=public"

# Google OAuth (สร้างจาก Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# GitLab Integration (Optional - สำหรับ CI/CD)
GITLAB_PROJECT_ID=your-project-id
GITLAB_TOKEN=your-gitlab-token
GITLAB_API_URL=http://your-gitlab-url/api/v4
GITLAB_TRIGGER_TOKEN=your-trigger-token

# Security Keys
TEMPLATE_API_KEY="secret-key-for-internal-use"
ENCRYPTION_KEY=your-32-character-encryption-key

# RabbitMQ Connection
RABBITMQ_URL="amqp://localhost:5672"
```

**หมายเหตุ:**
- สร้าง `NEXTAUTH_SECRET` ด้วยคำสั่ง: `openssl rand -base64 32`
- `ENCRYPTION_KEY` ต้องมีความยาว 32 ตัวอักษรพอดี
- สำหรับ Google OAuth ให้ไปที่ [Google Cloud Console](https://console.cloud.google.com/) เพื่อสร้าง OAuth 2.0 credentials

### 4. Database Schema Setup
```bash
# สร้าง Prisma Client จาก schema
npx prisma generate

# Push schema ไปยัง database
npx prisma db push

# (Optional) เปิด Prisma Studio เพื่อดูข้อมูลในฐานข้อมูล
npx prisma studio
```

### 5. Create First Admin User
หลังจากตั้งค่าเสร็จแล้ว ให้สร้าง Admin user แรก:
```bash
node force-admin.js your-email@example.com
```

### 6. Start Development Servers

**Terminal 1 - Web Application:**
```bash
npm run dev
```

**Terminal 2 - Background Worker (สำหรับประมวลผล Scan Jobs):**
```bash
npm run worker:dev
```

### 7. Access the Application
- **Web Application**: http://localhost:3000
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **Prisma Studio**: http://localhost:5555 (ถ้ารัน `npx prisma studio`)

## Screenshots (UI Prototype)

| User Dashboard | Admin - All Scans |
|:-:|:-:|
| ![User Dashboard](screenshots/user_dashboard.JPG) | ![Admin All Scan](screenshots/admin_all_scan.JPG) |

| Admin - User Management | Admin - Templates |
|:-:|:-:|
| ![Admin User Management](screenshots/admin_user_management.JPG) | ![Admin Templates](screenshots/admin_templates.JPG) |

## Progress Status (Current Features)

### 1. Identity & Access Management (IAM)
- ✅ ระบบ Google Login ผ่าน OAuth 2.0
- ✅ **User Approval Flow:** ผู้สมัครใหม่จะติดสถานะ `PENDING` ต้องได้รับการอนุมัติจาก Admin ก่อน
- ✅ **Role-Based Access Control (RBAC):** แยกสิทธิ์ชัดเจนระหว่าง Admin และ User
- ✅ **Session Management:** JWT-based sessions พร้อม auto-extension เมื่อมี active scans
- ✅ **Setup Wizard:** กระบวนการตั้งค่าเริ่มต้นสำหรับผู้ใช้ใหม่

### 2. Admin Management System
- ✅ หน้าจัดการผู้ใช้ (User Management)
- ✅ Admin สามารถ Approve หรือ Reject ผู้ใช้ได้แบบ Real-time
- ✅ ระบบป้องกันความปลอดภัย (Self-lockout Protection) ป้องกัน Admin แก้ไขสิทธิ์ตนเอง
- ✅ Per-User Quota Management: Admin สามารถกำหนด quota (จำนวน services สูงสุด) ของ user แต่ละคนได้
- ✅ จัดการ Support Tickets จากผู้ใช้

### 3. Security & Middleware
- ✅ Middleware ตรวจสอบสถานะการอนุมัติ หากยังไม่ผ่านจะถูก Redirect ไปหน้าพักรอโดยอัตโนมัติ
- ✅ Protected routes สำหรับหน้าที่ต้อง authentication
- ✅ Encryption สำหรับ sensitive credentials (Git & Docker tokens)

### 4. Credential Management
- ✅ จัดเก็บ Git credentials (GitHub, GitLab) แบบ encrypted
- ✅ จัดเก็บ Docker Hub credentials แบบ encrypted
- ✅ รองรับ Docker Organization accounts
- ✅ ตั้งค่า default credentials สำหรับใช้งานทั่วไป
- ✅ Multiple credentials per provider

### 5. Project & Service Management
- ✅ **Project Groups:** จัดกลุ่ม services ตาม repository
- ✅ รองรับ private repositories พร้อม Git authentication
- ✅ **Custom Dockerfile:** รองรับการ override Dockerfile
- ✅ **Quota Management:** จำกัดจำนวน services ต่อผู้ใช้ (default: 6, admin แก้ไขได้) พร้อม UI แจ้งเตือนเมื่อ quota เต็ม
- ✅ Soft delete สำหรับ projects

### 6. Scanning Workflow
- ✅ **Scan Modes:** Scan & Build หรือ Scan Only
- ✅ **Security Scanning:** Gitleaks (secrets), Semgrep (SAST), Trivy (vulnerabilities)
- ✅ **Container Scanning:** ตรวจสอบ Docker images
- ✅ **Concurrent Scans:** รองรับการ scan หลาย services พร้อมกัน
- ✅ **Duplicate Prevention:** ป้องกันการ scan service เดียวกันซ้ำ
- ✅ **GitLab CI/CD Integration:** ใช้ GitLab pipelines สำหรับ scanning
- ✅ **Webhook Updates:** รับ status updates แบบ real-time

### 7. Background Worker (RabbitMQ)
- ✅ Message queue สำหรับจัดการ scan jobs
- ✅ Asynchronous processing
- ✅ Worker process แยกจาก web application
- ✅ Auto-retry mechanism

### 8. Dashboard & Monitoring
- ✅ แสดงโปรเจคทั้งหมดพร้อม services
- ✅ แสดง latest scan results พร้อม vulnerability counts
- ✅ **Active Scan Monitor:** Real-time polling ทุก 5 วินาที
- ✅ **Vulnerability Indicators:** Critical, High, Medium, Low
- ✅ Quick actions: Scan, Delete, View History

### 9. Scan History & Comparison
- ✅ บันทึก scan history ทั้งหมด
- ✅ Filter by service
- ✅ **Compare Scans:** เปรียบเทียบผลลัพธ์ระหว่าง 2 scans
- ✅ แสดง New/Resolved/Persistent findings
- ✅ Build logs และ error messages
- ✅ Acknowledge critical vulnerabilities

### 10. UI/UX Features
- ✅ Modern Landing Page พร้อม tutorial slider
- ✅ Responsive Navigation Bar
- ✅ Real-time status updates
- ✅ Loading states และ error handling
- ✅ Confirmation dialogs สำหรับ critical actions

### 11. Support System
- ✅ ผู้ใช้สามารถส่ง Support Tickets ได้
- ✅ Admin ตอบและจัดการ tickets
- ✅ Priority levels (Normal, High, Urgent)
- ✅ Status tracking (Open, In Progress, Resolved)

## Production Team
- Ronnachai Sitthichoksathit (Backend & CI/CD Pipeline )
- Kittiwat Yasarawn (Frontend)