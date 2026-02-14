"use client";
import { useState } from "react";
import { UploadCloud, Loader2, AlertTriangle, CheckCircle2, Rocket } from "lucide-react";

type Props = {
  scanId: string;
  status: string;
  vulnCount?: number;
  imagePushed?: boolean;
  onSuccess?: () => void; // [NEW] Callback for refresh
};

export default function ConfirmBuildButton({
  scanId,
  status,
  vulnCount = 0,
  imagePushed = false,
  onSuccess,
}: Props) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // Optimistic UI state
  const [localPushed, setLocalPushed] = useState(false);

  const isCompleted = imagePushed || localPushed;

  const handleRelease = async () => {
    if (!confirm("Are you sure you want to trigger the release pipeline?"))
      return;

    setIsDeploying(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/scan/confirm-push/${scanId}`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setLocalPushed(true);
        // alert("Pipeline Resumed! Pushing to Docker Hub..."); // Remove alert for smoother UX? Or keep it? User said "update real time".
        // Let's keep alert but ensuring data refetch is key.
        if (onSuccess) onSuccess(); 
      } else {
        setErrorMessage(data.error || "Failed to trigger release");
      }
    } catch (e) {
      setErrorMessage("Network connection error");
    } finally {
      setIsDeploying(false);
    }
  };

  if (isCompleted) {
    return null; // ✅ Hide completely when done. Status is shown in Header.
  }

  // ✅ ถ้า BLOCKED หรือ FAILED ไม่ต้องโชว์ปุ่ม
  if (status === "BLOCKED" || status === "FAILED") return null;

  // โชว์ปุ่มเฉพาะตอน SUCCESS หรือ MANUAL
  const normalizedStatus = status?.toUpperCase();
  if (normalizedStatus !== "SUCCESS" && normalizedStatus !== "MANUAL")
    return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pl-2">
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-600" />
            Ready for Release
          </h3>
          <p className="text-sm text-slate-600 mb-3 max-w-2xl text-balance">
            Security scan passed. The image is safe to be pushed to your container registry.
          </p>
          
          {vulnCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-sm flex items-center gap-2 w-fit">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>
                <strong>Warning:</strong> {vulnCount} critical findings detected.
              </span>
            </div>
          )}
          
          {errorMessage && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {errorMessage}
            </div>
          )}
        </div>

        <button
          onClick={handleRelease}
          disabled={isDeploying}
          className={`group flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all whitespace-nowrap shadow-md hover:shadow-lg
              ${
                isDeploying
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5"
              }
            `}
        >
          {isDeploying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <UploadCloud className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
              Confirm & Push
            </>
          )}
        </button>
      </div>
    </div>
  );
}

