"use client";

import React, {
  useState,
  useEffect,
  Suspense,
  useRef,
  useCallback,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Lock,
  FileText,
  Code2,
  LayoutTemplate,
  Save,
  FolderTree,
  GitBranch,
  Server,
  CheckCircle2,
  XCircle,
  Info,
  Box,
  Tag,
  HelpCircle,
  AlertTriangle,
  X,
  Edit3,
} from "lucide-react";

type Props = {
  buildMode: boolean;
};

// --- Helper: Tooltip Component ---
const InfoTooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-flex items-center ml-1.5">
    <HelpCircle
      size={14}
      className="text-slate-400 hover:text-blue-500 cursor-help transition-colors"
    />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-slate-800 text-white text-[10px] leading-tight rounded shadow-lg z-50 animate-in fade-in zoom-in-95 duration-200">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

// --- Helper: Extract service name from Git URL ---
const extractServiceNameFromUrl = (url: string): string => {
  if (!url) return "";
  try {
    const cleanUrl = url.trim().replace(/\.git$/, "");
    const parts = cleanUrl.split(/[\/:]/);
    if (parts.length >= 2) {
      const owner = parts[parts.length - 2];
      const repo = parts[parts.length - 1];
      return `${owner}-${repo}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
    }
    return (
      parts[parts.length - 1]?.toLowerCase().replace(/[^a-z0-9-]/g, "") || ""
    );
  } catch {
    return "";
  }
};

// --- Helper: Generate dynamic image name ---
const generateImageName = (repoUrl: string, buildDir: string): string => {
  if (!repoUrl) return "";
  try {
    const cleanUrl = repoUrl.trim().replace(/\.git$/, "");
    const parts = cleanUrl.split(/[\/:]/);
    const repoName =
      parts[parts.length - 1]?.toLowerCase().replace(/[^a-z0-9-]/g, "") ||
      "app";

    if (buildDir && buildDir !== ".") {
      const dirSuffix = buildDir
        .replace(/\//g, "-")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "");
      return `${repoName}-${dirSuffix}`;
    }
    return repoName;
  } catch {
    return "app";
  }
};

function ScanFormContent({ buildMode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildDirInputRef = useRef<HTMLInputElement>(null);

  const paramRepo = searchParams.get("repo") || "";
  const paramContext = searchParams.get("context") || "";
  const isContinuityMode = !!paramRepo;

  // --- State: Credentials (from global settings) ---
  const [credentials, setCredentials] = useState({
    hasGit: false,
    hasDocker: false,
    gitUser: "",
    dockerUser: "",
    isDockerOrg: false,
    dockerOrgName: "",
  });
  const [credentialsLoading, setCredentialsLoading] = useState(true);

  // --- State: Repository ---
  const [repoUrl, setRepoUrl] = useState(paramRepo);
  const [groupName, setGroupName] = useState("");
  const [repoOwner, setRepoOwner] = useState("anonymous");
  const [isPrivateRepo, setIsPrivateRepo] = useState(false);

  // --- State: Service ---
  const [serviceName, setServiceName] = useState("");
  const [serviceNameEdited, setServiceNameEdited] = useState(false);
  const [buildContext, setBuildContext] = useState(paramContext);
  const [imageName, setImageName] = useState("");
  const [imageNameEdited, setImageNameEdited] = useState(false);
  const [imageTag, setImageTag] = useState("latest");
  const [trivyScanMode, setTrivyScanMode] = useState<"fast" | "full">("fast");

  // --- State: Editor ---
  const [useCustomDockerfile, setUseCustomDockerfile] = useState(false);
  const [customDockerfileContent, setCustomDockerfileContent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // --- State: System ---
  const [loading, setLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");

  // Load credentials from Settings on Mount
  useEffect(() => {
    setCredentialsLoading(true);
    fetch("/api/user/settings")
      .then((r) => r.json())
      .then((d) => {
        setCredentials({
          hasGit: d.hasGitToken,
          hasDocker: d.hasDockerToken,
          gitUser: d.gitUser || "",
          dockerUser: d.dockerUser || "",
          isDockerOrg: d.isDockerOrganization || false,
          dockerOrgName: d.dockerOrgName || "",
        });
      })
      .catch(() => {})
      .finally(() => setCredentialsLoading(false));
  }, []);

  useEffect(() => {
    if (paramRepo) setRepoUrl(paramRepo);
    if (paramContext) setBuildContext(paramContext);
  }, [paramRepo, paramContext]);

  useEffect(() => {
    if (isContinuityMode && buildDirInputRef.current) {
      setTimeout(() => buildDirInputRef.current?.focus(), 100);
    }
  }, [isContinuityMode]);

  // Smart Service Name Generation from Git URL
  useEffect(() => {
    if (!repoUrl) return;
    try {
      const cleanUrl = repoUrl.trim().replace(/\.git$/, "");
      const parts = cleanUrl.split(/[\/:]/);

      let rName = "project";
      let rOwner = "anonymous";

      if (parts.length >= 2) {
        rName = parts[parts.length - 1];
        rOwner = parts[parts.length - 2];
      }

      setRepoOwner(rOwner);
      if (!groupName) setGroupName(rName);

      // Auto-generate service name if not manually edited
      if (!serviceNameEdited) {
        const autoServiceName = extractServiceNameFromUrl(repoUrl);
        setServiceName(autoServiceName);
      }
    } catch (e) {}
  }, [repoUrl, groupName, serviceNameEdited]);

  // Dynamic Target Image Naming based on Build Directory
  useEffect(() => {
    if (!imageNameEdited && repoUrl) {
      const autoImage = generateImageName(repoUrl, buildContext);
      setImageName(autoImage);
    }
  }, [repoUrl, buildContext, imageNameEdited]);

  const handleServiceNameChange = (value: string) => {
    setServiceName(value);
    setServiceNameEdited(true);
  };

  const handleImageNameChange = (value: string) => {
    setImageName(value);
    setImageNameEdited(true);
  };

  const handleTemplateChange = async (stack: string) => {
    setSelectedTemplate(stack);
    if (!stack) return;
    setLoadingTemplate(true);
    try {
      const res = await fetch(`/api/templates?stack=${stack}`);
      const content = await res.text();
      setCustomDockerfileContent(content);
      setUseCustomDockerfile(true);
    } catch (err) {
      alert("Failed to load template");
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleReset = () => {
    router.push("/");
    setRepoUrl("");
    setBuildContext("");
    setGroupName("");
    setServiceName("");
    setServiceNameEdited(false);
    setImageNameEdited(false);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate credentials are set up in Settings
    if (!credentials.hasGit) {
      return alert("Please set up your GitHub credentials in Settings first.");
    }
    if (buildMode && !credentials.hasDocker) {
      return alert(
        "Please set up your Docker Hub credentials in Settings first."
      );
    }
    if (!serviceName) return alert("Please enter a Service Name.");

    setLoading(true);

    try {
      const createRes = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          isNewGroup: true,
          groupName,
          repoUrl: repoUrl.trim(),
          isPrivate: isPrivateRepo,
          // No more token fields - backend uses global settings
          serviceName,
          contextPath: buildContext.trim() || ".",
          imageName: imageName.trim(),
          customDockerfile: useCustomDockerfile
            ? customDockerfileContent
            : undefined,
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        if (createRes.status === 403) {
          setLimitMessage(createData.message);
          setShowLimitModal(true);
          setLoading(false);
          return;
        }
        throw new Error(createData.message || "Failed to create project");
      }

      const scanRes = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceId: createData.serviceId,
          scanMode: buildMode ? "SCAN_AND_BUILD" : "SCAN_ONLY",
          imageTag: imageTag.trim() || "latest",
          trivyScanMode: trivyScanMode,
        }),
      });

      const scanData = await scanRes.json();

      if (scanRes.ok && scanData.pipelineId) {
        router.push(`/scan/${scanData.pipelineId}`);
      } else {
        throw new Error(scanData.message || "Failed to start scan pipeline");
      }
    } catch (err: any) {
      setLoading(false);
      alert("Error: " + err.message);
    }
  }

  return (
    <>
      <div className="flex justify-center">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-xl p-6 space-y-6 bg-white rounded-xl border border-slate-200 shadow-sm mt-6 relative z-10"
        >
          {/* Credentials Status Banner */}
          {credentialsLoading ? (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-slate-400" />
              <span className="text-sm text-slate-500">
                Loading credentials...
              </span>
            </div>
          ) : !credentials.hasGit || (buildMode && !credentials.hasDocker) ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">
                    Credentials Required
                  </h4>
                  <p className="text-xs text-amber-700 mt-1">
                    {!credentials.hasGit && "GitHub token is not configured. "}
                    {buildMode &&
                      !credentials.hasDocker &&
                      "Docker Hub token is not configured. "}
                    <a
                      href="/settings"
                      className="underline font-medium hover:text-amber-900"
                    >
                      Set up in Settings →
                    </a>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600" />
              <span className="text-sm text-green-700">
                Using credentials from Settings
                {credentials.gitUser && (
                  <span className="text-green-600">
                    {" "}
                    • Git: {credentials.gitUser}
                  </span>
                )}
                {buildMode && credentials.dockerUser && (
                  <span className="text-green-600">
                    {" "}
                    • Docker: {credentials.dockerUser}
                  </span>
                )}
              </span>
            </div>
          )}

          {isContinuityMode && (
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-start justify-between gap-3 animate-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                  <GitBranch size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-indigo-900">
                    Multi-Service Build Mode
                  </h4>
                  <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                    Add another service for{" "}
                    <b>{groupName || "this repository"}</b>.<br />
                    Please specify the <b>Build Directory</b> below.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-500 underline hover:text-slate-800 whitespace-nowrap"
              >
                Clear / Start New
              </button>
            </div>
          )}

          <div className="border-b pb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {buildMode
                ? "Scan & Build Configuration"
                : "Security Scan Configuration"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Configure your repository and build settings.
            </p>
          </div>

          {/* ================= REPOSITORY SECTION (GROUP) ================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FolderTree size={14} /> Repository (Project Group)
              </h3>
              {repoUrl && (
                <div className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono flex items-center gap-1">
                  <Info size={10} /> Detected Owner:{" "}
                  <span className="font-bold text-slate-700">{repoOwner}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 font-semibold text-slate-700 text-sm">
                  Git Repository URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    required
                    className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition ${
                      isContinuityMode
                        ? "bg-slate-50 text-slate-600 border-slate-200"
                        : "bg-white"
                    }`}
                  />
                  {isContinuityMode && (
                    <div className="absolute right-3 top-2 text-slate-400">
                      <Lock size={16} />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block mb-1.5 font-semibold text-slate-700 text-sm">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. My-App"
                  required
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition bg-white"
                />
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivateRepo}
                  onChange={(e) => setIsPrivateRepo(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <label
                  htmlFor="isPrivate"
                  className="text-sm font-medium text-slate-700 cursor-pointer"
                >
                  Private Repository
                </label>
                <span className="text-xs text-slate-400">
                  (Uses GitHub token from Settings)
                </span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* ================= SERVICE SECTION (IMAGE) ================= */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Server size={14} /> Service & Build (Image)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 font-semibold text-slate-700 text-sm flex items-center">
                  Service Name
                  <InfoTooltip text="Auto-generated from Git URL. You can edit if needed." />
                  {serviceNameEdited && (
                    <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded">
                      Edited
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => handleServiceNameChange(e.target.value)}
                    placeholder="e.g. owasp-wrongsecrets"
                    required
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                  />
                  {!serviceNameEdited && serviceName && (
                    <div className="absolute right-2 top-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 size={10} /> Auto
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block mb-1.5 font-semibold text-slate-700 text-sm">
                  Build Directory
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 select-none">
                    /root/
                  </span>
                  <input
                    ref={buildDirInputRef}
                    type="text"
                    value={buildContext}
                    onChange={(e) => setBuildContext(e.target.value)}
                    placeholder="."
                    className="flex-1 border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-3 bg-white border-slate-200 hover:border-blue-300 transition group flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText
                  size={16}
                  className="text-slate-400 group-hover:text-blue-500"
                />
                <span className="text-sm text-slate-600">
                  Dockerfile Config
                </span>
                {useCustomDockerfile && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded">
                    Custom
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(true)}
                className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded text-slate-700 font-medium"
              >
                {useCustomDockerfile ? "Edit Code" : "Customize"}
              </button>
            </div>

            {buildMode && (
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                <div className="bg-blue-100 p-3 rounded-lg border border-blue-200 text-xs text-blue-800">
                  <p className="font-semibold uppercase tracking-wide mb-1 opacity-70 flex justify-between">
                    <span>Target Image Preview</span>
                    <span className="text-[10px] bg-blue-200 px-1.5 rounded text-blue-900">
                      Auto-Generated
                    </span>
                  </p>
                  <p className="font-mono break-all text-sm flex items-center gap-1">
                    <Box size={14} />
                    index.docker.io/
                    <span className="font-bold">
                      {credentials.isDockerOrg && credentials.dockerOrgName
                        ? credentials.dockerOrgName
                        : credentials.dockerUser || "user"}
                    </span>
                    /
                    <span className="font-bold">
                      {imageName || "repo-service"}
                    </span>
                    :
                    <span className="font-bold bg-yellow-100 px-1 rounded text-yellow-800 border border-yellow-200">
                      {imageTag}
                    </span>
                  </p>
                </div>

                <div className="pt-2">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="mb-1 text-xs font-bold text-slate-700 flex items-center">
                        Target Image Name
                        <InfoTooltip text="Auto-generated from repo name + build directory. You can edit if needed." />
                        {imageNameEdited && (
                          <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded">
                            Edited
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          value={imageName}
                          onChange={(e) =>
                            handleImageNameChange(e.target.value)
                          }
                          placeholder="repo-service"
                          className="w-full border p-2 rounded text-sm outline-none font-mono text-slate-700 bg-white"
                        />
                        {!imageNameEdited && imageName && (
                          <div className="absolute right-2 top-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 size={10} /> Auto
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-28">
                      <label className="mb-1 text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Tag size={12} /> Tag
                      </label>
                      <input
                        value={imageTag}
                        onChange={(e) => setImageTag(e.target.value)}
                        placeholder="latest"
                        className="w-full border p-2 rounded text-sm outline-none font-mono text-center bg-white focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* ================= SECURITY SCAN MODE ================= */}
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
              <Box size={16} className="mr-2 text-purple-600" />
              Security Scan Mode
              <InfoTooltip text="Fast: OS packages only (10min). Full: OS + Language dependencies - slower but comprehensive (30min)." />
            </label>
            <select
              value={trivyScanMode}
              onChange={(e) =>
                setTrivyScanMode(e.target.value as "fast" | "full")
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
            >
              <option value="fast">Fast Mode (Recommended)</option>
              <option value="full">Full Mode (requires good internet)</option>
            </select>
            <p className="text-xs text-slate-500 mt-1.5">
              {trivyScanMode === "fast"
                ? "Quick scan for common OS vulnerabilities. Suitable for most projects."
                : "Comprehensive scan including Java/Node/Python packages. Best for production releases."}
            </p>
          </div>

          <div className="pt-2">
            <button
              disabled={loading}
              className="w-full bg-slate-900 text-white px-6 py-3.5 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-70 flex justify-center items-center gap-2 shadow-lg shadow-slate-200 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : isContinuityMode ? (
                "Save & Scan Next Service"
              ) : (
                "Save Project & Start Scan"
              )}
            </button>
          </div>
        </form>
      </div>

      {isEditorOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity"
          onClick={() => setIsEditorOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full md:w-[600px] lg:w-[800px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isEditorOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Code2 className="text-blue-600" /> Dockerfile Editor
              </h3>
              <p className="text-xs text-slate-500">
                {buildContext
                  ? `Editing for directory: /${buildContext}`
                  : "Editing for Root directory"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-300 shadow-sm">
                <LayoutTemplate size={14} className="text-slate-500" />
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="text-sm bg-transparent outline-none cursor-pointer text-slate-700 font-medium"
                  disabled={loadingTemplate}
                >
                  <option value="">-- Load Template --</option>
                  <option value="node">Node.js</option>
                  <option value="python">Python</option>
                  <option value="java">Java (Maven)</option>
                  <option value="go">Go</option>
                  <option value="default">Generic (Alpine)</option>
                </select>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden flex flex-col">
            {loadingTemplate && (
              <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-white w-8 h-8" />
              </div>
            )}
            <div className="px-4 py-2 bg-[#2d2d2d] border-b border-[#444] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableCustom"
                  checked={useCustomDockerfile}
                  onChange={(e) => setUseCustomDockerfile(e.target.checked)}
                  className="accent-blue-500 w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="enableCustom"
                  className="text-xs text-gray-300 cursor-pointer select-none"
                >
                  Enable Custom Dockerfile
                </label>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                Dockerfile
              </span>
            </div>
            <textarea
              value={customDockerfileContent}
              onChange={(e) => {
                setCustomDockerfileContent(e.target.value);
                if (!useCustomDockerfile) setUseCustomDockerfile(true);
              }}
              placeholder="# Load a template or paste your Dockerfile here..."
              className="flex-1 w-full p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>
          <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
            <div className="text-xs text-amber-600 flex items-center gap-1">
              {useCustomDockerfile && (
                <>
                  <AlertTriangle size={12} /> Overrides default build.
                </>
              )}
            </div>
            <button
              onClick={() => setIsEditorOpen(false)}
              className="flex items-center gap-2 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition shadow-lg"
            >
              <Save size={16} /> Save & Close
            </button>
          </div>
        </div>
      </div>

      {showLimitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Limit Reached
            </h3>
            <p className="text-sm text-slate-600 mb-4">{limitMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowLimitModal(false)}
                className="px-4 py-2 border rounded text-sm hover:bg-slate-50"
              >
                Close
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
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center text-slate-400">
          Loading Configuration...
        </div>
      }
    >
      <ScanFormContent {...props} />
    </Suspense>
  );
}
