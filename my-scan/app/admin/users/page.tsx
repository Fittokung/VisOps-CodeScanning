// app/admin/users/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  UserCheck,
  UserX,
  Search,
  Loader2,
  RotateCcw,
  Shield,
  User as UserIcon,
  Filter,
} from "lucide-react";

export default function ManageUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const { data: session } = useSession(); // ดึงข้อมูล session
  const currentUserId = (session?.user as any)?.id; // เก็บ id ของ admin ที่กำลังใช้งานอยู่

  // useCallback ครอบ fetchUsers เพื่อให้เรียกใช้ซ้ำได้เสถียรขึ้น
  const fetchUsers = useCallback(async (isAutoRefresh = false) => {
    // ถ้าเป็นการ auto refresh ไม่ต้องเซต loading เป็น true เพื่อไม่ให้หน้าจอ flicker
    if (!isAutoRefresh) setLoading(true);

    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      if (!isAutoRefresh) setLoading(false);
    }
  }, []);

  // Timer สำหรับ Auto Refresh
  useEffect(() => {
    // เรียกครั้งแรกตอนโหลดหน้า
    fetchUsers();
    // Refresh ทุกๆ 10 วินาที (10000 ms)
    const interval = setInterval(() => {
      fetchUsers(true); // ส่ง true เพื่อบอกว่าเป็น auto refresh
      console.log("Auto-refreshed users data");
    }, 10000);

    // ล้าง Timer เมื่อออกจากหน้าจอ เพื่อกัน memory leak
    return () => clearInterval(interval);
  }, [fetchUsers]);

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      if (res.ok) {
        // อัปเดตข้อมูลใน UI ทันทีหลังบันทึกสำเร็จ
        fetchUsers();
      }
    } catch (error) {
      alert("Failed to update user status");
    }
  };

  // Logic การกรองข้อมูล (Search + Status Filter)
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || u.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading && users.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2
            className="animate-spin mx-auto text-blue-600 mb-4"
            size={40}
          />
          <p className="text-slate-500 font-medium">Loading users data...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Shield className="text-blue-600 dark:text-blue-400" />
              User Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Review, approve, or block users within the VisScan system.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filter Status */}
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500 appearance-none cursor-pointer text-slate-900 dark:text-white"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Users Table Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="p-5">User Profile</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Access Role</th>
                  <th className="p-5">Setup</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-900/30">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt=""
                                className="w-full h-full rounded-full"
                              />
                            ) : (
                              <UserIcon size={20} />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-200">
                              {user.name || "Unknown User"}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
                              <Search size={12} /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-tight ${
                            user.status === "APPROVED"
                              ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30"
                              : user.status === "PENDING"
                              ? "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30"
                              : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-mono text-xs">
                          {user.role === "admin" ? (
                            <Shield size={14} className="text-purple-500" />
                          ) : null}
                          {user.role}
                        </div>
                      </td>
                      <td className="p-5">
                        <div
                          className={`text-xs font-medium ${
                            user.isSetupComplete
                              ? "text-green-600 dark:text-green-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {user.isSetupComplete ? "Ready" : "Not Started"}
                        </div>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-1">
                          {/* ถ้าเป็นตัวเราเอง or ถ้าคนนั้นเป็น Admin ให้ซ่อนปุ่ม Actions */}
                          {user.id === currentUserId ? (
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              You (Current Admin)
                            </span>
                          ) : user.role === "admin" ? (
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center gap-1">
                              <Shield size={12} /> Admin Colleague
                            </span>
                          ) : (
                            <>
                              {/* ปุ่ม Approve แสดงเมื่อสถานะไม่ใช่ APPROVED */}
                              {user.status !== "APPROVED" && (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(user.id, "APPROVED")
                                  }
                                  className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all active:scale-95"
                                  title="Approve User"
                                >
                                  <UserCheck size={20} />
                                </button>
                              )}

                              {/* ปุ่ม Reject แสดงเมื่อสถานะไม่ใช่ REJECTED */}
                              {user.status !== "REJECTED" && (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(user.id, "REJECTED")
                                  }
                                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-95"
                                  title="Reject/Block User"
                                >
                                  <UserX size={20} />
                                </button>
                              )}

                              {/* ปุ่ม Reset to Pending */}
                              {(user.status === "APPROVED" ||
                                user.status === "REJECTED") && (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(user.id, "PENDING")
                                  }
                                  className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all active:scale-95"
                                  title="Move back to Pending"
                                >
                                  <RotateCcw size={20} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                        <UserIcon size={48} className="opacity-20" />
                        <p className="text-lg font-medium text-slate-500 dark:text-slate-400">No users found</p>
                        <p className="text-sm">
                          Try adjusting your search or filter
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Info */}
          <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex justify-between items-center">
            <p>Showing {filteredUsers.length} total users</p>
            <p>
              Admin: {users.filter((u) => u.role === "admin").length} | Pending:{" "}
              {users.filter((u) => u.status === "PENDING").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
