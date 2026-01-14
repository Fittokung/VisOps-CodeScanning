# ✅ VisOps Platform - Updated Flow Documentation

## 📊 สรุปการแก้ไข Flow

### ปัญหาเดิม
1. ❌ เข้ามาแล้ว redirect ไป /setup ทันที โดยไม่ได้ login Google ก่อน
2. ❌ ไม่มี session timeout
3. ❌ ไม่มี dashboard สำหรับดูโปรเจคและ scan history
4. ❌ ไม่สามารถ scan หลายโปรเจคพร้อมกันได้

### การแก้ไข
1. ✅ แก้ flow ให้ login Google ก่อนเสมอ
2. ✅ เพิ่ม session timeout 15 นาที (แต่ extend เมื่อมี active scans)
3. ✅ สร้าง dashboard แสดงโปรเจคทั้งหมด พร้อมจัดการ
4. ✅ รองรับ concurrent scans หลายโปรเจคพร้อมกัน
5. ✅ เพิ่มหน้า history และ comparison

---

## 🔄 Authentication Flow (ใหม่)

```
┌─────────────────────────────────────────────────────────┐
│ 1. User เข้า "/" (Home Page)                           │
│    - ยังไม่ login → แสดงหน้า landing page              │
│    - มีปุ่ม "Login with Google"                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Click "Login with Google"                           │
│    → Redirect ไป /login                                │
│    → NextAuth OAuth flow                               │
│    → Google authentication                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Login สำเร็จ                                        │
│    - Check: isSetupComplete?                           │
│      - ❌ No  → Redirect to /setup                     │
│      - ✅ Yes → Redirect to /dashboard                 │
└─────────────────────────────────────────────────────────┘
```

### Middleware Logic
```typescript
// middleware.ts
if (!token) {
  // ยังไม่ login
  if (isHomePage || isLoginPage) {
    return next(); // อนุญาตเข้าได้
  }
  return redirect("/login"); // ส่งไป login
}

if (token) {
  // Login แล้ว
  if (!isSetupComplete) {
    // Setup ยังไม่เสร็จ → บังคับไป /setup
    return redirect("/setup");
  }
  
  if (isHomePage || isLoginPage) {
    // Login + Setup เสร็จ → ส่งไป dashboard
    return redirect("/dashboard");
  }
}
```

---

## ⏱️ Session Management

### Session Timeout
```typescript
// lib/auth.ts
session: {
  strategy: "jwt",
  maxAge: 15 * 60,      // 15 minutes
  updateAge: 5 * 60,    // Update every 5 minutes
}
```

### Extend Session สำหรับ Active Scans
```typescript
// Frontend polling (dashboard/page.tsx)
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch("/api/scan/status/active");
    const data = await response.json();
    
    if (data.hasActiveScans) {
      // มี active scans → extend session โดยการเรียก API
      await fetch("/api/auth/session"); // Update session
    }
  }, 5000); // ทุก 5 วินาที
  
  return () => clearInterval(interval);
}, []);
```

**หมายเหตุ**: ถ้ามี scan กำลังทำงานอยู่ ระบบจะไม่ให้ session หมดอายุ

---

## 📊 Dashboard Features

### 1. แสดงโปรเจคทั้งหมด
```tsx
// app/dashboard/page.tsx
- แสดง ProjectGroup และ Services ภายใน
- แสดง Latest Scan status
- แสดง vulnerability counts
- แสดง quota usage (X/6 projects)
```

### 2. Actions ที่ทำได้
```
✅ Scan & Build ใหม่     → เริ่ม scan full workflow
✅ Scan Only             → scan เฉพาะ security ไม่ build image
✅ View History          → ดู scan history ของ service
✅ Compare Scans         → เปรียบเทียบ 2 scans
✅ Delete Project        → ลบโปรเจค (soft delete)
```

### 3. Active Scans Indicator
```tsx
// แสดงที่ด้านบนของ dashboard
🔄 กำลัง Scan อยู่ (2)
  • backend-api • RUNNING
  • frontend-app • QUEUED
```

---

## 🔍 Scan Workflow (Updated)

