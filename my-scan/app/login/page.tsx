"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCMULogin = async () => {
    setIsLoading(true);
    await signIn("cmu-entraid", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900">
      {/* Back Button */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          {/* Logo Box */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-purple-100 dark:shadow-purple-900/50">
              VS
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in with your CMU Account
            </p>
          </div>

          <div className="pt-2 space-y-4">
            {/* ✅ Login Button (Always Enabled) */}
            <button
              onClick={handleCMULogin}
              disabled={isLoading}
              className={`w-full group relative inline-flex items-center justify-center gap-3 px-8 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-sm ${
                isLoading
                  ? "cursor-not-allowed bg-slate-50 dark:bg-slate-800"
                  : "hover:border-purple-300 dark:hover:border-purple-600 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md"
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
              )}
              <span>Sign in with CMU Account</span>
            </button>

            {/* ✅ Implied Consent Disclaimer */}
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 leading-tight px-4">
              By clicking "Sign in", you agree to the{" "}
              <Link
                href="/terms"
                target="_blank"
                className="font-medium text-purple-600 dark:text-purple-400 hover:underline"
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
