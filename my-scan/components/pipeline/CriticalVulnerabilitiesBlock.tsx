"use client";
import React from "react";
import { AlertCircle, ShieldAlert, ArrowRight } from "lucide-react";

interface CriticalVulnerabilitiesBlockProps {
  vulnerabilities: Array<{
    id: string;
    pkgName: string;
    installedVersion: string;
    fixedVersion?: string;
    title: string;
    description?: string;
    severity: string;
  }>;
}

export const CriticalVulnerabilitiesBlock = ({
  vulnerabilities,
}: CriticalVulnerabilitiesBlockProps) => {
  if (!vulnerabilities || vulnerabilities.length === 0) return null;

  return (
    <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 bg-red-100 rounded-lg shrink-0">
             <ShieldAlert className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
            Release Blocked by Security
          </h2>
          <p className="text-sm text-red-800/80 mt-1 max-w-3xl">
            We found {vulnerabilities.length} <strong>CRITICAL</strong> vulnerabilities that pose a significant risk. 
            The pipeline has been halted to prevent deploying insecure code.
          </p>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {vulnerabilities.slice(0, 20).map((vuln, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg border border-red-100 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white tracking-wider uppercase">
                    Critical
                  </span>
                  <span className="font-mono text-sm text-slate-500">
                    {vuln.id}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900">{vuln.title}</h3>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400 mb-0.5">Package</div>
                <div className="font-mono font-medium text-slate-800 break-all">
                  {vuln.pkgName}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400 mb-0.5">Current</div>
                <div className="font-mono text-red-600 font-medium">
                  {vuln.installedVersion}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400 mb-0.5">Fixed In</div>
                <div className="font-mono text-emerald-600 font-bold flex items-center gap-1">
                  {vuln.fixedVersion ? (
                      <>
                        {vuln.fixedVersion} <ArrowRight size={10} className="opacity-50" />
                      </>
                  ) : <span className="text-slate-400 font-normal italic">No fix yet</span> }
                </div>
              </div>
            </div>

            {vuln.description && (
              <p className="text-xs text-slate-600 mt-3 pl-3 border-l-2 border-slate-200 line-clamp-2">
                {vuln.description}
              </p>
            )}
          </div>
        ))}

        {vulnerabilities.length > 20 && (
          <div className="text-center text-sm text-slate-500 py-3 italic bg-slate-50 rounded-lg">
            ... and {vulnerabilities.length - 20} more critical vulnerabilities
          </div>
        )}
      </div>
    </div>
  );
};
