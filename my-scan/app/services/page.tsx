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
  AlertCircle,
  Loader2,
  RefreshCw,
  Package,
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
        `Are you sure you want to delete "${serviceName}" and all its scan history?`
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Services</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your scanned services and view their history
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchServices}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              <Plus size={16} /> New Scan
            </Link>
          </div>
        </div>

        {/* Services Grid */}
        {services.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No services yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start by scanning your first repository
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              <Plus size={16} /> Start Scanning
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => {
              const latestScan = getLatestScanStatus(service);
              const totalVulns = latestScan
                ? latestScan.vulnCritical +
                  latestScan.vulnHigh +
                  latestScan.vulnMedium +
                  latestScan.vulnLow
                : 0;

              return (
                <div
                  key={service.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
                >
                  {/* Service Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {service.serviceName}
                      </h3>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {service.imageName}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleDelete(service.id, service.serviceName)
                      }
                      disabled={deletingId === service.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                      title="Delete service"
                    >
                      {deletingId === service.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>{service._count.scans} scans</span>
                    </div>
                    {latestScan && (
                      <div
                        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          latestScan.status === "SUCCESS"
                            ? "bg-green-100 text-green-700"
                            : latestScan.status === "BLOCKED"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <Shield size={10} />
                        {latestScan.status}
                      </div>
                    )}
                  </div>

                  {/* Vulnerability Summary */}
                  {latestScan && totalVulns > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="text-lg font-bold text-red-600">
                          {latestScan.vulnCritical}
                        </div>
                        <div className="text-[10px] text-red-500">CRITICAL</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="text-lg font-bold text-orange-600">
                          {latestScan.vulnHigh}
                        </div>
                        <div className="text-[10px] text-orange-500">HIGH</div>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 rounded">
                        <div className="text-lg font-bold text-yellow-600">
                          {latestScan.vulnMedium}
                        </div>
                        <div className="text-[10px] text-yellow-500">
                          MEDIUM
                        </div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-lg font-bold text-blue-600">
                          {latestScan.vulnLow}
                        </div>
                        <div className="text-[10px] text-blue-500">LOW</div>
                      </div>
                    </div>
                  )}

                  {latestScan && totalVulns === 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-center">
                      <span className="text-green-700 text-sm font-medium">
                        ✅ No vulnerabilities found
                      </span>
                    </div>
                  )}

                  {!latestScan && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-center">
                      <span className="text-gray-500 text-sm">
                        No scans yet
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/scan/history?serviceId=${service.id}`}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                      <Clock size={14} /> History
                    </Link>
                    {latestScan && (
                      <Link
                        href={`/scan/${latestScan.pipelineId}`}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition"
                      >
                        <ExternalLink size={14} /> Latest
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
