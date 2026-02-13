// components/ScanForm.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Lock,
  FileText,
  Code2,
  FolderTree,
  Server,
  Box,
  Github,
  ShieldCheck,
  X,
  Tag,
} from "lucide-react";
import DuplicateServiceWarning from "@/components/DuplicateServiceWarning";

// Use shared components
import AccountSelector from "./ui/AccountSelector";

const TEMPLATE_OPTIONS = [
  { value: "node", label: "Node.js" },
  { value: "python", label: "Python" },
  { value: "java-maven", label: "Java (Maven)" },
  { value: "go", label: "Go Lang" },
  { value: "dotnet", label: ".NET Core" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "rust", label: "Rust" },
  { value: "default", label: "Generic / Trivy" },
];

type Props = {
  buildMode: boolean;
};

function ScanFormContent({ buildMode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramRepo = searchParams.get("repo") || "";
  const paramContext = searchParams.get("context") || "";

  // State
  // credentials & credentialsLoading are now managed by SWR
  const [selectedGitId, setSelectedGitId] = useState("");
  const [selectedDockerId, setSelectedDockerId] = useState("");

  const [repoUrl, setRepoUrl] = useState(paramRepo);
  const [groupName, setGroupName] = useState("");
  const [isPrivateRepo, setIsPrivateRepo] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [buildContext, setBuildContext] = useState(paramContext);

  const [imageName, setImageName] = useState("");
  const [imageTag, setImageTag] = useState("");
  const [trivyScanMode, setTrivyScanMode] = useState<"fast" | "full">("fast");

  const [useCustomDockerfile, setUseCustomDockerfile] = useState(false);
  const [customDockerfileContent, setCustomDockerfileContent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Duplicate detection state
  const [duplicateService, setDuplicateService] = useState<any>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Data Fetching with SWR
  const { data: credentialsData, isLoading: credentialsLoading } = useSWR(
    "/api/user/settings/credentials",
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch credentials");
      return res.json();
    }
  );

  const credentials = credentialsData?.credentials || [];

  // Auto-select defaults & Sync state
  useEffect(() => {
    if (credentials.length > 0) {
      // 1. Sync: Clear selected ID if it no longer exists in current credentials
      if (selectedGitId && !credentials.find((c: any) => c.id === selectedGitId)) {
        setSelectedGitId("");
      }
      if (selectedDockerId && !credentials.find((c: any) => c.id === selectedDockerId)) {
        setSelectedDockerId("");
      }

      // 2. Auto-select defaults if nothing selected
      if (!selectedGitId) {
        // ... (existing logic)
        const defGit = credentials.find(
          (c: any) => c.provider === "GITHUB" && c.isDefault
        );
        if (defGit) setSelectedGitId(defGit.id);
         // Fallback: If no default, pick first available
        else {
           const firstGit = credentials.find((c: any) => c.provider === "GITHUB");
           if (firstGit) setSelectedGitId(firstGit.id);
        }
      }
      
      if (buildMode && !selectedDockerId) {
        const defDocker = credentials.find(
          (c: any) => c.provider === "DOCKER" && c.isDefault
        );
        if (defDocker) setSelectedDockerId(defDocker.id);
        // Fallback
        else {
           const firstDocker = credentials.find((c: any) => c.provider === "DOCKER");
           if (firstDocker) setSelectedDockerId(firstDocker.id);
        }
      }
    }
  }, [credentials, buildMode, selectedGitId, selectedDockerId]);

  const gitOptions = credentials.filter((c: any) => c.provider === "GITHUB");
  const dockerOptions = credentials.filter((c: any) => c.provider === "DOCKER");
  const selectedDockerCred = credentials.find((c: any) => c.id === selectedDockerId);

  async function onSubmit(e: React.FormEvent, forceCreate = false) {
    e.preventDefault();
    if (!selectedGitId)
      return alert(
        "Missing GitHub Account. Please go to Settings > Identity & Access to add your GitHub Token."
      );
    if (buildMode && !selectedDockerId)
      return alert(
        "Missing Docker Account. Please go to Settings > Identity & Access to add your Docker Token."
      );
    if (!serviceName) return alert("Service Name is required.");

    setLoading(true);
    try {
      const createRes = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          isNewGroup: true,
          groupName: groupName || "default-group",
          repoUrl,
          isPrivate: isPrivateRepo,
          gitCredentialId: selectedGitId,
          dockerCredentialId: buildMode ? selectedDockerId : undefined,
          includeDocker: buildMode,
          serviceName,
          contextPath: buildContext || ".",
          imageName: buildMode ? imageName : serviceName + "-scan",
          customDockerfile:
            buildMode && useCustomDockerfile
              ? customDockerfileContent
              : undefined,
          force: forceCreate, // Pass force parameter
        }),
      });

      const createData = await createRes.json();
      
      // Check for duplicate error from projects/create
      if (createRes.status === 409 && createData.isDuplicate) {
        setDuplicateService(createData.existingService);
        setShowDuplicateWarning(true);
        setLoading(false);
        return;
      }
      
      if (!createRes.ok)
        throw new Error(createData.message || createData.error);

      const scanRes = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceId: createData.serviceId,
          scanMode: buildMode ? "SCAN_AND_BUILD" : "SCAN_ONLY",
          imageTag: imageTag || (buildMode ? "latest" : `audit-${Date.now()}`),
          trivyScanMode,
          force: forceCreate, // Pass force parameter
        }),
      });

      const scanData = await scanRes.json();
      
      if (scanRes.ok && scanData.scanId) {
        router.push(`/scan/${scanData.scanId}`);
      } else {
        throw new Error(scanData.message || "Failed to start scan");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex justify-center px-4 2xl:px-0">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-7xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  buildMode
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                }`}
              >
                {/* {buildMode ? <Server size={20} /> : <ShieldCheck size={20} />} */}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-none">
                  {buildMode ? "Scan & Build Pipeline" : "Security Scan Only"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {buildMode
                    ? "Code Scan → Build Docker Image → Push Registry"
                    : "Code Scan Only (Secrets & SAST)"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* LEFT COLUMN */}
            <div className="p-6 lg:border-r border-slate-100 dark:border-slate-800 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <Lock size={14} className="text-blue-500" /> IDENTITY & ACCESS
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AccountSelector
                    label="GITHUB ACCOUNT"
                    icon={Github}
                    options={gitOptions}
                    selectedId={selectedGitId}
                    onChange={setSelectedGitId}
                    isLoading={credentialsLoading}
                  />
                  {buildMode && (
                    <AccountSelector
                      label="DOCKER REGISTRY"
                      icon={Box}
                      options={dockerOptions}
                      selectedId={selectedDockerId}
                      onChange={setSelectedDockerId}
                      isLoading={credentialsLoading}
                    />
                  )}
                </div>
              </div>

              <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />

              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <FolderTree size={14} className="text-blue-500" /> REPOSITORY
                  DETAILS
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                      Git/GitHub URL
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/owner/repo"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                        Group
                      </label>
                      <input
                        required
                        placeholder="My-App"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                        Service
                      </label>
                      <input
                        required
                        placeholder="frontend"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={isPrivateRepo}
                      onChange={(e) => setIsPrivateRepo(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded dark:bg-slate-800 dark:border-slate-700"
                    />
                    <label
                      htmlFor="isPrivate"
                      className="text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none"
                    >
                      Private Repository (Requires Auth)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 flex flex-col h-full">
              {buildMode ? (
                <>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <Server size={14} className="text-blue-500" /> BUILD
                    CONFIGURATION
                  </h3>
                  <div className="bg-white dark:bg-slate-950 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4 mb-6 shadow-sm">
                    <div className="text-[10px] font-bold text-blue-500 uppercase mb-1 tracking-wide">
                      Target Registry Preview
                    </div>
                    <div className="flex flex-wrap items-center gap-1 text-sm font-mono text-slate-700 dark:text-slate-200 break-all">
                      <span className="opacity-40 select-none">
                        docker push
                      </span>
                      <span className="font-bold">index.docker.io/</span>
                      <span className="bg-slate-100 dark:bg-slate-800 px-1 rounded border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                        {selectedDockerCred?.username || "user"}
                      </span>
                      <span>/</span>
                      <span className="bg-blue-50 dark:bg-blue-900/20 px-1 rounded border border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-300">
                        {imageName || "image"}
                      </span>
                      <span>:</span>
                      <span className="bg-amber-50 dark:bg-amber-900/20 px-1 rounded border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400">
                        {imageTag || "latest"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 mb-6">
                    <div className="col-span-7">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                        Image Name
                      </label>
                      <input
                        required
                        placeholder="my-service"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={imageName}
                        onChange={(e) => setImageName(e.target.value)}
                      />
                    </div>
                    <div className="col-span-5">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                        Tag
                      </label>
                      <input
                        placeholder="latest"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-center placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={imageTag}
                        onChange={(e) => setImageTag(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-4 mb-auto">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                        Build Context
                      </label>
                      <input
                        placeholder="."
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={buildContext}
                        onChange={(e) => setBuildContext(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditorOpen(true)}
                      className="w-full py-2 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center justify-center gap-2 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 rounded-lg"
                    >
                      <FileText size={14} />{" "}
                      {useCustomDockerfile
                        ? "Edit Custom Dockerfile"
                        : "Customize Dockerfile"}
                    </button>
                    {useCustomDockerfile && selectedTemplate && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                        <Code2 size={14} />
                        <span className="font-semibold">Template:</span>
                        {TEMPLATE_OPTIONS.find((t) => t.value === selectedTemplate)?.label}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <ShieldCheck size={14} className="text-purple-500" />{" "}
                    SCANNER SETTINGS
                  </h3>

                  {/* ✅ Added Version Label for Scan Only */}
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase flex items-center gap-1">
                      <Tag size={12} /> Version Label
                    </label>
                    <input
                      placeholder="e.g. v1.0-audit, release-candidate"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                      value={imageTag}
                      onChange={(e) => setImageTag(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      This label helps identify this audit in comparison
                      reports.
                    </p>
                  </div>

                  {/* ✅ Hide Scanner Level for Scan Only (Not implemented yet) */}
                  {buildMode && (
                    <div className="mb-auto">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                        Scanner Level
                      </label>
                      <select
                        value={trivyScanMode}
                        onChange={(e) =>
                          setTrivyScanMode(e.target.value as "fast" | "full")
                        }
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                      >
                        <option value="fast">Fast (Gitleaks + Semgrep)</option>
                        <option value="full">Full (+ Dependency Check)</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white py-3.5 rounded-lg font-bold text-sm shadow-lg shadow-blue-900/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 ${
                    loading ? "opacity-75 cursor-wait" : ""
                  } ${
                    buildMode
                      ? "bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />{" "}
                      Processing...
                    </>
                  ) : buildMode ? (
                    <>
                      <Server size={18} /> Start Build Pipeline
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} /> Start Scan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {buildMode && isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Code2 size={18} /> Custom Dockerfile
              </h3>
              <button onClick={() => setIsEditorOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X />
              </button>
            </div>
            
            {/* Template Selector Bar */}
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center gap-3">
               <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Apply Template:</span>
               <select 
                 className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded px-3 py-1 outline-none focus:ring-2 focus:ring-blue-500/50"
                 value={selectedTemplate}
                 onChange={async (e) => {
                    const stack = e.target.value;
                    if(stack) {
                       if(customDockerfileContent && !confirm("Overwrite current Dockerfile content?")) return;
                       
                       try {
                         const res = await fetch(`/api/templates?stack=${stack}`);
                         const text = await res.text();
                         setCustomDockerfileContent(text);
                         setUseCustomDockerfile(true);
                         setSelectedTemplate(stack);
                       } catch(err) {
                         alert("Failed to load template");
                       }
                    }
                 }}
               >
                  <option value="" disabled>-- Select a Preset --</option>
                  {TEMPLATE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
               </select>
               <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                 Presets managed by Admin
               </span>
            </div>

            <div className="flex-1 bg-[#1e1e1e]">
              <textarea
                className="w-full h-full bg-transparent text-slate-200 font-mono p-4 outline-none resize-none"
                value={customDockerfileContent}
                onChange={(e) => {
                  setCustomDockerfileContent(e.target.value);
                  setUseCustomDockerfile(true);
                }}
                placeholder="FROM node:18-alpine..."
              />
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useCustomDockerfile}
                  onChange={(e) => setUseCustomDockerfile(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Enable</span>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Warning Dialog */}
      {showDuplicateWarning && duplicateService && (
        <DuplicateServiceWarning
          existingService={duplicateService}
          mode="standalone-scan"
          onViewExisting={() => {
            setShowDuplicateWarning(false);
            router.push(`/dashboard?highlight=${duplicateService.id}`);
          }}
          onRescan={async () => {
            setShowDuplicateWarning(false);
            setLoading(true);
            try {
              const res = await fetch("/api/scan/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  serviceId: duplicateService.id,
                  scanMode: buildMode ? "SCAN_AND_BUILD" : "SCAN_ONLY",
                  imageTag: imageTag || (buildMode ? "latest" : `audit-${Date.now()}`),
                }),
              });
              
              if (res.ok) {
                const { scanId } = await res.json();
                router.push(`/scan/${scanId}`);
              } else {
                throw new Error("Failed to start scan");
              }
            } catch (err) {
              alert("Failed to start re-scan");
              setLoading(false);
            }
          }}
          onCreateAnyway={() => {
            setShowDuplicateWarning(false);
            // Re-submit with force=true
            const form = document.querySelector('form');
            if (form) {
              onSubmit({ preventDefault: () => {} } as any, true);
            }
          }}
          onCancel={() => {
            setShowDuplicateWarning(false);
            setLoading(false);
          }}
        />
      )}
    </>
  );
}

export default function ScanForm(props: Props) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScanFormContent {...props} />
    </Suspense>
  );
}
