// app/docs/layout.tsx
"use client";

import DocsSidebar from "@/components/DocsSidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar Placeholder (ถ้ามี Global Navbar อยู่แล้ว ให้ลบส่วนนี้ออก) */}
      <div className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center px-4 lg:px-8">
          <div className="mr-4 flex">
            <a
              className="mr-6 flex items-center space-x-2 font-bold text-slate-900"
              href="/"
            >
              <span className="hidden font-bold sm:inline-block">
                VisOps Docs
              </span>
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-2xl flex items-start">
        {/* --- Left Sidebar (Fixed) --- */}
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block md:w-64 overflow-y-auto border-r border-slate-200 py-6 pr-4 pl-6 lg:py-8 bg-slate-50/30">
          <DocsSidebar />
        </aside>

        {/* --- Main Content Area --- */}
        <main className="relative py-6 lg:gap-10 lg:py-8 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
