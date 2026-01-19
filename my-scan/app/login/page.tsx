"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false); // ✅ State สำหรับ Checkbox

  const handleGoogleLogin = async () => {
    if (!isAgreed) return; // กันไว้เผื่อ
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-blue-100">
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-blue-100">
              VS
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500">
              Sign in to access your dashboard
            </p>
          </div>

          <div className="pt-2 space-y-4">
            {/* ✅ Login Button (Disabled until checked) */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading || !isAgreed} // 🔒 ต้องติ๊กก่อน
              className={`w-full group relative inline-flex items-center justify-center gap-3 px-8 py-3 bg-white text-slate-700 font-medium rounded-xl border border-slate-200 transition-all shadow-sm ${
                !isAgreed || isLoading
                  ? "opacity-50 cursor-not-allowed bg-slate-50"
                  : "hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill={!isAgreed ? "#94a3b8" : "#4285F4"} // ทำให้สีเทาถ้ายังไม่ติ๊ก
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill={!isAgreed ? "#94a3b8" : "#34A853"}
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                    fill={!isAgreed ? "#94a3b8" : "#FBBC05"}
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill={!isAgreed ? "#94a3b8" : "#EA4335"}
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* ✅ Agreement Checkbox Section */}
            <div className="flex items-start gap-3 px-1">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="w-4 h-4 border border-slate-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 cursor-pointer accent-blue-600"
                />
              </div>
              <label
                htmlFor="terms"
                className="text-xs text-slate-500 leading-tight select-none cursor-pointer"
              >
                I acknowledge that I am solely responsible for the security of
                my credentials (GitHub/Docker tokens) and I agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
