"use client";
import React from "react";
import { AlertCircle } from "lucide-react";

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
    <div className="bg-red-50 rounded-xl shadow-sm border-2 border-red-300 p-6">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-bold text-red-900">
            Release Blocked by Security
          </h2>
          <p className="text-sm text-red-700 mt-1">
            Found {vulnerabilities.length} CRITICAL vulnerabilities that must be
            fixed before release.
          </p>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {vulnerabilities.slice(0, 20).map((vuln, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg border border-red-200 p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                    CRITICAL
                  </span>
                  <span className="font-mono text-sm text-gray-700">
                    {vuln.id}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{vuln.title}</h3>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm mt-3">
              <div>
                <div className="text-xs text-gray-500">Package</div>
                <div className="font-mono font-medium text-gray-900">
                  {vuln.pkgName}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Current Version</div>
                <div className="font-mono text-red-600">
                  {vuln.installedVersion}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Fixed In</div>
                <div className="font-mono text-green-600">
                  {vuln.fixedVersion || "N/A"}
                </div>
              </div>
            </div>

            {vuln.description && (
              <p className="text-xs text-gray-600 mt-3 p-2 bg-gray-50 rounded border border-gray-200">
                {vuln.description}
              </p>
            )}
          </div>
        ))}

        {vulnerabilities.length > 20 && (
          <div className="text-center text-sm text-gray-600 py-2">
            ... and {vulnerabilities.length - 20} more critical vulnerabilities
          </div>
        )}
      </div>
    </div>
  );
};
