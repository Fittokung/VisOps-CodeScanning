import React from "react";
import { Loader2, XCircle } from "lucide-react";

interface QueuedStateProps {
  onCancel: () => void;
  isCancelling: boolean;
}

export const QueuedState = ({ onCancel, isCancelling }: QueuedStateProps) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <h3 className="text-xl font-semibold text-blue-900 mb-2">
          Waiting in Queue
        </h3>
        <p className="text-blue-700 mb-4 max-w-md">
          Your scan is queued and will start processing soon. The worker will
          pick it up automatically.
        </p>
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-100 px-4 py-2 rounded-full">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          Position in queue: Processing will begin shortly
        </div>

        <button
          onClick={onCancel}
          disabled={isCancelling}
          className="mt-6 flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
}

export const CancelledState = ({ scanId }: CancelledStateProps) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-gray-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Scan Cancelled
        </h3>
        <p className="text-gray-600 mb-4 max-w-md">
          This scan was cancelled and will not be processed.
        </p>
        <div className="text-sm text-gray-500">
          Pipeline ID: <span className="font-mono">{scanId}</span>
        </div>
      </div>
    </div>
  );
};
