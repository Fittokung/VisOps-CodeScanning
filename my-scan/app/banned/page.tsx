import { Ban } from "lucide-react";
import Link from "next/link";

export default function BannedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-6">
        <Ban className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
      <p className="max-w-md text-gray-400 mb-8">
        Your account has been suspended or rejected from the system.
        You can no longer access the dashboard or perform actions.
      </p>
      
      <div className="p-4 rounded-lg bg-gray-900 border border-gray-800 max-w-sm w-full mx-auto">
        <p className="text-sm text-gray-300">
          If you believe this is a mistake, please contact support:
        </p>
        <p className="mt-2 text-indigo-400 font-medium select-all">
          active-support@visops.local
        </p>
      </div>

      <div className="mt-8">
        <Link 
          href="/login"
          className="text-sm text-gray-500 hover:text-white transition-colors"
        >
          &larr; Back to Login
        </Link>
      </div>
    </div>
  );
}
