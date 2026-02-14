"use client";

import { useState, useEffect } from "react";
import {
  FolderGit2,
  Server,
  Globe,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Loader2,
  History,
  Eye,
  Plus,
  Trash2,
  Edit2,
  GitCompare,
  GitBranch,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AddServiceDialog from "./AddServiceDialog";
import { getStatusIcon } from "./ui/StatusBadge";
import { TiltCard } from "@/components/ui/TiltCard";

type Service = {
  id: string;
  serviceName: string;
  contextPath: string;
  repoUrl?: string;
  lastScan?: {
    id: string;
    pipelineId: string;
    status: string;
    imageTag: string;
    createdAt: string;
    vulnCritical: number;
    imagePushed?: boolean; // [NEW]
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
  const [addServiceDialogOpen, setAddServiceDialogOpen] = useState<
    string | null
  >(null);
  const [editingGroup, setEditingGroup] = useState<{
    id: string;
    groupName: string;
    repoUrl: string;
  } | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/services?email=${userEmail}`)
      .then((res) => res.json())
      .then((data) => setGroups(data))
      .catch((err) => console.error("Failed to load services", err));
  }, [userEmail]);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleScanAgain = async (service: Service, groupRepoUrl: string) => {
    setLoadingId(service.id);
    try {
      const res = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          imageTag: "latest",
        }),
      });

      const data = await res.json();

      if (res.ok && data.pipelineId) {
        // Store intent to compare after scan completes
        if (service.lastScan) {
          sessionStorage.setItem(
            `compare_after_scan_${data.pipelineId}`,
            service.id
          );
        }
        router.push(`/scan/${data.pipelineId}`);
      } else if (res.status === 401) {
        if (
          confirm(
            "Authentication Failed: Your Git/Docker tokens are expired or invalid.\n\nDo you want to update them now?"
          )
        ) {
          router.push(
            `/scan/build?repo=${encodeURIComponent(groupRepoUrl)}&serviceId=${
              service.id
            }`
          );
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

  const handleViewHistory = (serviceId: string) => {
    router.push(`/scan/history?serviceId=${serviceId}`);
  };

  const handleViewScan = (pipelineId: string) => {
    if (pipelineId) {
      router.push(`/scan/${pipelineId}`);
    }
  };

  const handleCompare = (serviceId: string) => {
    router.push(`/scan/compare?serviceId=${serviceId}`);
  };

  const handleDeleteProject = async (groupId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingGroup(groupId);
    try {
      const res = await fetch(`/api/projects/${groupId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceStop: true }),
      });

      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
        alert("Project deleted successfully");
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "Failed to delete project"}`);
      }
    } catch (error) {
      alert("Network Error");
    } finally {
      setDeletingGroup(null);
    }
  };

  const handleUpdateProject = async (
    groupId: string,
    groupName: string,
    repoUrl: string
  ) => {
    try {
      const res = await fetch(`/api/projects/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName, repoUrl }),
      });

      if (res.ok) {
        setGroups((prev) =>
          prev.map((g) => (g.id === groupId ? { ...g, groupName, repoUrl } : g))
        );
        setEditingGroup(null);
        alert("Project updated successfully");
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "Failed to update project"}`);
      }
    } catch (error) {
      alert("Network Error");
    }
  };

  // Use shared getStatusIcon from StatusBadge

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <TiltCard
          key={group.id}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 flex items-center justify-between border-b border-slate-100">
            <div
              onClick={() => toggleGroup(group.id)}
              className="flex items-center gap-4 flex-1 cursor-pointer hover:bg-slate-50 transition -m-2 p-2 rounded-lg"
            >
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <FolderGit2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {group.groupName}
                </h3>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <GitBranch size={14} />
                  {group.repoUrl}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">
                  {group.services.length} Services
                </span>
                {expandedGroups.includes(group.id) ? (
                  <ChevronUp size={20} className="text-slate-400" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400" />
                )}
              </div>
            </div>

            {/* Project Actions */}
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingGroup({
                    id: group.id,
                    groupName: group.groupName,
                    repoUrl: group.repoUrl,
                  });
                }}
                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Edit project"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAddServiceDialogOpen(group.id);
                }}
                className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                title="Add service"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(group.id);
                }}
                disabled={deletingGroup === group.id}
                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                title="Delete project"
              >
                {deletingGroup === group.id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </div>
          </div>

          {expandedGroups.includes(group.id) && (
            <div className="border-t border-slate-100 bg-slate-50/50 divide-y divide-slate-100">
              {group.services.map((service) => (
                <div
                  key={service.id}
                  className="p-4 pl-20 flex items-center justify-between hover:bg-white transition"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {service.contextPath.includes("front") ? (
                      <Globe size={20} className="text-purple-500" />
                    ) : (
                      <Server size={20} className="text-indigo-500" />
                    )}
                    <div>
                      <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                        {service.serviceName}
                        {service.lastScan?.imagePushed && (
                          <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold border border-emerald-200">
                             🚀 Deployed
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        Path: {service.contextPath}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex flex-col items-end w-28">
                      <span className="text-xs text-slate-400 uppercase">
                        Status
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {getStatusIcon(service.lastScan?.status || 'PENDING')}
                        <span className="text-slate-700 font-medium whitespace-nowrap">
                          {service.lastScan?.status || "Never"}
                        </span>
                      </div>
                    </div>

                    {/* Service Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewHistory(service.id);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:border-purple-500 hover:text-purple-600 text-slate-600 rounded-lg transition shadow-sm text-sm font-medium"
                        title="View scan history"
                      >
                        <History size={16} />
                        History
                      </button>

                      {service.lastScan?.pipelineId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewScan(service.lastScan!.pipelineId);
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-600 rounded-lg transition shadow-sm text-sm font-medium"
                          title="View latest scan details"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompare(service.id);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 text-slate-600 rounded-lg transition shadow-sm text-sm font-medium"
                        title="Compare scans"
                      >
                        <GitCompare size={16} />
                        Compare
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScanAgain(service, group.repoUrl);
                        }}
                        disabled={loadingId === service.id}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition shadow-sm text-sm font-medium disabled:opacity-50"
                        title="Re-scan project"
                      >
                        {loadingId === service.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <PlayCircle size={16} />
                        )}
                        Re-scan
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TiltCard>
      ))}

      {groups.length === 0 && (
        <div className="text-center p-10 text-slate-500 border-2 border-dashed rounded-xl">
          No projects found. Start by creating your first scan.
        </div>
      )}

      {/* Edit Project Dialog */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              Edit Project
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={editingGroup.groupName}
                  onChange={(e) =>
                    setEditingGroup({
                      ...editingGroup,
                      groupName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Repository URL
                </label>
                <input
                  type="text"
                  value={editingGroup.repoUrl}
                  onChange={(e) =>
                    setEditingGroup({
                      ...editingGroup,
                      repoUrl: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingGroup(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleUpdateProject(
                    editingGroup.id,
                    editingGroup.groupName,
                    editingGroup.repoUrl
                  )
                }
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Dialog */}
      {addServiceDialogOpen && (
        <AddServiceDialog
          groupId={addServiceDialogOpen}
          repoUrl={
            groups.find((g) => g.id === addServiceDialogOpen)?.repoUrl || ""
          }
          onClose={() => {
            setAddServiceDialogOpen(null);
            // Refresh the groups list
            fetch(`/api/services?email=${userEmail}`)
              .then((res) => res.json())
              .then((data) => setGroups(data))
              .catch((err) => console.error("Failed to load services", err));
          }}
        />
      )}
    </div>
  );
}
