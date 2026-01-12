"use client";

// app/error.tsx
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-6">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Something Went Wrong
          </h1>
          <p className="text-slate-500 leading-relaxed mb-4">
            An unexpected error occurred. This has been logged and we'll look
            into it.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 font-mono bg-slate-100 px-3 py-1 rounded inline-block">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition font-medium"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>

        <button
          onClick={() => window.history.back()}
          className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Go back to previous page
        </button>
      </div>
    </div>
  );
}
