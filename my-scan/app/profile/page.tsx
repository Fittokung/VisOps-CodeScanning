"use client";

import { useSession } from "next-auth/react";
import { User, Mail, GraduationCap, Box, Shield, Building2, BadgeCheck } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  if (!user) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <User className="text-blue-500" />
          My Profile
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Manage your personal information and account details.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-900/20 dark:to-purple-900/20 relative">
            <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        </div>

        <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
                <div className="h-24 w-24 rounded-full ring-4 ring-white dark:ring-slate-900 bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg overflow-hidden">
                    {user.image ? (
                        <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-3xl font-bold text-slate-300">
                             {user.name?.charAt(0) || "U"}
                        </span>
                    )}
                </div>
                <div className="flex gap-2 mb-2">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' 
                        : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                     }`}>
                        {user.role}
                     </span>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {user.name}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        {user.firstnameTH} {user.lastnameTH}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                            <Mail size={14} /> Email
                        </label>
                        <p className="text-gray-900 dark:text-white font-medium">{user.email}</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                            <Building2 size={14} /> Organization
                        </label>
                        <div className="text-gray-900 dark:text-white font-medium">
                            {user.organizationName || "-"}
                            {user.organizationCode && (
                                <span className="text-slate-400 text-sm ml-2 font-normal">
                                    ({user.organizationCode})
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                            <BadgeCheck size={14} /> Account Type
                        </label>
                         <p className="text-gray-900 dark:text-white font-medium">
                            {user.itAccountType || "-"}
                         </p>
                    </div>

                    {user.studentId && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                                <GraduationCap size={14} /> Student ID
                            </label>
                            <p className="text-gray-900 dark:text-white font-medium font-mono">
                                {user.studentId}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
