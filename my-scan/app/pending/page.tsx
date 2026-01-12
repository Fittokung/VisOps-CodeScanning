"use client";
import { signOut, useSession } from "next-auth/react";
import { Clock, LogOut, XCircle, Mail } from "lucide-react";

export default function PendingPage() {
  const { data: session } = useSession();
  const isRejected = (session?.user as any)?.status === "REJECTED";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
        {isRejected ? (
          // --- กรณีถูก REJECTED ---
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Access Denied
            </h1>
            <p className="text-slate-600 mb-8">
              Sorry <span className="font-semibold">{session?.user?.name}</span>
              , your request to join VisScan was not approved. Please contact
              the administrator for more information.
            </p>
          </>
        ) : (
          // --- กรณี PENDING ปกติ ---
          <>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-yellow-600 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Account Pending
            </h1>
            <p className="text-slate-600 mb-8">
              Hi <span className="font-semibold">{session?.user?.name}</span>,
              your account is currently waiting for admin approval.
            </p>
          </>
        )}

        <div className="space-y-3">
          <a
            href="mailto:admin@visscan.com"
            className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm"
          >
            <Mail size={16} /> Contact Support
          </a>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium text-sm"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
