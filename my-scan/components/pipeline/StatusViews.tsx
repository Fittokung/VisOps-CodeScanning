import React from "react";
import { Loader2, XCircle } from "lucide-react";

interface QueuedStateProps {
  onCancel: () => void;
  isCancelling: boolean;
}

export const QueuedState = ({ onCancel, isCancelling }: QueuedStateProps) => {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-900/30 rounded-xl p-8">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-orange-600 dark:text-orange-400 animate-spin" />
        </div>
        <h3 className="text-xl font-semibold text-orange-900 dark:text-orange-200 mb-2">
          Waiting in Queue
        </h3>
        <p className="text-orange-800 dark:text-orange-300 mb-4 max-w-md">
          Your scan is queued and will start processing soon. The worker will pick
          it up automatically.
        </p>
        <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 px-4 py-2 rounded-full">
          <span className="w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full animate-pulse"></span>
          Position in queue: Processing will begin shortly
        </div>

        <button
          onClick={onCancel}
          disabled={isCancelling}
          className="mt-6 flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isCancelling ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Cancelling...
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              Cancel Scan
            </>
          )}
        </button>
      </div>
    </div>
  );
};

interface CancelledStateProps {
  scanId: string;
  onRescan?: () => void;
}

export const CancelledState = ({ scanId, onRescan }: CancelledStateProps) => {
  return (
    <div className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-8">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-gray-600 dark:text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Scan Cancelled
        </h3>
        <p className="text-gray-600 dark:text-slate-400 mb-4 max-w-md">
          This scan was cancelled and will not be processed.
        </p>
        <div className="text-sm text-gray-500 dark:text-slate-500 mb-6">
          Pipeline ID: <span className="font-mono">{scanId}</span>
        </div>
        
        {onRescan && (
            <button
              onClick={onRescan}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition shadow-sm"
            >
              <Loader2 className="w-4 h-4" />
              Restart Scan
            </button>
        )}
      </div>
    </div>
  );
};


