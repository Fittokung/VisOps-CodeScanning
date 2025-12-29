"use client";

import { useEffect, useState } from "react";
import { Trash2, Server, Loader2, ArrowLeft, UserCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

type ServiceItem = {
  id: string;
  serviceName: string;
  imageName: string;
  group: {
    groupName: string;
    repoUrl: string;
    userEmail: string;
  };
};

export default function ServicesPage() {
  // ✅ ใช้ State จำลอง User Session (ในระบบจริงค่านี้จะมาจาก Auth Provider)
  const [currentUserEmail, setCurrentUserEmail] = useState("user@example.com");
  
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/services", {
          // ✅ ส่ง Email ไปบอก Backend ว่า "ฉันคือใคร"
          headers: { "x-user-email": currentUserEmail }
      });
      if (res.ok) {
        setServices(await res.json());
      } else {
        setServices([]); // ถ้า Unauthorized ก็ไม่โชว์อะไร
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete service "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/services/${id}`, { 
          method: "DELETE",
          // ✅ ส่ง Email ไปยืนยันตอนลบด้วย
          headers: { "x-user-email": currentUserEmail }
      });
      
      if (res.ok) {
        setServices(prev => prev.filter(s => s.id !== id));
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error}`);
      }
    } catch (e) {
        alert("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  // โหลดข้อมูลใหม่เมื่อเปลี่ยน User
  useEffect(() => {
    fetchServices();
  }, [currentUserEmail]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Server className="text-blue-600"/> Service Manager
                </h1>
                <p className="text-slate-500 text-sm">Manage your registered services (Quota: 6 Max).</p>
            </div>
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
                <ArrowLeft size={16}/> Back to Scan
            </Link>
        </div>

        {/* 🔐 Simulator: จำลองการ Login */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600 font-medium whitespace-nowrap">
                <UserCircle size={20}/> Identity:
            </div>
            <input 
                type="email" 
                value={currentUserEmail}
                onChange={(e) => setCurrentUserEmail(e.target.value)}
                className="border px-3 py-1.5 rounded-md text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter your email..."
            />
            <div className="text-xs text-slate-400">
                (Try: <b>admin@example.com</b> to delete all, or your email)
            </div>
        </div>

        {/* Table */}
        {loading ? (
           <div className="text-center p-10"><Loader2 className="animate-spin mx-auto text-slate-400"/></div>
        ) : (
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr>
                        <th className="p-4">Owner / Repo</th>
                        <th className="p-4">Service Name</th>
                        <th className="p-4">Docker Image</th>
                        <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {services.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 group">
                            <td className="p-4">
                                <div className="font-medium text-slate-900">{item.group.groupName}</div>
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                    <UserCircle size={10}/> {item.group.userEmail}
                                </div>
                            </td>
                            <td className="p-4 font-mono font-medium text-blue-700">
                                {item.serviceName}
                            </td>
                            <td className="p-4 text-slate-600 font-mono text-xs">
                                {item.imageName}
                            </td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => handleDelete(item.id, item.serviceName)}
                                    disabled={deletingId === item.id}
                                    title={currentUserEmail === item.group.userEmail || currentUserEmail === "admin@example.com" ? "Delete" : "You are not the owner"}
                                    className={`p-2 rounded transition 
                                        ${deletingId === item.id ? "text-slate-400" : "text-slate-400 hover:text-red-600 hover:bg-red-50"}
                                    `}
                                >
                                    {deletingId === item.id ? <Loader2 size={18} className="animate-spin"/> : <Trash2 size={18}/>}
                                </button>
                            </td>
                        </tr>
                    ))}
                    {services.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">
                            No services found for <b>{currentUserEmail}</b>
                        </td></tr>
                    )}
                </tbody>
              </table>
           </div>
        )}
        
        <div className="mt-4 text-right text-xs text-slate-400">
            Current Quota Usage: {services.length} / 6
        </div>
      </div>
    </div>
  );
}