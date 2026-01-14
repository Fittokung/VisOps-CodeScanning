"use client";
import React from "react";
import { Loader2, XCircle } from "lucide-react";

interface CancelButtonProps {
  onCancel: () => void;
  isCancelling: boolean;
  step?: string;
}

export const CancelButton = ({
  onCancel,
  isCancelling,
  step,
}: CancelButtonProps) => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
        <div>
          <p className="text-sm font-medium text-amber-900">Scan in progress</p>
          <p className="text-xs text-amber-700">
            {step || "Processing pipeline stages"}
          </p>
        </div>
      </div>
      <button
        onClick={onCancel}
        disabled={isCancelling}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isCancelling ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Cancelling...
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4" />
            Cancel
          </>
        )}
      </button>
    </div>
  );
};
