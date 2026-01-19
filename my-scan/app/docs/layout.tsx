"use client";

import DocsSidebar from "@/components/DocsSidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ✅ 1. ใช้ w-full เพื่อให้ยืดเต็มพื้นที่ Content ของ AppLayout ไม่ต้องมี max-w หรือ mx-auto
    <div className="w-full min-h-full bg-white">
      {/* Container หลัก จัดเรียงแบบ Flex ชิดซ้าย */}
      <div className="flex items-start w-full">
        {/* --- Left Sidebar (Docs Navigation) --- */}
        {/* ✅ Sidebar จะติดขอบซ้ายตลอดเวลา ไม่ลอยไปมา */}
        <aside className="hidden lg:block sticky top-0 w-64 shrink-0 h-[calc(100vh-5rem)] overflow-y-auto border-r border-slate-200 py-8 pl-6 pr-4 bg-slate-50/30">
          <DocsSidebar />
        </aside>

        {/* --- Main Content Area --- */}
        {/* ✅ ใช้ flex-1 เพื่อกินพื้นที่ที่เหลือทั้งหมด */}
        <main className="flex-1 min-w-0 py-8 px-6 lg:px-12">
          {/* ถ้าอยากจำกัดความกว้างของตัวหนังสือให้อ่านง่าย ใส่ max-w-5xl ที่นี่ได้ แต่ Layout จะยังเต็มจอ */}
          <div className="max-w-5xl min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
