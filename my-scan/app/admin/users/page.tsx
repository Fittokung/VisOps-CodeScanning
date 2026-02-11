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
  provider: string; // "google" | "credentials"
  stats: {
    projects: number;
    services: number;
    scans: number;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const { data: users, error, mutate } = useSWR<User[]>("/api/admin/users", fetcher);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Tabs: ALL, ADMIN, USER, PENDING
  const [activeTab, setActiveTab] = useState<"ALL" | "ADMIN" | "USER" | "PENDING">("ALL");
  const [selectedUserLogs, setSelectedUserLogs] = useState<any[] | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const isLoading = !users && !error;
  
  // Calculate stats
  const totalAdmins = users?.filter(u => u.role === "ADMIN").length || 0;
  const totalStandard = users?.filter(u => u.role !== "ADMIN").length || 0;

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

  const handleViewScans = async (user: User) => {
    setViewingUser(user);
    setLoadingLogs(true);
    setSelectedUserLogs(null);
    try {
        const res = await fetch(`/api/admin/users/${user.id}/scans`);
        if(res.ok) {
            const data = await res.json();
            setSelectedUserLogs(data);
        } else {
            alert("Failed to fetch scan history");
        }
    } catch (error) {
        console.error(error);
        alert("Error fetching scan history");
    } finally {
        setLoadingLogs(false);
    }
  };

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if(!matchesSearch) return false;

    if (activeTab === "ALL") return true;
    if (activeTab === "ADMIN") return user.role === "ADMIN";
    if (activeTab === "USER") return user.role !== "ADMIN" && user.status !== "PENDING" && user.status !== "REJECTED";
    if (activeTab === "PENDING") return user.status === "PENDING" || user.status === "REJECTED";

    return true;
  }) || [];

  if (session?.user.role !== "admin") {
      return <div className="p-8 text-center text-red-500">Unauthorized Access</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            User Management
            {users && (
              <div className="flex items-center gap-2 ml-2">
                 <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium border border-gray-200 dark:border-gray-700">
                    Total: {users.length}
                 </span>
                 <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium border border-indigo-200 dark:border-indigo-800">
                    Admins: {totalAdmins}
                 </span>
                 <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium border border-blue-200 dark:border-blue-800">
                    Users: {totalStandard}
                 </span>
              </div>
            )}
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

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800">
        {[
            { id: "ALL", label: "All Users" },
            { id: "ADMIN", label: "Admins" },
            { id: "USER", label: "Standard Users" },
            { id: "PENDING", label: "Pending / Banned" }
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id 
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" 
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
            >
                {tab.label}
            </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Login Via</th>
                <th className="px-6 py-4">Usage</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                   <td colSpan={7} className="px-6 py-8 text-center">
                     <div className="animate-pulse flex justify-center text-gray-500">Loading users...</div>
                   </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                   <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                     No users found in this category.
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
                        <div className="flex items-center gap-2" title={user.provider}>
                             {user.provider === "google" ? (
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                     <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                     <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                     <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                     <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                             ) : (
                                <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                     <ShieldCheckIcon className="h-3 w-3 text-gray-500" />
                                </div>
                             )}
                             <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{user.provider}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs">
                           <span className="text-gray-900 dark:text-white font-medium">
                              {user.stats?.projects || 0} Projects
                           </span>
                           <span className="text-gray-500">
                              {user.stats?.scans || 0} Scans
                           </span>
                        </div>
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
                          <button
                            onClick={() => handleViewScans(user)}
                            className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1"
                          >
                            <Shield className="w-3 h-3" /> Scans
                          </button>
                          
                          {loadingAction === user.id ? (
                            <span className="text-xs text-gray-500 animate-pulse">Processing...</span>
                          ) : (
                            <>  
                                <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
                                {user.role !== "ADMIN" && user.status !== "REJECTED" && (
                                    <button 
                                        onClick={() => handleAction(user.id, "PROMOTE")}
                                        className="text-xs px-2 py-1 rounded border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                                        title="Promote to Admin"
                                    >
                                        Promote
                                    </button>
                                )}
                                {user.role === "ADMIN" && user.id !== session?.user.id && ( // Prevent self-demotion
                                    <button 
                                        onClick={() => handleAction(user.id, "DEMOTE")}
                                        className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        title="Demote to User"
                                    >
                                        Demote
                                    </button>
                                )}
                                {user.status === "REJECTED" ? (
                                    <button 
                                        onClick={() => handleAction(user.id, "APPROVE")}
                                        className="text-xs px-2 py-1 rounded border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors"
                                        title="Re-activate User"
                                    >
                                        Approve
                                    </button>
                                ) : (
                                    user.id !== session?.user.id && (
                                        <button 
                                            onClick={() => handleAction(user.id, "REJECT")}
                                            className="text-xs px-2 py-1 rounded border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                            title="Ban User"
                                        >
                                            Ban
                                        </button>
                                    )
                                )}
                            </>
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

      {/* LOGS MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <Shield className="w-5 h-5 text-indigo-500" />
                        Scan History: {viewingUser.name}
                    </h3>
                    <button 
                        onClick={() => { setViewingUser(null); setSelectedUserLogs(null); }}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        Close
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 dark:bg-black/20">
                    {loadingLogs ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                             <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-2"></div>
                             Loading history...
                        </div>
                    ) : !selectedUserLogs || selectedUserLogs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            No scan history found for this user.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {selectedUserLogs.map((log: any) => (
                                <div key={log.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                            {log.service.serviceName}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                                log.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                log.status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                                {log.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {new Date(log.createdAt).toLocaleString()} · Tag: {log.imageTag}
                                        </div>
                                    </div>
                                    <div className="text-right text-xs">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-red-500 font-medium">{log.vulnCritical} Crit</span>
                                            <span className="text-orange-500">{log.vulnHigh} High</span>
                                        </div>
                                        <a 
                                            href={`/scan/${log.id}`} 
                                            target="_blank"
                                            className="text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            View Report
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
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
