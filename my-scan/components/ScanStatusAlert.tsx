"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Trash2 } from "lucide-react";

type Props = {
  scanId: string;
};

export default function ScanStatusAlert({ scanId }: Props) {
  const [status, setStatus] = useState<string>("PENDING");
  const [vulnCritical, setVulnCritical] = useState<number>(0);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/scan/status/${scanId}`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
          setVulnCritical(data.counts?.critical || 0);
        }
      } catch (error) {
        console.error("Polling error");
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [scanId]);

  if (status === "BLOCKED") {
    return (
      <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg shadow-sm mb-6 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-red-100 rounded-full text-red-600 shrink-0">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-800">Deployment Blocked by Security Policy</h3>
            <p className="text-red-700 mt-2 font-medium">
              Critical vulnerabilities detected ({vulnCritical} found).
            </p>
            <ul className="mt-2 list-disc list-inside text-sm text-red-600 space-y-1">
              <li>The Docker image was <b>NOT</b> pushed to Docker Hub.</li>
              <li>Please download the Artifacts below to review security issues.</li>
            </ul>
            
            <div className="mt-4 flex items-center gap-2 text-xs text-red-500 font-mono bg-red-100/50 p-2 rounded w-fit">
              <Trash2 size={12}/> Pipeline stopped. Fix critical issues to proceed.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}