// components/Navbar.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, History, FileCode, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // ปิด Dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAdminOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't show navbar on login, setup, or home page (for unauthenticated users)
  const hideNavbar =
    pathname === "/login" ||
    pathname === "/setup" ||
    (pathname === "/" && status === "unauthenticated");

  if (hideNavbar) {
    return null;
  }

  if (status === "loading") {
    return null;
  }

  if (!session) {
    return null;
  }

  const isSetupComplete = (session.user as any)?.isSetupComplete;

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href={isSetupComplete ? "/dashboard" : "/"}
            className="flex items-center gap-2.5 hover:opacity-80 transition"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              VS
            </div>
            <span className="text-lg font-semibold text-gray-900 tracking-tight">VisScan</span>
          </Link>

          {/* Navigation Links */}
          {isSetupComplete && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === "/dashboard"
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/scan/history"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname.startsWith("/scan/history")
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  History
                </Link>

                {/* Admin Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsAdminOpen(!isAdminOpen)}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      pathname.startsWith("/admin")
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <ShieldCheck size={16} className="text-blue-500" />
                    Admin
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isAdminOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isAdminOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-2 animate-in fade-in zoom-in duration-150">
                      <Link
                        href="/admin/history"
                        onClick={() => setIsAdminOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <History size={16} />
                        Admin History
                      </Link>
                      <Link
                        href="/admin/template"
                        onClick={() => setIsAdminOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <FileCode size={16} />
                        Docker Template
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  href="/settings"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === "/settings"
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Settings
                </Link>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-gray-800 leading-none">
                    {session.user?.name?.split(" ")[0] || "User"}
                  </div>
                  <div className="text-[10px] text-blue-600 font-medium uppercase mt-0.5">
                    {(session.user as any)?.role || "Member"}
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Setup incomplete nav */}
          {!isSetupComplete && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 italic">{session.user?.email}</div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
