"use client";

import { useState, useEffect } from "react";
import { UploadCloud, Loader2, AlertTriangle, Check } from "lucide-react";

export default function ConfirmBuildButton({ scanId }: { scanId: string }) {
  const [status, setStatus] = useState<string>("loading");
  const [vulnCount, setVulnCount] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/scan/status/${scanId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.status) setStatus(data.status);
        setVulnCount(data.counts?.critical || 0);

      } catch (e) { /* silent */ }
    };

    const interval = setInterval(checkStatus, 3000);
    checkStatus(); 
    return () => clearInterval(interval);
  }, [scanId]);

  const handleRelease = async () => {
    if (!confirm("Are you sure you want to trigger the release pipeline?")) return;
    
    setIsDeploying(true);
    setErrorMessage("");
    
    try {
      const res = await fetch(`/api/scan/confirm-push/${scanId}`, { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
        setDeployResult("success");
        alert("Pipeline Resumed! Pushing to Docker Hub...");
      } else {
        setDeployResult("error");
        setErrorMessage(data.error || "Failed to trigger release");
      }
    } catch (e) {
      setDeployResult("error");
      setErrorMessage("Network connection error");
    } finally {
      setIsDeploying(false);
    }
  };

  if (status === "SUCCESS" || deployResult === "success") {
      return (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-center gap-2 mb-6 animate-in fade-in">
              <Check className="w-5 h-5" />
              <div>
                  <strong>Deployment Complete</strong>
                  <p className="text-sm opacity-90">Image has been released successfully.</p>
              </div>
          </div>
      );
  }

  // ✅ ถ้า BLOCKED หรือ FAILED ไม่ต้องโชว์ปุ่ม
  if (status === "BLOCKED" || status === "FAILED") return null;

  // โชว์เฉพาะตอน Waiting
  if (status !== "WAITING_CONFIRMATION" && status !== "MANUAL") return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-md mb-6 animate-in fade-in slide-in-from-top-2">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Ready for Release</h3>
            <p className="text-sm text-slate-600 mb-2">
                Security scan passed. Please confirm to push the image to Docker Hub.
            </p>
            {vulnCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded-md text-sm flex items-center gap-2 w-fit">
                    <AlertTriangle className="w-4 h-4" />
                    Warning: {vulnCount} critical findings detected.
                </div>
            )}
             {errorMessage && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                    {errorMessage}
                </div>
            )}
          </div>

          <button
            onClick={handleRelease}
            disabled={isDeploying}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all whitespace-nowrap
              ${isDeploying ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl"}
            `}
          >
            {isDeploying ? (
              <> <Loader2 className="w-5 h-5 animate-spin" /> Processing... </>
            ) : (
              <> <UploadCloud className="w-5 h-5" /> Confirm & Push </>
            )}
          </button>
      </div>
    </div>
  );
}