"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { 
  Shield, 
  ShieldAlert, 
  User as UserIcon, 
  Ban, 
  CheckCircle,
  MoreVertical,
  Search
} from "lucide-react";

// Types
interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: "ADMIN" | "user";
  status: "ACTIVE" | "PENDING" | "REJECTED";
  image: string | null;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const { data: users, error, mutate } = useSWR<User[]>("/api/admin/users", fetcher);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const isLoading = !users && !error;

  const handleAction = async (userId: string, action: "PROMOTE" | "DEMOTE" | "REJECT" | "APPROVE") => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    setLoadingAction(userId);
    try {
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Action failed");
      } else {
        mutate(); // Refresh list
      }
    } catch (err) {
      alert("An unexpected error occurred");
    } finally {
      setLoadingAction(null);
    }
  };

  const filteredUsers = users?.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (session?.user.role !== "ADMIN") {
      return <div className="p-8 text-center text-red-500">Unauthorized Access</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-500" />
            User Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage user roles and access permissions.
          </p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                   <td colSpan={5} className="px-6 py-8 text-center">
                     <div className="animate-pulse flex justify-center text-gray-500">Loading users...</div>
                   </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                     No users found.
                   </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                          {user.image ? (
                            <img src={user.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {user.name?.[0]?.toUpperCase() || "U"}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{user.name || "Unknown"}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === "ADMIN" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                          <ShieldCheckIcon className="h-3 w-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                          <UserIcon className="h-3 w-3" />
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.status === "ACTIVE" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                          Active
                        </span>
                      )}
                      {user.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20">
                          Pending
                        </span>
                      )}
                      {user.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          {loadingAction === user.id ? (
                            <span className="text-xs text-gray-500 animate-pulse flex items-center gap-1">
                              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {/* PENDING Status: Can toggle between Approve/Reject */}
                              {user.status === "PENDING" && (
                                <>
                                  <button 
                                    onClick={() => handleAction(user.id, "APPROVE")}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 transition-all text-xs font-medium shadow-sm hover:shadow"
                                    title="Approve User"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    Approve
                                  </button>
                                  <button 
                                    onClick={() => handleAction(user.id, "REJECT")}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all text-xs font-medium shadow-sm hover:shadow"
                                    title="Reject User"
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                    Reject
                                  </button>
                                </>
                              )}
                              
                              {/* ACTIVE Status: Can set back to PENDING or REJECTED */}
                              {user.status === "ACTIVE" && user.id !== session?.user.id && user.role !== "ADMIN" && (
                                <button 
                                  onClick={() => handleAction(user.id, "REJECT")}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-all text-xs font-medium shadow-sm hover:shadow"
                                  title="Set to Pending (Block temporarily)"
                                >
                                  <ShieldAlert className="h-3.5 w-3.5" />
                                  Reject
                                </button>
                              )}
                              
                              {/* REJECTED Status: Can approve back to PENDING */}
                              {user.status === "REJECTED" && (
                                <button 
                                  onClick={() => handleAction(user.id, "APPROVE")}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 transition-all text-xs font-medium shadow-sm hover:shadow"
                                  title="Set back to Pending"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Approve
                                </button>
                              )}
                              
                              {/* Role Actions: Only for non-admin users */}
                              {user.role !== "ADMIN" && user.status === "ACTIVE" && (
                                <button 
                                  onClick={() => handleAction(user.id, "PROMOTE")}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all text-xs font-medium shadow-sm hover:shadow"
                                  title="Promote to Admin"
                                >
                                  <Shield className="h-3.5 w-3.5" />
                                  Promote
                                </button>
                              )}
                              
                              {/* Admin cannot change other admin's role */}
                              {user.role === "ADMIN" && user.id !== session?.user.id && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 text-xs font-medium cursor-not-allowed"
                                  title="Cannot change admin role"
                                >
                                  <Shield className="h-3.5 w-3.5" />
                                  Admin
                                </span>
                              )}
                            </div>
                          )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ShieldCheckIcon(props: any) {
    return (
        <svg
          {...props}
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
}
