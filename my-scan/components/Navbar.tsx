"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  LogOut,
  Settings,
  ChevronDown,
  Book,
  History,
  ShieldCheck,
  Server,
  FileText,
  Sliders,
  Layers,
  User,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = session?.user as any;
  const firstName = user?.name ? user.name.split(" ")[0] : "User";
  const userInitial = firstName?.charAt(0).toUpperCase() || "U";

 
  const getPageIdentity = (path: string | null) => {
    if (!path) return null;


    if (path === "/dashboard") {
      return null;
    }

    if (path.startsWith("/scan/history")) {
      return { title: "Scan History", icon: History, color: "text-orange-600" };
    }
    if (path.startsWith("/scan/")) {
      if (path.includes("scanonly") || path.includes("build"))
        return { title: "New Scan", icon: Layers, color: "text-blue-600" };
      return { title: "Scan Report", icon: FileText, color: "text-purple-600" };
    }
    if (path.startsWith("/docs")) {
      return { title: "Documentation", icon: Book, color: "text-emerald-600" };
    }
    if (path.startsWith("/admin")) {
      return {
        title: "System Admin",
        icon: ShieldCheck,
        color: "text-red-600",
      };
    }
    if (path.startsWith("/settings")) {
      return { title: "Settings", icon: Sliders, color: "text-slate-600" };
    }
    if (path.startsWith("/services")) {
      return { title: "Services", icon: Server, color: "text-indigo-600" };
    }

    return { title: "Overview", icon: Layers, color: "text-slate-500" };
  };

  const currentPage = getPageIdentity(pathname);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session) return null;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 sticky top-0 z-40 transition-all duration-200">
    
      <div className="flex items-center min-w-0">
        {currentPage ? (
          <div className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left-2 duration-300">
            <Link
              href="/dashboard"
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors font-semibold hidden sm:block"
            >
              VisScan
            </Link>

            <span className="text-slate-300 dark:text-slate-700 hidden sm:block">/</span>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
              <currentPage.icon size={15} className={currentPage.color} />
              <span className="font-semibold tracking-tight whitespace-nowrap">
                {currentPage.title}
              </span>
            </div>
          </div>
        ) : (
          <div />
        )}
      </div>


      <div className="flex items-center gap-3">
        <ThemeToggle />
        
        <div id="navbar-profile-section" className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 focus:outline-none group"
          >
            {/* Text Area */}
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-bold text-gray-800 dark:text-slate-200 leading-none mb-1.5 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                {firstName}
              </span>
              <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-gray-100 dark:border-slate-700">
                {user?.role || "Member"}
              </span>
            </div>

            {/* Profile Circle */}
            <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-slate-700 flex items-center justify-center text-white font-bold text-sm shadow-md ring-4 ring-gray-50 dark:ring-slate-900 group-hover:ring-blue-50 dark:group-hover:ring-blue-900/20 transition-all">
              {userInitial}
            </div>

            <ChevronDown
              size={14}
              className={`text-gray-300 dark:text-slate-600 transition-transform duration-300 ${
                isDropdownOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
              }`}
            />
          </button>

          {/* Minimal Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              {/* Mobile Header */}
              <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800 sm:hidden">
                <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-1">
                  {user?.email}
                </p>
              </div>

              <div className="p-1.5 space-y-1">
                <Link
                  href="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <User size={18} className="text-slate-400 dark:text-slate-500" />
                  My Profile
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Settings size={18} className="text-slate-400 dark:text-slate-500" />
                  Account Settings
                </Link>
              </div>

              <div className="h-px bg-gray-50 dark:bg-slate-800 my-1 mx-2" />

              <div className="p-1.5">
                <button
                  onClick={() => signOut({ 
                    callbackUrl: process.env.NEXT_PUBLIC_CMU_ENTRAID_LOGOUT_URL || "/" 
                  })}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
