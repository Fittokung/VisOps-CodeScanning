"use client";
import React from "react";
import { CheckCircle, Sparkles } from "lucide-react";

export const HealthyStateBanner = () => {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl shadow-lg border-2 border-emerald-200 p-6 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-emerald-900">
              Security Health Score
            </h3>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white text-sm font-bold rounded-full">
              <Sparkles className="w-4 h-4" />
              100%
            </span>
          </div>
          <p className="text-emerald-800 font-medium mb-3">
            All Systems Operational
          </p>
          <div className="space-y-1.5 text-sm text-emerald-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>No security vulnerabilities detected</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>No secrets or credentials exposed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Code analysis passed all checks</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-emerald-200">
            <p className="text-xs text-emerald-600 font-medium">
              Your code is clean and ready for deployment!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
