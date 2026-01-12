"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  GitBranch,
  Server,
  ChevronDown,
  ChevronUp,
  FolderTree,
  Tag,
  Box,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

// Types
interface ServiceConfig {
  id: string;
  serviceName: string;
  contextPath: string;
  imageName: string;
  imageTag: string;
  customDockerfile?: string;
  isExpanded: boolean;
}

interface MonorepoState {
  repoUrl: string;
  groupName: string;
  isPrivate: boolean;
  services: ServiceConfig[];
  isSubmitting: boolean;
}

// Context for state management
const MonorepoContext = createContext<{
  state: MonorepoState;
  setRepoUrl: (url: string) => void;
  setGroupName: (name: string) => void;
  setIsPrivate: (value: boolean) => void;
  addService: () => void;
  removeService: (id: string) => void;
  updateService: (id: string, updates: Partial<ServiceConfig>) => void;
  toggleServiceExpand: (id: string) => void;
  submit: () => Promise<void>;
} | null>(null);

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper to extract repo name from URL
const extractRepoName = (url: string): string => {
  if (!url) return "";
  const cleanUrl = url.trim().replace(/\.git$/, "");
  const parts = cleanUrl.split(/[\/:]/);
  return (
    parts[parts.length - 1]?.toLowerCase().replace(/[^a-z0-9-]/g, "") || ""
  );
};

// Generate image name from repo + context
const generateImageName = (repoUrl: string, contextPath: string): string => {
  const repoName = extractRepoName(repoUrl);
  if (contextPath && contextPath !== ".") {
    const suffix = contextPath
      .replace(/\//g, "-")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
    return `${repoName}-${suffix}`;
  }
  return repoName;
};

function MonorepoProvider({
  children,
  initialRepoUrl = "",
}: {
  children: React.ReactNode;
  initialRepoUrl?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<MonorepoState>({
    repoUrl: initialRepoUrl,
    groupName: extractRepoName(initialRepoUrl),
    isPrivate: false,
    services: [
      {
        id: generateId(),
        serviceName: "",
        contextPath: "",
        imageName: "",
        imageTag: "latest",
        isExpanded: true,
      },
    ],
    isSubmitting: false,
  });

  const setRepoUrl = useCallback((url: string) => {
    setState((prev) => ({
      ...prev,
      repoUrl: url,
      groupName: prev.groupName || extractRepoName(url),
    }));
  }, []);

  const setGroupName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, groupName: name }));
  }, []);

  const setIsPrivate = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, isPrivate: value }));
  }, []);

  const addService = useCallback(() => {
    setState((prev) => ({
      ...prev,
      services: [
        ...prev.services.map((s) => ({ ...s, isExpanded: false })),
        {
          id: generateId(),
          serviceName: "",
          contextPath: "",
          imageName: "",
          imageTag: "latest",
          isExpanded: true,
        },
      ],
    }));
  }, []);

  const removeService = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== id),
    }));
  }, []);

  const updateService = useCallback(
    (id: string, updates: Partial<ServiceConfig>) => {
      setState((prev) => ({
        ...prev,
        services: prev.services.map((s) => {
          if (s.id !== id) return s;
          const updated = { ...s, ...updates };
          // Auto-generate image name if contextPath changes
          if (updates.contextPath !== undefined && !s.imageName) {
            updated.imageName = generateImageName(
              prev.repoUrl,
              updates.contextPath
            );
          }
          return updated;
        }),
      }));
    },
    []
  );

  const toggleServiceExpand = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      services: prev.services.map((s) => ({
        ...s,
        isExpanded: s.id === id ? !s.isExpanded : s.isExpanded,
      })),
    }));
  }, []);

  const submit = useCallback(async () => {
    // Validation
    if (!state.repoUrl) {
      alert("Please enter a repository URL");
      return;
    }
    if (!state.groupName) {
      alert("Please enter a group name");
      return;
    }
    if (state.services.length === 0) {
      alert("Please add at least one service");
      return;
    }
    for (const service of state.services) {
      if (!service.serviceName) {
        alert(`Please enter a service name for all services`);
        return;
      }
    }

    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      // Create all services in sequence
      const createdServices: string[] = [];

      for (const [index, service] of state.services.entries()) {
        const response = await fetch("/api/projects/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isNewGroup: index === 0,
            groupName: state.groupName,
            repoUrl: state.repoUrl,
            isPrivate: state.isPrivate,
            serviceName: service.serviceName,
            contextPath: service.contextPath || ".",
            imageName:
              service.imageName ||
              generateImageName(state.repoUrl, service.contextPath),
            customDockerfile: service.customDockerfile,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.message || `Failed to create service ${service.serviceName}`
          );
        }

        const data = await response.json();
        createdServices.push(data.serviceId);
      }

      // Start scans for all services
      for (const serviceId of createdServices) {
        await fetch("/api/scan/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId,
            scanMode: "SCAN_AND_BUILD",
            imageTag:
              state.services.find((s) => s.id === serviceId)?.imageTag ||
              "latest",
          }),
        });
      }

      // Navigate to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [state, router]);

  return (
    <MonorepoContext.Provider
      value={{
        state,
        setRepoUrl,
        setGroupName,
        setIsPrivate,
        addService,
        removeService,
        updateService,
        toggleServiceExpand,
        submit,
      }}
    >
      {children}
    </MonorepoContext.Provider>
  );
}

