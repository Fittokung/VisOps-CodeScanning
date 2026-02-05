"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  History,
  BookOpen,
  ShieldCheck,
  FileCode,
  Users,
  ChevronRight,
  Server,
} from "lucide-react";

interface SidebarProps {
  isAdmin: boolean;
}

export default function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ✅ State สำหรับจัดการ Tooltip แบบ Fixed Position
  const [hoveredItem, setHoveredItem] = useState<{
    label: string;
    top: number;
  } | null>(null);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Services", href: "/services", icon: Server }, // Added Services
    { label: "Scan History", href: "/scan/history", icon: History },
    { label: "Documents", href: "/docs/getting-started", icon: BookOpen },
  ];

  const adminItems = [
    { label: "All Scans", href: "/admin/history", icon: ShieldCheck },
    { label: "Templates", href: "/admin/template", icon: FileCode },
    { label: "Users", href: "/admin/users", icon: Users },
  ];

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const handleSidebarClick = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // ✅ ฟังก์ชันคำนวณตำแหน่ง Tooltip
  const handleMouseEnter = (e: React.MouseEvent, label: string) => {
    if (isCollapsed) {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredItem({ label, top: rect.top + rect.height / 2 });
    }
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  return (
    <>
      <aside
        onClick={handleSidebarClick}
        className={`bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 hidden md:flex md:flex-col h-full shrink-0 transition-all duration-300 ease-in-out cursor-pointer relative hover:bg-gray-50/50 dark:hover:bg-slate-800/50 z-30 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* 1. Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-slate-800 overflow-hidden whitespace-nowrap shrink-0">
          <div className="flex items-center gap-3 min-w-max">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
              VS
            </div>
            <span
              className={`text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight transition-all duration-300 ${
                isCollapsed
                  ? "opacity-0 w-0 translate-x-[-10px]"
                  : "opacity-100 w-auto translate-x-0"
              }`}
            >
              VisScan
            </span>
          </div>
        </div>

        {/* 2. Navigation List */}
        {/* ✅ แก้ไข: ใช้ overflow-hidden ปกติ เพื่อตัด Scrollbar ทิ้งไปเลย */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-6 scrollbar-hide">
          {/* Main Menu */}
          <div className="space-y-1">
            <p
              className={`px-3 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3 transition-all duration-300 ${
                isCollapsed ? "text-center text-[10px]" : ""
              }`}
            >
              {isCollapsed ? "Menu" : "Main Menu"}
            </p>
            {navItems.map((item) => {
              const isDisabled = (item as any).disabled;
              const badge = (item as any).badge;
              
              const content = (
                <>
                  <item.icon
                    size={20}
                    className={`shrink-0 transition-colors ${
                      isDisabled
                        ? "text-gray-300 dark:text-slate-600"
                        : isActive(item.href)
                          ? "text-blue-600"
                          : "text-gray-400 group-hover:text-gray-600"
                    }`}
                  />
                  <span
                    className={`whitespace-nowrap transition-all duration-300 ${
                      isCollapsed
                        ? "opacity-0 w-0 overflow-hidden"
                        : "opacity-100 w-auto"
                    }`}
                  >
                    {item.label}
                  </span>
                  {badge && !isCollapsed && (
                    <span className="ml-auto text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                      {badge}
                    </span>
                  )}
                </>
              );
              
              const baseClassName = `relative flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group`;
              
              if (isDisabled) {
                return (
                  <div
                    key={item.href}
                    onMouseEnter={(e) => handleMouseEnter(e, item.label)}
                    onMouseLeave={handleMouseLeave}
                    className={`${baseClassName} text-gray-400 dark:text-slate-500 cursor-not-allowed opacity-60`}
                  >
                    {content}
                  </div>
                );
              }
              
              return (
                <Link
                  id={`sidebar-nav-${item.label.toLowerCase().replace(" ", "-")}`}
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  onMouseEnter={(e) => handleMouseEnter(e, item.label)}
                  onMouseLeave={handleMouseLeave}
                  className={`${baseClassName} ${
                    isActive(item.href)
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md dark:hover:shadow-none hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {content}
                </Link>
              );
            })}
          </div>

          {/* Admin Menu */}
          {isAdmin && (
            <div className="space-y-1">
              <div
                className={`px-3 mb-3 transition-all duration-300 ${
                  isCollapsed ? "border-t border-gray-100 dark:border-slate-800 pt-4 text-center" : ""
                }`}
              >
                <p
                  className={`text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider ${
                    isCollapsed ? "text-[10px]" : ""
                  }`}
                >
                  {isCollapsed ? "Admin" : "System"}
                </p>
              </div>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  onMouseEnter={(e) => handleMouseEnter(e, item.label)}
                  onMouseLeave={handleMouseLeave}
                  className={`relative flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    isActive(item.href)
                      ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 shadow-sm"
                      : "text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md dark:hover:shadow-none hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <item.icon
                    size={20}
                    className={`shrink-0 transition-colors ${
                      isActive(item.href)
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300"
                    }`}
                  />
                  <span
                    className={`whitespace-nowrap transition-all duration-300 ${
                      isCollapsed
                        ? "opacity-0 w-0 overflow-hidden"
                        : "opacity-100 w-auto"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 3. Footer / Hint Area */}
        <div className="p-4 border-t border-gray-100 flex justify-center text-gray-300 shrink-0">
          {isCollapsed && <ChevronRight size={16} className="animate-pulse" />}
        </div>
      </aside>

      {/* ✅ Tooltip Layer (Render Outside Sidebar) */}
      {/* ใช้ position: fixed เพื่อให้ลอยเหนือทุกอย่างและไม่ดัน layout */}
      {isCollapsed && hoveredItem && (
        <div
          className="fixed left-20 z-50 ml-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none"
          style={{ top: hoveredItem.top, transform: "translateY(-50%)" }}
        >
          {hoveredItem.label}
          {/* Arrow */}
          <div className="absolute top-1/2 -left-1 w-2 h-2 -mt-1 bg-slate-900 rotate-45" />
        </div>
      )}
    </>
  );
}
