# VisScan - DevSecOps Scanning Platform (Current Version)

## Overview

VisScan เป็นแพลตฟอร์มสำหรับจัดการการสแกนความปลอดภัยของ Code (Code Scanning) ที่เน้นการจัดการ Workflow ระหว่าง Developer และ Admin ในการ implement ต่อกับ Project VisOps

## Objective

- เพิ่ม security layer ให้ VisOps
- ตรวจสอบ code & image ก่อน deploy
- สามารถ Tracking & Monitoring by Admin

## Tech Stack

- **Framework:** Next.js (App Router)
- **Authentication:** NextAuth.js (Google OAuth)
- **Database:** PostgreSQL with Prisma ORM
- **UI Components:** Tailwind CSS, Lucide React

## Setup & Installation

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Environment Setup: สร้างไฟล์ .env และตั้งค่าดังนี้:**

   ```
   DATABASE_URL: PostgreSQL connection string
   GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET: จาก Google Cloud Console
   NEXTAUTH_SECRET: string สำหรับเข้ารหัส Session
   ```

3. **Prisma Sync**
   ```bash
   npx prisma db pull  # ดึงโครงสร้างจาก DB จริง
   npx prisma generate # สร้าง Prisma Client
   ```
4. **Start Development Server**
   ```bash
   npm run dev
   ```
5. **Open Platform**
   ```bash
   http://localhost:3000
   ```

## Progress Status (Current Features)

1. **Identity & Access Management (IAM):**
   - ระบบ Google Login ผ่าน OAuth
   - **User Approval Flow:** ผู้สมัครใหม่จะติดสถานะ `PENDING` ต้องได้รับการอนุมัติจาก Admin ก่อน
   - **Role-Based Access Control (RBAC):** แยกสิทธิ์ชัดเจนระหว่าง Admin และ User
2. **Admin Management System:**
   - หน้าจัดการผู้ใช้ (User Management)
   - Admin สามารถ Approve หรือ Reject ผู้ใช้ได้แบบ Real-time
   - ระบบป้องกันความปลอดภัย (Self-lockout Protection) ป้องกัน Admin แก้ไขสิทธิ์ตนเอง
3. **Security & Middleware:**
   - Middleware ตรวจสอบสถานะการอนุมัติ หากยังไม่ผ่านจะถูก Redirect ไปหน้าพักรอโดยอัตโนมัติ
4. **Scan Workflow (UI/UX):**
   - หน้า Dashboard และ History ที่รองรับการแสดงผลจากฐานข้อมูลจริง
   - UX Flow สำหรับการ Confirm build และ Push ขึ้น Docker Hub
