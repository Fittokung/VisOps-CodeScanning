"use client";
import React from "react";
import { CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";

export const HealthyStateBanner = () => {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-sm border border-emerald-100 p-6 animate-in fade-in slide-in-from-top-4 duration-700 relative overflow-hidden">
       {/* Background Decoration */}
       <div className="absolute top-0 right-0 p-8 transform translate-x-1/4 -translate-y-1/4 opacity-10 pointer-events-none">
            <ShieldCheck size={120} className="text-emerald-500" />
       </div>

      <div className="flex items-start gap-4 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-bold text-emerald-900">
              Security Health Score
            </h3>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              100% Secure
            </span>
          </div>
          
          <p className="text-emerald-800/80 font-medium mb-4 text-sm">
            All systems operational. No risks detected in this build.
          </p>
          
          <div className="space-y-2 text-sm text-emerald-700">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>No security vulnerabilities detected</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>No hardcoded secrets exposed</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Code analysis passed all checks</span>
            </div>
          </div>
          
          <div className="mt-5 pt-4 border-t border-emerald-200/60">
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Ready for production deployment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