### สามารถ Scan หลายโปรเจคพร้อมกันได้

```
User A:
  Project 1 → Service A → Scan 1 [RUNNING] ✅
  Project 1 → Service B → Scan 2 [RUNNING] ✅
  Project 2 → Service C → Scan 3 [QUEUED] ✅

ข้อจำกัด:
  - 1 Service สามารถมี scan ทีละ 1 อันที่ active (QUEUED/RUNNING)
  - ถ้า service มี active scan อยู่แล้ว → ไม่สามารถ scan ใหม่จนกว่าจะเสร็จ
```

### Check Concurrent Scan
```typescript
// app/api/scan/start/route.ts
const activeScan = await prisma.scanHistory.findFirst({
  where: {
    serviceId: serviceId,
    status: { in: ['QUEUED', 'RUNNING'] }
  }
});

if (activeScan) {
  return error("A scan is already in progress for this service");
}
```

---

## 📈 History & Comparison

### Scan History Page
```
/scan/history?serviceId=xxx

Features:
  ✅ แสดง scan history ทั้งหมดของ service
  ✅ เลือก 2 scans เพื่อเปรียบเทียบ
  ✅ Filter by status
  ✅ แสดง vulnerability counts
```

### Comparison Page
```
/scan/compare?scan1=xxx&scan2=yyy

แสดง:
  🔴 ช่องโหว่ใหม่ที่พบ (New Findings)
  ✅ ช่องโหว่ที่แก้ไขแล้ว (Resolved Findings)
  ⚠️ ช่องโหว่ที่ยังคงมีอยู่ (Persistent Findings)
```

---

## 🗂️ Project Structure

### Database Hierarchy
```
User (1)
  └─ ProjectGroup (N) [ตาม repo URL]
       └─ ProjectService (N) [ตาม context path: backend, frontend, etc.]
            └─ ScanHistory (N) [ประวัติการ scan]
```

### ตัวอย่าง:
```
User: john@example.com
  
ProjectGroup: "my-monorepo"
  repoUrl: "https://github.com/john/my-monorepo"
  
  Services:
    1. "backend-api"
       imageName: "my-app-backend"
       contextPath: "./backend"
       Scans: [scan1, scan2, scan3...]
    
    2. "frontend-web"
       imageName: "my-app-frontend"
       contextPath: "./frontend"
       Scans: [scan4, scan5, scan6...]
```

---

## 🔐 Quota & Limits

### Quota Rules
```
✅ Max 6 active projects per user
✅ Unlimited scans per project
✅ 1 active scan per service at a time
✅ Multiple services can scan concurrently
```

### Delete Project
```typescript
// Soft delete (isActive = false)
await prisma.projectGroup.update({
  where: { id: projectId },
  data: { isActive: false }
});

// ข้อจำกัด: ไม่สามารถลบ project ที่มี active scans
if (hasActiveScans) {
  return error("Cannot delete project with active scans");
}
```

---

## 📁 New Files Created

### Pages
```
✅ app/dashboard/page.tsx           - Dashboard หลัก
✅ app/scan/history/page.tsx        - Scan history
✅ app/scan/compare/page.tsx        - Scan comparison
```

### API Routes
```
✅ app/api/dashboard/route.ts       - Dashboard data
✅ app/api/projects/[id]/route.ts   - Delete/Get project
✅ app/api/scan/history/route.ts    - Get scan history
✅ app/api/scan/compare/route.ts    - Compare scans
✅ app/api/scan/status/active/...   - Active scans (updated)
```

### Updated Files
```
✅ middleware.ts                     - Fixed auth flow
✅ lib/auth.ts                       - Added session timeout
✅ app/api/scan/start/route.ts      - Concurrent scan check
```

---

## 🚀 Usage Examples

### 1. New User Onboarding
```
1. เข้า "/" → เห็น landing page
2. Click "Login with Google"
3. Google OAuth → Success
4. Redirect to /setup
5. กรอก GitHub PAT + Docker Token
6. Click "Complete Setup"
7. Redirect to /dashboard
```

