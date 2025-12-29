"use client";

import { useState, useEffect } from "react";
import { FolderGit2, Server, Globe, ChevronDown, ChevronUp, PlayCircle, Clock, CheckCircle, XCircle, ShieldAlert, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Service = {
  id: string;
  serviceName: string;
  contextPath: string;
  repoUrl?: string; // Add optional prop
  lastScan?: {
    status: string;
    imageTag: string;
    createdAt: string;
    vulnCritical: number;
  };
};

type Group = {
  id: string;
  groupName: string;
  repoUrl: string;
  services: Service[];
};

export default function ProjectDashboard({ userEmail }: { userEmail: string }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/services?email=${userEmail}`)
      .then(res => res.json())
      .then(data => setGroups(data))
      .catch(err => console.error("Failed to load services", err));
  }, [userEmail]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleScanAgain = async (service: Service, groupRepoUrl: string) => {
    setLoadingId(service.id);
    try {
        // ลอง Scan โดยใช้ Token ที่ Backend จำไว้
        const res = await fetch("/api/scan/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                serviceId: service.id,
                imageTag: "latest"
            })
        });

        const data = await res.json();

        if (res.ok && data.pipelineId) {
            router.push(`/scan/${data.pipelineId}`);
        } else if (res.status === 401) {
            // กรณี Token หมดอายุ (401)
            if(confirm("Authentication Failed: Your Git/Docker tokens are expired or invalid.\n\nDo you want to update them now?")) {
               router.push(`/scan/build?repo=${encodeURIComponent(groupRepoUrl)}&serviceId=${service.id}`); 
            }
        } else {
            alert(`Error: ${data.error || "Failed to start scan"}`);
        }
    } catch (error) {
        alert("Network Error");
    } finally {
        setLoadingId(null);
    }
  };

  const getStatusIcon = (status?: string) => {
    if (status === "SUCCESS") return <CheckCircle size={16} className="text-green-500"/>;
    if (status === "FAILED") return <XCircle size={16} className="text-red-500"/>;
    if (status === "BLOCKED") return <ShieldAlert size={16} className="text-red-600"/>;
    return <Clock size={16} className="text-slate-400"/>;
  };

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          <div 
            onClick={() => toggleGroup(group.id)}
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <FolderGit2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{group.groupName}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  {group.repoUrl}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">
                {group.services.length} Services
              </span>
              {expandedGroups.includes(group.id) ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
            </div>
          </div>

          {expandedGroups.includes(group.id) && (
            <div className="border-t border-slate-100 bg-slate-50/50 divide-y divide-slate-100">
              {group.services.map((service) => (
                <div key={service.id} className="p-4 pl-20 flex items-center justify-between hover:bg-white transition">
                  
                  <div className="flex items-center gap-4">
                    {service.contextPath.includes("front") ? <Globe size={20} className="text-purple-500"/> : <Server size={20} className="text-indigo-500"/>}
                    <div>
                      <h4 className="font-semibold text-slate-700">{service.serviceName}</h4>
                      <p className="text-xs text-slate-400 font-mono">Path: {service.contextPath}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 text-sm">
                    <div className="flex flex-col items-end w-24">
                       <span className="text-xs text-slate-400 uppercase">Status</span>
                       <div className="flex items-center gap-1 mt-0.5">
                          {getStatusIcon(service.lastScan?.status)}
                          <span className="text-slate-700 font-medium">{service.lastScan?.status || "Never"}</span>
                       </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScanAgain(service, group.repoUrl);
                      }}
                      disabled={loadingId === service.id}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-600 rounded-lg transition shadow-sm text-sm font-medium disabled:opacity-50"
                    >
                      {loadingId === service.id ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />} 
                      Scan / Update
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {groups.length === 0 && (
        <div className="text-center p-10 text-slate-500 border-2 border-dashed rounded-xl">
           No projects found. Start by creating your first scan.
        </div>
      )}
    </div>
  );
}