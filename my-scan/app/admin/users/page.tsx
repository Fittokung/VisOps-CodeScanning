"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { 
  Shield, 
  User as UserIcon, 
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  Ban,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";

// Types
interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: "ADMIN" | "user";
  status: "ACTIVE" | "PENDING" | "REJECTED";
  image: string | null;
  createdAt: string;
  maxProjects: number;
  provider: string; 
  stats: {
    projects: number;
    services: number;
    scans: number;
  };
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch");
  }
  return res.json();
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const { data: users, error, mutate } = useSWR<User[]>("/api/admin/users", fetcher);
  
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ADMIN" | "USER" | "PENDING">("ALL");
  const [sortField, setSortField] = useState<keyof User | "stats.projects">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingQuotaId, setEditingQuotaId] = useState<string | null>(null);
  const [quotaValue, setQuotaValue] = useState<number>(6);

  // Handle quota update
  const handleQuotaUpdate = async (userId: string, newQuota: number) => {
    try {
      const res = await fetch("/api/admin/users/quota", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, maxProjects: newQuota }),
      });
      if (!res.ok) throw new Error("Failed to update quota");
      mutate(); // Refresh user list
      setEditingQuotaId(null);
    } catch (err) {
      console.error("Quota update failed:", err);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest('.action-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const isLoading = !users && !error;
  
  // Stats
  const userList = Array.isArray(users) ? users : [];
  const totalAdmins = userList.filter(u => u.role === "ADMIN").length || 0;
  const totalStandard = userList.filter(u => u.role !== "ADMIN").length || 0;

  // Handlers
  const handleSort = (field: keyof User | "stats.projects") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

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

  // Filter & Sort Logic
  const filteredUsers = userList.filter(user => {
    // 1. Search
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower);
    
    if(!matchesSearch) return false;

    // 2. Tab Filter
    if (activeTab === "ALL") return true;
    if (activeTab === "ADMIN") return user.role === "ADMIN";
    if (activeTab === "USER") return user.role !== "ADMIN" && user.status !== "PENDING" && user.status !== "REJECTED";
    if (activeTab === "PENDING") return user.status === "PENDING" || user.status === "REJECTED";

    return true;
  }).sort((a, b) => {
      // 3. Sorting
      let valA: any = a[sortField as keyof User];
      let valB: any = b[sortField as keyof User];

      if (sortField === "stats.projects") {
          valA = a.stats?.projects || 0;
          valB = b.stats?.projects || 0;
      }

      if (valA === valB) return 0;
      
      const comparison = valA > valB ? 1 : -1;
      return sortDirection === "asc" ? comparison : -comparison;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (session?.user.role !== "ADMIN") {
      return <div className="p-8 text-center text-red-500">Unauthorized Access</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            User Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Total {userList.length} users · {totalAdmins} Admins · {totalStandard} Users
          </p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 outline-none transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {[
            { id: "ALL", label: "All Users" },
            { id: "ADMIN", label: "Admins" },
            { id: "USER", label: "Standard" },
            { id: "PENDING", label: "Pending" }
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id 
                    ? "border-black dark:border-white text-black dark:text-white" 
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
            >
                {tab.label}
            </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <SortHeader label="User" field="name" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="w-[30%]" />
                <SortHeader label="Role" field="role" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="w-[10%]" />
                <SortHeader label="Quota" field="stats.projects" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="w-[10%]" />
                <SortHeader label="Status" field="status" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="w-[15%]" />
                <SortHeader label="Joined" field="createdAt" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="w-[15%]" />
                <th className="px-6 py-3 font-medium text-right min-w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                     Loading...
                   </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                     No users found.
                   </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                          {user.image ? (
                            <img src={user.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-xs font-bold text-gray-400">
                              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.name || <span className="text-gray-400 italic">No Name</span>}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${
                         user.role === 'ADMIN' 
                         ? 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200' 
                         : 'bg-white border-gray-200 text-gray-600 dark:bg-transparent dark:border-gray-700 dark:text-gray-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {editingQuotaId === user.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={quotaValue}
                            onChange={(e) => setQuotaValue(Number(e.target.value))}
                            className="w-14 px-1.5 py-0.5 text-xs border border-indigo-300 dark:border-indigo-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleQuotaUpdate(user.id, quotaValue);
                              if (e.key === 'Escape') setEditingQuotaId(null);
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleQuotaUpdate(user.id, quotaValue)}
                            className="text-green-600 hover:text-green-700 text-xs px-1"
                          >✓</button>
                          <button
                            onClick={() => setEditingQuotaId(null)}
                            className="text-gray-400 hover:text-gray-600 text-xs px-1"
                          >✗</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingQuotaId(user.id);
                            setQuotaValue(user.maxProjects);
                          }}
                          className="group flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1.5 py-0.5 -mx-1.5 transition-colors"
                          title="Click to edit quota"
                        >
                          <span className={`text-sm font-medium ${
                            (user.stats?.services || 0) >= user.maxProjects 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {user.stats?.services || 0}
                          </span>
                          <span className="text-xs text-gray-400">/ {user.maxProjects}</span>
                          <span className="text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs">✎</span>
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 action-menu-container relative">

                              {/* Dropdown Menu for Actions */}
                              {user.role === 'ADMIN' || user.id === session?.user.id ? (
                                // Invisible placeholder to keep layout balanced
                                <div className="w-[30px] h-[30px] invisible" aria-hidden="true" />
                              ) : (
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(openMenuId === user.id ? null : user.id);
                                    }}
                                    className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                                    title="More actions"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {/* Dropdown Content */}
                                  {openMenuId === user.id && (
                                    <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150 origin-top-right"
                                      style={{ animation: 'fadeInScale 0.15s ease-out' }}
                                    >
                                      {/* PENDING ACTIONS */}
                                      {user.status === "PENDING" && (
                                        <>
                                          <button
                                            onClick={() => { handleAction(user.id, "APPROVE"); setOpenMenuId(null); }}
                                            className="w-full text-left px-3.5 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2.5 transition-colors"
                                          >
                                            <CheckCircle className="w-4 h-4" />
                                            <div>
                                              <div className="font-medium">Approve</div>
                                              <div className="text-xs text-gray-400 dark:text-gray-500">Grant access to the system</div>
                                            </div>
                                          </button>
                                          <div className="my-1 border-t border-gray-100 dark:border-gray-700/50" />
                                          <button
                                            onClick={() => { handleAction(user.id, "REJECT"); setOpenMenuId(null); }}
                                            className="w-full text-left px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors"
                                          >
                                            <Ban className="w-4 h-4" />
                                            <div>
                                              <div className="font-medium">Reject</div>
                                              <div className="text-xs text-gray-400 dark:text-gray-500">Deny access request</div>
                                            </div>
                                          </button>
                                        </>
                                      )}

                                      {/* ACTIVE ACTIONS */}
                                      {user.status === "ACTIVE" && (
                                        <>
                                          <button
                                            onClick={() => { handleAction(user.id, "PROMOTE"); setOpenMenuId(null); }}
                                            className="w-full text-left px-3.5 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-2.5 transition-colors"
                                          >
                                            <Shield className="w-4 h-4" />
                                            <div>
                                              <div className="font-medium">Promote to Admin</div>
                                              <div className="text-xs text-gray-400 dark:text-gray-500">Grant admin privileges</div>
                                            </div>
                                          </button>
                                          <div className="my-1 border-t border-gray-100 dark:border-gray-700/50" />
                                          <button
                                            onClick={() => { handleAction(user.id, "REJECT"); setOpenMenuId(null); }}
                                            className="w-full text-left px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors"
                                          >
                                            <ShieldAlert className="w-4 h-4" />
                                            <div>
                                              <div className="font-medium">Ban User</div>
                                              <div className="text-xs text-gray-400 dark:text-gray-500">Revoke system access</div>
                                            </div>
                                          </button>
                                        </>
                                      )}

                                      {/* REJECTED ACTIONS */}
                                      {user.status === "REJECTED" && (
                                        <button
                                          onClick={() => { handleAction(user.id, "APPROVE"); setOpenMenuId(null); }}
                                          className="w-full text-left px-3.5 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2.5 transition-colors"
                                        >
                                          <CheckCircle className="w-4 h-4" />
                                          <div>
                                            <div className="font-medium">Unban User</div>
                                            <div className="text-xs text-gray-400 dark:text-gray-500">Restore system access</div>
                                          </div>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              <Link 
                                href={`/admin/users/${user.id}`}
                                className="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 flex items-center gap-1.5 transition-all font-medium shadow-sm"
                              >
                                 Details
                              </Link>
                            </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
             <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="font-medium">{filteredUsers.length}</span> results
             </div>
             <div className="flex items-center gap-2">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                    Previous
                </button>
                <div className="text-sm font-medium">Page {currentPage} of {totalPages || 1}</div>
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                    Next
                </button>
             </div>
        </div>
      </div>

    </div>
  );
}

function SortHeader({ label, field, currentSort, currentDirection, onSort, className }: any) {
    return (
        <th 
            className={`px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none ${className || ''}`}
            onClick={() => onSort(field)}
        >
            <div className="flex items-center gap-1">
                {label}
                {currentSort === field && (
                    <ArrowUpDown className={`w-3 h-3 ${currentDirection === 'asc' ? 'rotate-180' : ''} transition-transform`} />
                )}
            </div>
        </th>
    )
}

function StatusBadge({ status }: { status: string }) {
    if (status === "ACTIVE") return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>Active</span>;
    if (status === "PENDING") return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>Pending</span>;
    if (status === "REJECTED") return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>Banned</span>;
    return <span className="text-xs">{status}</span>;
}