function useMonorepo() {
  const context = useContext(MonorepoContext);
  if (!context) {
    throw new Error("useMonorepo must be used within MonorepoProvider");
  }
  return context;
}

// Service Card Component
function ServiceCard({
  service,
  index,
}: {
  service: ServiceConfig;
  index: number;
}) {
  const { state, updateService, removeService, toggleServiceExpand } =
    useMonorepo();

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Card Header */}
      <button
        type="button"
        onClick={() => toggleServiceExpand(service.id)}
        className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
            {index + 1}
          </div>
          <div className="text-left">
            <p className="font-medium text-slate-800">
              {service.serviceName || `Service ${index + 1}`}
            </p>
            <p className="text-xs text-slate-500">
              {service.contextPath || "Root directory"}
            </p>
          </div>
          {service.serviceName && service.contextPath && (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {state.services.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeService(service.id);
              }}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {service.isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Card Body */}
      {service.isExpanded && (
        <div className="p-4 space-y-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Service Name *
              </label>
              <input
                type="text"
                value={service.serviceName}
                onChange={(e) =>
                  updateService(service.id, { serviceName: e.target.value })
                }
                placeholder="e.g., backend, frontend, api"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Build Directory
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">/</span>
                <input
                  type="text"
                  value={service.contextPath}
                  onChange={(e) =>
                    updateService(service.id, { contextPath: e.target.value })
                  }
                  placeholder="e.g., services/backend"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                <Box className="w-3.5 h-3.5" />
                Image Name
              </label>
              <input
                type="text"
                value={service.imageName}
                onChange={(e) =>
                  updateService(service.id, { imageName: e.target.value })
                }
                placeholder={
                  generateImageName(state.repoUrl, service.contextPath) ||
                  "auto-generated"
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />
                Image Tag
              </label>
              <input
                type="text"
                value={service.imageTag}
                onChange={(e) =>
                  updateService(service.id, { imageTag: e.target.value })
                }
                placeholder="latest"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Wizard Component
export default function MonorepoWizard({
  initialRepoUrl = "",
}: {
  initialRepoUrl?: string;
}) {
  return (
    <MonorepoProvider initialRepoUrl={initialRepoUrl}>
      <MonorepoWizardContent />
    </MonorepoProvider>
  );
}

function MonorepoWizardContent() {
  const { state, setRepoUrl, setGroupName, setIsPrivate, addService, submit } =
    useMonorepo();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-4">
            <GitBranch className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Monorepo Setup</h1>
          <p className="text-slate-500 mt-1">
            Configure multiple services from a single repository
          </p>
        </div>

        {/* Repository Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <FolderTree className="w-4 h-4" />
            Repository
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Git Repository URL *
              </label>
              <input
                type="url"
                value={state.repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Project Group Name *
              </label>
              <input
                type="text"
                value={state.groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="my-project"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={state.isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm text-slate-700">Private Repository</span>
            <span className="text-xs text-slate-400">
              (Uses GitHub token from Settings)
            </span>
          </label>
        </div>

        {/* Services Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4" />
              Services ({state.services.length})
            </h2>
            <button
              type="button"
              onClick={addService}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </button>
          </div>

          <div className="space-y-3">
            {state.services.map((service, index) => (
              <ServiceCard key={service.id} service={service} index={index} />
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Multi-Service Build</p>
            <p className="text-amber-700 mt-1">
              All services will be created and scanned in sequence. Make sure
              each service has the correct build directory path.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={state.isSubmitting}
          className="w-full px-6 py-3.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          {state.isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Services...
            </>
          ) : (
            <>
              Create {state.services.length} Service
              {state.services.length !== 1 ? "s" : ""} & Start Scans
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
