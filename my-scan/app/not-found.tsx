// app/not-found.tsx
"use client";

import Link from "next/link";
import { MoveLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Minimal 404 Typography */}
        <div className="relative">
          <h1 className="text-[10rem] font-bold text-gray-50 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-medium text-gray-900 bg-white px-4 tracking-widest uppercase">
              Page Not Found
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-500 text-sm font-light leading-relaxed max-w-xs mx-auto">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => window.history.back()}
            className="group inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-600 bg-transparent hover:text-gray-900 transition-colors"
          >
            <MoveLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Go Back
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-full hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <Home size={16} />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="fixed bottom-8 text-xs text-gray-300 font-mono">
        Error Code: 404_NOT_FOUND
      </div>
    </div>
  );
}
