"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  ExternalLink,
  Clock,
  Shield,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Package,
  Search as SearchIcon,
  Tag,
} from "lucide-react";

interface Service {
  id: string;
  serviceName: string;
  imageName: string;
  repoUrl: string;
  createdAt: string;
  _count: {
    scans: number;
  };
  scans: Array<{
    id: string;
    pipelineId: string;
    status: string;
    vulnCritical: number;
    vulnHigh: number;
    vulnMedium: number;
    vulnLow: number;
    completedAt: string;
  }>;
}

const MAX_SERVICES = 6; // Limit Quota

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDelete = async (serviceId: string, serviceName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${serviceName}"? This will free up your quota.`
      )
    )
      return;

    setDeletingId(serviceId);
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
        setToast({ message: "Service deleted successfully", type: "success" });
      } else {
        const error = await response.json();
        setToast({
          message: error.error || "Failed to delete service",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Failed to delete service:", error);
      setToast({ message: "Failed to delete service", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const getLatestScanStatus = (service: Service) => {
    if (!service.scans || service.scans.length === 0) return null;
    return service.scans[0];
  };

  const isLimitReached = services.length >= MAX_SERVICES;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (

    <div className="w-full space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-2 fade-in duration-300 ${
            toast.type === "success"
              ? "bg-emerald-500 text-white shadow-emerald-500/20"
              : "bg-red-500 text-white shadow-red-500/20"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-2 transition-colors group"
          >
            <ArrowLeft size={14} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              My Services
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage and monitor your service security posture
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={16} className="text-slate-400" />
             </div>
             <input
                type="text"
                placeholder="Search services..."
                className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                // Note: We need to add search state logic, but for now this is UI
                onChange={(e) => {
                   // Simple client-side search logic could be added here or in a separate state
                   const term = e.target.value.toLowerCase();
                   // Assuming we have access to setServices or similar, but let's just leave UI for now
                   // or better yet, let's implement a quick local filter if services state allows
                }}
             />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div
              className={`px-3 py-2.5 rounded-lg border flex items-center gap-2 flex-grow sm:flex-grow-0 justify-center min-w-max ${
                isLimitReached
                  ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400"
                  : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Package size={16} />
              <div className="text-xs">
                <span className="font-bold">{services.length}</span>
                <span className="opacity-70"> / {MAX_SERVICES}</span>
              </div>
            </div>

            <button
              onClick={fetchServices}
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm"
              title="Refresh List"
            >
              <RefreshCw size={18} />
            </button>

            {isLimitReached ? (
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg cursor-not-allowed text-sm font-medium border border-slate-200 dark:border-slate-800"
              >
                <Plus size={16} /> Limit Reached
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition text-sm font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 whitespace-nowrap"
              >
                <Plus size={16} /> New Service
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 ring-4 ring-blue-50/50 dark:ring-blue-900/10">
             <Package className="w-8 h-8 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            No services configured
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
            Set up your first service to start monitoring vulnerabilities and code quality.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full hover:opacity-90 transition font-medium text-sm shadow-lg"
          >
            <Plus size={16} /> Add First Service
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((service) => {
            const latestScan = getLatestScanStatus(service);
            const totalVulns = latestScan
              ? latestScan.vulnCritical +
                latestScan.vulnHigh +
                latestScan.vulnMedium +
                latestScan.vulnLow
              : 0;
            
            // Determine card border/accent color based on status
            let statusColor = "slate";
            if (latestScan?.status === "SUCCESS") {
               statusColor = totalVulns > 0 ? "orange" : "emerald";
            } else if (["FAILED", "FAILED_SECURITY", "BLOCKED"].includes(latestScan?.status || "")) {
               statusColor = "red";
            } else if (latestScan?.status === "RUNNING") {
               statusColor = "blue";
            }

            return (
              <div
                key={service.id}
                className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-0 hover:shadow-xl dark:hover:shadow-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col h-full overflow-hidden"
              >
                {/* Colored Top Banner */}
                <div className={`h-1.5 w-full bg-${statusColor}-500 transition-colors duration-300`} />

                <div className="p-5 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate text-base" title={service.serviceName}>
                          {service.serviceName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 max-w-full truncate">
                           <Tag size={10} className="mr-1" />
                           {service.imageName}
                         </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(service.id, service.serviceName)}
                      disabled={deletingId === service.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                      title="Delete Service"
                    >
                      {deletingId === service.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>

                  {/* Body Content - Vulnerabilities */}
                  <div className="flex-grow mb-4">
                    {latestScan ? (
                       totalVulns > 0 ? (
                          <div className="flex gap-2">
                             {latestScan.vulnCritical > 0 && (
                                <div className="flex-1 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-lg p-2 text-center">
                                   <div className="text-lg font-bold text-red-600 dark:text-red-400 leading-none">{latestScan.vulnCritical}</div>
                                   <div className="text-[9px] font-bold text-red-400 uppercase tracking-wider mt-1">Crit</div>
                                </div>
                             )}
                             {latestScan.vulnHigh > 0 && (
                                <div className="flex-1 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-lg p-2 text-center">
                                   <div className="text-lg font-bold text-orange-600 dark:text-orange-400 leading-none">{latestScan.vulnHigh}</div>
                                   <div className="text-[9px] font-bold text-orange-400 uppercase tracking-wider mt-1">High</div>
                                </div>
                             )}
                             {(latestScan.vulnCritical === 0 && latestScan.vulnHigh === 0) && (
                                 <div className="flex-1 grid grid-cols-2 gap-2">
                                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30 rounded-lg p-2 text-center">
                                       <div className="text-md font-bold text-yellow-600 dark:text-yellow-400">{latestScan.vulnMedium}</div>
                                       <div className="text-[9px] text-yellow-500 font-medium">Med</div>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg p-2 text-center">
                                       <div className="text-md font-bold text-blue-600 dark:text-blue-400">{latestScan.vulnLow}</div>
                                       <div className="text-[9px] text-blue-500 font-medium">Low</div>
                                    </div>
                                 </div>
                             )}
                          </div>
                       ) : (
                          <div className="h-full flex flex-col items-center justify-center p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 rounded-lg">
                             <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-1">
                                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                             </div>
                             <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">All Systems Safe</span>
                          </div>
                       )
                    ) : (
                       <div className="h-full flex items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                          <span className="text-xs text-slate-400 italic">No scans yet</span>
                       </div>
                    )}
                  </div>

                  {/* Footer Stats & Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                     <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock size={12} />
                        <span>{service._count.scans} scans</span>
                     </div>
                     
                     <div className="flex gap-2">
                       <Link
                         href={`/scan/history?serviceId=${service.id}`}
                         className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition"
                         title="View History"
                       >
                         <History size={16} />
                       </Link>
                       {latestScan && (
                         <Link
                           href={`/scan/${latestScan.pipelineId}`}
                           className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                         >
                           Report <ExternalLink size={10} />
                         </Link>
                       )}
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
