"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";
import { 
  User, Mail, Calendar, Shield, Activity, 
  GitBranch, Server, Box, AlertTriangle, CheckCircle, XCircle, Clock, FileCode
} from "lucide-react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserDockerEditorModal } from "@/components/admin/UserDockerEditorModal";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UserDetailsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const { data: user, error } = useSWR(userId ? `/api/admin/users/${userId}` : null, fetcher);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "PROJECTS" | "SCANS">("OVERVIEW");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedServiceName, setSelectedServiceName] = useState<string>("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  if (error) return <div className="p-8 text-center text-red-500">Failed to load user</div>;
  if (!user) return <div className="p-8 text-center text-gray-500">Loading user details...</div>;
  if (user.error) return <div className="p-8 text-center text-red-500">{user.error}</div>;

  const totalProjects = user.stats?.projects || 0;
  const totalServices = user.stats?.services || 0;
  
  // Calculate scan stats
  const allScans = user.groups?.flatMap((g: any) => g.services.flatMap((s: any) => s.scans)) || [];
  const totalScans = allScans.length;
  const failedScans = allScans.filter((s: any) => s.status === "FAILED").length;
  const criticalVulns = allScans.reduce((acc: number, s: any) => acc + (s.vulnCritical || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header / Breadcrumb */}
      <button 
        onClick={() => router.back()} 
        className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 flex items-center gap-1 mb-4"
      >
        ← Back to Users
      </button>

      {/* User Profile Card */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
          {user.image ? (
            <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-gray-400">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
            </span>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.name || user.email || "Unknown User"}
             </h1>
             <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                user.role === "ADMIN" 
                ? "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
             }`}>
                {user.role}
             </span>
             <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                user.status === "ACTIVE" 
                ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
             }`}>
                {user.status}
             </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
             <div className="flex items-center gap-1.5">
                {user.email}
             </div>
             <div className="flex items-center gap-1.5 text-gray-400">
                |
             </div>
             <div className="flex items-center gap-1.5">
                Joined {new Date(user.createdAt).toLocaleDateString()}
             </div>
             <div className="flex items-center gap-1.5 text-gray-400">
                |
             </div>
             <div className="flex items-center gap-1.5 capitalize">
                {user.provider} Login
             </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 flex gap-6">
        {["OVERVIEW", "PROJECTS", "SCANS"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
              ? "border-gray-900 text-gray-900 dark:border-white dark:text-white"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* OVERVIEW TAB */}
        {activeTab === "OVERVIEW" && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
             <StatCard label="Total Projects" value={totalProjects} />
             <StatCard label="Active Services" value={totalServices} />
             <StatCard label="Total Scans" value={totalScans} />
             <StatCard label="Failed Scans" value={failedScans} />
             <StatCard label="Critical Vulns" value={criticalVulns} />
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === "PROJECTS" && (
          <div className="space-y-4">
            {user.groups?.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No projects found.</div>
            ) : (
                user.groups?.map((group: any) => (
                    <div key={group.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                            <div className="font-medium text-gray-900 dark:text-white">
                                {group.groupName}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ${group.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600'}`}>
                                {group.isActive ? 'Active' : 'Archived'}
                            </span>
                        </div>
                        <div className="p-2">
                            {group.services?.map((service: any) => (
                                <div key={service.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded transition-colors group">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                            {service.serviceName}
                                            {service.useCustomDockerfile && (
                                                <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                                                    Custom Dockerfile
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">{service.imageName || "No image"}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500">Last Scan</div>
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {service.lastScanAt ? new Date(service.lastScanAt).toLocaleDateString() : "-"}
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => {
                                                setSelectedServiceId(service.id);
                                                setSelectedServiceName(service.serviceName);
                                                setIsEditorOpen(true);
                                            }}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                                            title="Edit Dockerfile"
                                        >
                                            <FileCode className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
          </div>
        )}

        {/* SCANS TAB */}
        {activeTab === "SCANS" && (
           <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-700 dark:text-gray-300">
                    <tr>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Scan ID</th>
                        <th className="px-6 py-3 font-medium">Issues</th>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 text-right font-medium">Report</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {allScans.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8">No scan history available.</td></tr>
                    ) : (
                        allScans.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((scan: any) => (
                            <tr key={scan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                <td className="px-6 py-3">
                                    <StatusBadge status={scan.status} />
                                </td>
                                <td className="px-6 py-3 text-gray-900 dark:text-white">
                                    #{scan.id.slice(0,8)}
                                </td>
                                <td className="px-6 py-3">
                                    {scan.vulnCritical > 0 ? (
                                        <span className="text-red-500 font-bold">
                                            {scan.vulnCritical} Critical
                                        </span>
                                    ) : (
                                        <span className="text-green-500">
                                            Safe
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-3">
                                    {new Date(scan.createdAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <a href={`/scan/${scan.id}`} target="_blank" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">View</a>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
              </table>
           </div>
        )}

      </div>
      
      <UserDockerEditorModal 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)} 
        serviceId={selectedServiceId}
        serviceName={selectedServiceName}
      />
    </div>
  );
}


function StatCard({ label, value }: any) {
    return (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    if (status === "COMPLETED" || status === "SUCCESS") return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">Success</span>;
    if (status === "FAILED") return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">Failed</span>;
    if (status === "RUNNING") return <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 animate-pulse">Running</span>;
    return <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">{status}</span>;
}
