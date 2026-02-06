"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react"; // ✅ ใช้ ArrowRight
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const isSetupComplete = (session?.user as any)?.isSetupComplete;
      if (isSetupComplete) {
        router.push("/dashboard");
      } else {
        router.push("/setup");
      }
    }
  }, [status, session, router]);

  if (status === "loading" || status === "authenticated") return null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-white selection:bg-blue-100 dark:selection:bg-blue-900/30">
      {/* 1. Minimal Nav */}
      <nav className="w-full py-6 px-8 flex justify-end">
        <Link
          href="/login"
          className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* 2. Center Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 -mt-16">
        <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          {/* Logo Box */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-3xl shadow-2xl shadow-blue-200 dark:shadow-none">
              VS
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent pb-2">
              VisScan
            </h1>

            <p className="text-lg font-medium leading-relaxed">
              <span className="text-slate-700 dark:text-slate-300 block mb-1">
                Security scanning for modern dev teams.
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                Code, Build, and Ship securely.
              </span>
            </p>
          </div>

          {/* Minimal Actions */}
          <div className="pt-4 flex flex-col items-center gap-4">
            {/* ✅ ปุ่ม Get Started */}
            <Link
              href="/login"
              className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3 bg-slate-900 dark:bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 dark:hover:bg-blue-500 transition-all shadow-sm hover:shadow-xl hover:-translate-y-0.5 duration-300"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-slate-300 dark:text-slate-600">
          © {new Date().getFullYear()} VisScan Security
        </p>
      </footer>
    </div>
  );
}