### 2. Existing User Login
```
1. เข้า "/" → Auto redirect to /login
2. Google OAuth → Success
3. Check isSetupComplete = true
4. Redirect to /dashboard
```

### 3. Scan Multiple Services
```
1. ใน Dashboard → Click "Scan & Build" on Service A
2. Scan A เริ่ม [RUNNING]
3. Click "Scan & Build" on Service B (same project)
4. Scan B เริ่ม [RUNNING] ✅ (ได้เพราะคนละ service)
5. Click "Scan & Build" on Service A อีกครั้ง
6. Error: "A scan is already in progress" ❌
```

### 4. View & Compare
```
1. Dashboard → Click "History" on Service
2. เลือก 2 scans → Click "เปรียบเทียบ"
3. ดู new/resolved/persistent findings
4. วิเคราะห์ว่าแก้ไข security issues แล้วหรือยัง
```

---

## ⚙️ Configuration

### Environment Variables
```bash
# Session timeout (seconds)
# ใน lib/auth.ts
maxAge: 15 * 60          # 15 minutes
updateAge: 5 * 60        # Update every 5 minutes

# Extend session when active scans exist
# Auto-handled by polling mechanism
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Session หมดอายุระหว่าง scan
**Solution**: ระบบจะ auto-extend session เมื่อมี active scans

### Issue 2: ไม่สามารถ scan service ได้
**Check**: มี active scan อยู่หรือไม่
```typescript
// Check in database
SELECT * FROM "ScanHistory" 
WHERE "serviceId" = 'xxx' 
AND status IN ('QUEUED', 'RUNNING');
```

### Issue 3: โปรเจคเต็ม (6/6)
**Solution**: 
1. ลบโปรเจคที่ไม่ใช้แล้ว (soft delete)
2. หรือขอ admin เพิ่ม quota

---

## 📊 API Endpoints Summary

### Authentication
```
GET  /login                    - Login page
POST /api/auth/[...nextauth]  - NextAuth endpoints
```

### Dashboard
```
GET /dashboard                 - Dashboard page
GET /api/dashboard             - Dashboard data
```

### Projects
```
GET    /api/projects/[id]      - Get project details
DELETE /api/projects/[id]      - Delete project (soft)
```

### Scans
```
POST /api/scan/start           - Start scan
GET  /api/scan/[id]            - Get scan details
GET  /api/scan/status/active   - Active scans
GET  /api/scan/history         - Scan history
POST /api/scan/compare         - Compare scans
```

### Webhooks
```
POST /api/webhook              - GitLab webhook callback
```

---

## ✅ Testing Checklist

### Authentication Flow
- [x] Login ด้วย Google ทำงาน
- [x] Redirect ไป /setup สำหรับ new user
- [x] Redirect ไป /dashboard สำหรับ existing user
- [x] Session timeout 15 นาที
- [x] Session extend เมื่อมี active scans

### Dashboard
- [x] แสดงโปรเจคทั้งหมด
- [x] แสดง active scans
- [x] สามารถ scan service ได้
- [x] สามารถลบโปรเจคได้
- [x] แสดง quota usage

### Scanning
- [x] Scan & Build ทำงาน
- [x] Scan Only ทำงาน
- [x] Concurrent scan หลาย service ได้
- [x] ป้องกัน duplicate scan บน service เดียวกัน
- [x] Webhook update status

### History & Comparison
- [x] แสดง scan history
- [x] เปรียบเทียบ 2 scans ได้
- [x] แสดง new/resolved/persistent findings

---

## 🎯 Next Steps

### Immediate
1. ✅ Test complete auth flow
2. ✅ Test concurrent scans
3. ✅ Test session timeout
4. ✅ Test dashboard features

### Future Enhancements
1. 🔄 Email notifications เมื่อ scan เสร็จ
2. 🔄 Slack webhooks สำหรับ critical findings
3. 🔄 Export scan reports (PDF/JSON)
4. 🔄 Scheduled scans (daily/weekly)
5. 🔄 Webhook retry mechanism

---

**Updated**: January 1, 2026  
**Version**: 2.1.0  
**Status**: ✅ Ready for Testing  
**Author**: VisOps Team
