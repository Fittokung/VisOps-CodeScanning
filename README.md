# VisScan - Mock Version (Next.js)

## Setup

1. Ensure dependencies:

   - next, react, react-dom (created by create-next-app)
   - uuid: `npm i uuid`

2. Start dev:
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000

## Progress Status
### สิ่งที่มีตอนนี้
1. Next.js (Frontend)
2. API mock (/api/scan/*)
3. Mock pipeline / progress
4. Mock severity result
5. UX/Flow ที่ถูกต้อง fix : confirm build to push to docker hub

### สิ่งที่ยังไม่มี
1. ไม่มีการ clone repo จริง ✓
2. ไม่มีการ scan จริง ✓
3. ไม่มี container / runner
4. ไม่มี user / auth

### Step ที่จะทำต่อ
1.	ปรับ Mock Backend API เป็น API ของจริง
2.	Scan
3.	Pipeline
4.	Container Build
5.	Security
6.	Auth / User

test branch