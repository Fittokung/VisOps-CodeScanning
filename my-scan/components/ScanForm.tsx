"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Lock,
  FileText,
  Code2,
  FolderTree,
  Server,
  Box,
  HelpCircle,
  Github,
  ShieldCheck,
  X,
  ChevronDown,
  Check,
  Plus,
} from "lucide-react";

type Props = {
  buildMode: boolean;
};

// --- Helper: Tooltip ---
const InfoTooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-flex items-center ml-1.5">
    <HelpCircle
      size={14}
      className="text-slate-400 hover:text-blue-500 cursor-help"
    />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none leading-relaxed">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

// --- Component: Account Selector (Compact Horizontal) ---
interface AccountOption {
  id: string;
  name: string;
  username: string;
  isDefault: boolean;
  provider: "GITHUB" | "DOCKER";
}

const AccountSelector = ({
  label,
  icon: Icon,
  options,
  selectedId,
  onChange,
  isLoading,
}: {
  label: string;
  icon: any;
  options: AccountOption[];
  selectedId: string;
  onChange: (id: string) => void;
  isLoading: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.id === selectedId);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
        {label}
      </label>

      <button
        type="button"
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`w-full text-left border rounded-lg flex items-center justify-between transition-all duration-200 outline-none h-[42px] px-3 ${
          isOpen
            ? "border-blue-500 ring-1 ring-blue-500"
            : "border-slate-200 hover:border-slate-300"
        } ${
          isLoading ? "bg-slate-50 opacity-70 cursor-not-allowed" : "bg-white"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden w-full">
          <Icon
            size={16}
            className={selectedOption ? "text-slate-700" : "text-slate-400"}
          />
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {selectedOption ? (
              <>
                <span className="text-sm font-semibold text-slate-900 truncate">
                  {selectedOption.username}
                </span>
                <span className="text-xs text-slate-400 truncate hidden xl:inline-block">
                  ({selectedOption.name})
                </span>
              </>
            ) : (
              <span className="text-sm text-slate-500">Select...</span>
            )}
          </div>
          <ChevronDown size={14} className="text-slate-400 shrink-0" />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-100 rounded-lg shadow-xl max-h-60 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.length > 0 ? (
            options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                  selectedId === option.id ? "bg-blue-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {option.username}
                    </span>
                    {option.isDefault && (
                      <span className="bg-slate-100 text-[9px] px-1 rounded border border-slate-200 text-slate-500">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {option.name}
                  </div>
                </div>
                {selectedId === option.id && (
                  <Check size={14} className="text-blue-600" />
                )}
              </button>
            ))
          ) : (
            <div className="p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">No accounts.</p>
              <a
                href="/settings"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center justify-center gap-1"
              >
                <Plus size={10} /> Add
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function ScanFormContent({ buildMode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramRepo = searchParams.get("repo") || "";
  const paramContext = searchParams.get("context") || "";

  // State
  const [credentials, setCredentials] = useState<any[]>([]);
  const [credentialsLoading, setCredentialsLoading] = useState(true);
  const [selectedGitId, setSelectedGitId] = useState("");
  const [selectedDockerId, setSelectedDockerId] = useState("");

  const [repoUrl, setRepoUrl] = useState(paramRepo);
  const [groupName, setGroupName] = useState("");
  const [isPrivateRepo, setIsPrivateRepo] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [buildContext, setBuildContext] = useState(paramContext);

  const [imageName, setImageName] = useState("");
  const [imageTag, setImageTag] = useState("latest");
  const [trivyScanMode, setTrivyScanMode] = useState<"fast" | "full">("fast");

  const [useCustomDockerfile, setUseCustomDockerfile] = useState(false);
  const [customDockerfileContent, setCustomDockerfileContent] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCredentialsLoading(true);
    fetch("/api/user/settings/credentials")
      .then((r) => r.json())
      .then((data) => {
        const creds = data.credentials || [];
        setCredentials(creds);
        const defGit = creds.find(
          (c: any) => c.provider === "GITHUB" && c.isDefault
        );
        if (defGit) setSelectedGitId(defGit.id);
        if (buildMode) {
          const defDocker = creds.find(
            (c: any) => c.provider === "DOCKER" && c.isDefault
          );
          if (defDocker) setSelectedDockerId(defDocker.id);
        }
      })
      .finally(() => setCredentialsLoading(false));
  }, [buildMode]);

  const gitOptions = credentials.filter((c) => c.provider === "GITHUB");
  const dockerOptions = credentials.filter((c) => c.provider === "DOCKER");
  const selectedDockerCred = credentials.find((c) => c.id === selectedDockerId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGitId) return alert("Please select a GitHub account.");
    if (buildMode && !selectedDockerId)
      return alert("Please select a Docker account.");
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
          serviceName,
          contextPath: buildContext || ".",
          imageName: buildMode ? imageName : serviceName + "-scan",
          customDockerfile:
            buildMode && useCustomDockerfile
              ? customDockerfileContent
              : undefined,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok)
        throw new Error(createData.message || createData.error);

      const scanRes = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceId: createData.serviceId,
          scanMode: buildMode ? "SCAN_AND_BUILD" : "SCAN_ONLY",
          imageTag: imageTag || "latest",
          trivyScanMode,
        }),
      });

      const scanData = await scanRes.json();
      if (scanRes.ok && scanData.pipelineId) {
        router.push(`/scan/${scanData.pipelineId}`);
      } else {
        throw new Error(scanData.message);
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
        {/* ✅ Container กว้างพิเศษ (max-w-7xl) เพื่อให้ออกด้านข้างสุดๆ */}
        <form
          onSubmit={onSubmit}
          className="w-full max-w-7xl bg-white rounded-xl border border-slate-200 shadow-sm mt-6 overflow-hidden"
        >
          {/* Compact Header */}
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  buildMode
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {buildMode ? <Server size={20} /> : <ShieldCheck size={20} />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 leading-none">
                  {buildMode ? "Scan & Build Pipeline" : "Security Scan Only"}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {buildMode
                    ? "Code Scan → Build Docker Image → Push Registry"
                    : "Code Scan Only (Secrets & SAST)"}
                </p>
              </div>
            </div>

            {/* Quick Actions / Status could go here */}
          </div>

          {/* Main Layout: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* --- LEFT COLUMN: Source & Repo (Border Right) --- */}
            <div className="p-6 lg:border-r border-slate-100 space-y-6">
              {/* Section 1: Identity */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-4">
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

              <div className="w-full h-px bg-slate-100" />

              {/* Section 2: Repository */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <FolderTree size={14} className="text-blue-500" /> REPOSITORY
                  DETAILS
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                      Git URL
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/owner/repo"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                        Group
                      </label>
                      <input
                        required
                        placeholder="My-App"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                        Service
                      </label>
                      <input
                        required
                        placeholder="frontend"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
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
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label
                      htmlFor="isPrivate"
                      className="text-xs font-medium text-slate-600 cursor-pointer select-none"
                    >
                      Private Repository (Requires Auth)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* --- RIGHT COLUMN: Build Config (Background Color) --- */}
            <div className="bg-slate-50/50 p-6 flex flex-col h-full">
              {buildMode ? (
                <>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <Server size={14} className="text-blue-500" /> BUILD
                    CONFIGURATION
                  </h3>

                  {/* ✅ Target Registry Preview - Moved Top & Full Width */}
                  <div className="bg-white border border-blue-200 rounded-lg p-4 mb-6 shadow-sm">
                    <div className="text-[10px] font-bold text-blue-500 uppercase mb-1 tracking-wide">
                      Target Registry Preview
                    </div>
                    <div className="flex flex-wrap items-center gap-1 text-sm font-mono text-slate-700 break-all">
                      <span className="opacity-40 select-none">
                        docker push
                      </span>
                      <span className="font-bold">index.docker.io/</span>
                      <span className="bg-slate-100 px-1 rounded border border-slate-200 text-slate-900">
                        {selectedDockerCred?.username || "user"}
                      </span>
                      <span>/</span>
                      <span className="bg-blue-50 px-1 rounded border border-blue-100 text-blue-700">
                        {imageName || "image"}
                      </span>
                      <span>:</span>
                      <span className="bg-amber-50 px-1 rounded border border-amber-100 text-amber-700">
                        {imageTag}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4 mb-6">
                    <div className="col-span-7">
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                        Image Name
                      </label>
                      <input
                        required
                        placeholder="my-service"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                        value={imageName}
                        onChange={(e) => setImageName(e.target.value)}
                      />
                    </div>
                    <div className="col-span-5">
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                        Tag
                      </label>
                      <input
                        placeholder="latest"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-center"
                        value={imageTag}
                        onChange={(e) => setImageTag(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 mb-auto">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                        Build Context
                      </label>
                      <input
                        placeholder="."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white font-mono"
                        value={buildContext}
                        onChange={(e) => setBuildContext(e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditorOpen(true)}
                      className="w-full py-2 text-xs text-slate-600 hover:text-blue-600 font-medium flex items-center justify-center gap-2 transition-colors bg-white border border-slate-200 hover:border-blue-300 rounded-lg"
                    >
                      <FileText size={14} />
                      {useCustomDockerfile
                        ? "Edit Custom Dockerfile"
                        : "Customize Dockerfile"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <ShieldCheck size={14} className="text-purple-500" />{" "}
                    SCANNER SETTINGS
                  </h3>
                  <div className="mb-auto">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                      Scanner Level
                    </label>
                    <select
                      value={trivyScanMode}
                      onChange={(e) =>
                        setTrivyScanMode(e.target.value as "fast" | "full")
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    >
                      <option value="fast">Fast (Gitleaks + Semgrep)</option>
                      <option value="full">Full (+ Dependency Check)</option>
                    </select>
                  </div>
                </>
              )}

              {/* Start Button Area */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white py-3.5 rounded-lg font-bold text-sm shadow-lg shadow-blue-900/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 ${
                    loading ? "opacity-75 cursor-wait" : ""
                  } ${
                    buildMode
                      ? "bg-slate-900 hover:bg-black"
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
                      Start Build Pipeline <Server size={18} />
                    </>
                  ) : (
                    <>
                      Start Scan <ShieldCheck size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Editor Modal (Same as before) */}
      {buildMode && isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold flex items-center gap-2 text-slate-800">
                <Code2 size={18} /> Custom Dockerfile
              </h3>
              <button onClick={() => setIsEditorOpen(false)}>
                <X />
              </button>
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
            <div className="p-4 border-t flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useCustomDockerfile}
                  onChange={(e) => setUseCustomDockerfile(e.target.checked)}
                />
                <span className="text-sm">Enable</span>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
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
