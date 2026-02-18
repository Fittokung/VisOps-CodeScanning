"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCMULogin = async () => {
    setIsLoading(true);
    await signIn("cmu-entraid", { callbackUrl: "/dashboard" }, {
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/cmuEntraIDCallback`
    });
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
            <button
              onClick={handleCMULogin}
              disabled={isLoading}
              className={`w-full group relative inline-flex items-center justify-center gap-3 px-8 py-3.5 
              bg-[#64256F] hover:bg-[#501d59] active:bg-[#3f1746]
              dark:bg-[#7a3c85] dark:hover:bg-[#64256F] dark:active:bg-[#501d59]
              dark:border dark:border-[#964fa3]/50
              text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5
              disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-white/80" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 dark:bg-white/20 flex items-center justify-center p-0.5 shadow-sm">
                   <img 
                      src="/cmu-logo.png" 
                      alt="CMU Logo" 
                      className="w-full h-full object-contain drop-shadow-sm" 
                   />
                </div>
              )}
              <span className="text-lg">Sign in with CMU Account</span>
            </button>

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
