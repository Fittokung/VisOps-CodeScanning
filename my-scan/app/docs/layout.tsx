"use client";

import DocsSidebar from "@/components/DocsSidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full bg-white dark:bg-slate-950 overflow-hidden">
      {/* Sidebar - Fixed relative to this container */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-full border-r border-slate-200 dark:border-slate-800 py-6 px-4 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
        <DocsSidebar />
      </aside>

      {/* Main Content - Scrollable */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

