// components/Navbar.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  History,
  FileCode,
  ShieldCheck,
  User,
  LayoutDashboard,
  Settings as SettingsIcon,
  BookOpen,
} from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = session?.user as any;
  const isAdmin = user?.role === "admin";
  const isApproved = user?.status === "APPROVED";
  const isSetupComplete = user?.isSetupComplete;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsAdminOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hideNavbar =
    pathname === "/login" ||
    pathname === "/setup" ||
    pathname === "/pending" ||
    (pathname === "/" && status === "unauthenticated");

  if (hideNavbar || status === "loading" || !session) return null;

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
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
            <span className="text-lg font-semibold text-gray-900 tracking-tight">
              VisScan
            </span>
          </Link>

          {/* Navigation Links */}
          {isSetupComplete && isApproved && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
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

                {/* ✅ เพิ่ม Link: Scanner Info ตรงนี้ */}
                <Link
                  href="/docs/scanners"
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname.startsWith("/docs")
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <BookOpen size={16} />
                  Scanner Info
                </Link>

                {/* Admin Dropdown */}
                {isAdmin && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsAdminOpen(!isAdminOpen)}
                      className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        pathname.startsWith("/admin")
                          ? "text-purple-600 bg-purple-50 border border-purple-100"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <ShieldCheck size={16} className="text-purple-500" />
                      Admin Tools
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${
                          isAdminOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isAdminOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 animate-in fade-in zoom-in duration-150 ring-1 ring-black ring-opacity-5">
                        <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                          System Management
                        </div>
                        <Link
                          href="/admin/history"
                          onClick={() => setIsAdminOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        >
                          <History size={16} className="text-gray-400" />
                          All Scans History
                        </Link>
                        <Link
                          href="/admin/template"
                          onClick={() => setIsAdminOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        >
                          <FileCode size={16} className="text-gray-400" />
                          Docker Templates
                        </Link>
                        <Link
                          href="/admin/users"
                          onClick={() => setIsAdminOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        >
                          <User size={16} />
                          User Management
                        </Link>
                      </div>
                    )}
                  </div>
                )}

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

              {/* User Menu & Profile */}
              <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-gray-800 leading-none capitalize">
                    {session.user?.name?.split(" ")[0] || "User"}
                  </div>
                  <div
                    className={`text-[10px] font-bold uppercase mt-1 px-1.5 py-0.5 rounded shadow-sm inline-block ${
                      isAdmin
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {user?.role}
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all border border-gray-200"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Setup incomplete or Not Approved nav */}
          {(!isSetupComplete || !isApproved) && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <div className="text-sm text-gray-500 font-medium">
                  {session.user?.email}
                </div>
                <div className="text-[10px] text-amber-600 font-bold uppercase">
                  {user?.status}
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all border border-red-100"
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
