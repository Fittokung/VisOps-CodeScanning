"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Trash2, AlertTriangle, X, Loader2, Lock, Unlock, 
  FileText, Code2, LayoutTemplate, Save, Check, FolderTree, 
  GitBranch, Server, CheckCircle2, XCircle, Info, Box, Tag, HelpCircle
} from "lucide-react";

type Props = {
  buildMode: boolean;
};

type ProjectItem = {
  id: number;
  name: string;
  webUrl: string;
  createdAt: string;
};

// --- Helper: Tooltip Component ---
const InfoTooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-flex items-center ml-1.5">
    <HelpCircle size={14} className="text-slate-400 hover:text-blue-500 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-slate-800 text-white text-[10px] leading-tight rounded shadow-lg z-50 animate-in fade-in zoom-in-95 duration-200">
      {text}
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

// --- Helper: Token Validator ---
const TokenValidator = ({ 
    isValid, isValidating, onValidate 
  }: { 
    isValid: boolean | null, 
    isValidating: boolean, 
    onValidate: () => void 
  }) => {
    return (
      <div className="absolute right-2 top-2.5 flex items-center gap-2">
        {isValidating && <Loader2 size={16} className="animate-spin text-slate-400" />}
        {!isValidating && isValid === true && <CheckCircle2 size={18} className="text-green-500" />}
        {!isValidating && isValid === false && <XCircle size={18} className="text-red-500" />}
        
        <button 
          type="button"
          onClick={onValidate}
          className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium transition"
        >
          Check
        </button>
      </div>
    );
};

function ScanFormContent({ buildMode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildDirInputRef = useRef<HTMLInputElement>(null);

  // 1. Get values from URL
  const paramRepo = searchParams.get("repo") || "";
  const paramContext = searchParams.get("context") || "";
  const isContinuityMode = !!paramRepo;

  // --- State: User ---
  const [email, setEmail] = useState("user@example.com"); 

  // --- State: Repository ---
  const [repoUrl, setRepoUrl] = useState(paramRepo);
  const [groupName, setGroupName] = useState("");
  const [repoOwner, setRepoOwner] = useState("anonymous");
  const [isPrivateRepo, setIsPrivateRepo] = useState(false);
  const [gitUser, setGitUser] = useState("");
  const [gitToken, setGitToken] = useState("");
  const [gitValid, setGitValid] = useState<boolean | null>(null);
  const [gitValidating, setGitValidating] = useState(false);

  // --- State: Service ---
  const [serviceName, setServiceName] = useState(""); 
  const [buildContext, setBuildContext] = useState(paramContext);
  const [imageName, setImageName] = useState("");
  const [imageTag, setImageTag] = useState("latest");
  
  const [dockerUser, setDockerUser] = useState("");
  const [dockerToken, setDockerToken] = useState("");
  const [dockerValid, setDockerValid] = useState<boolean | null>(null);
  const [dockerValidating, setDockerValidating] = useState(false);
  
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

  // Update from URL
  useEffect(() => {
    if (paramRepo) setRepoUrl(paramRepo);
    if (paramContext) setBuildContext(paramContext);
  }, [paramRepo, paramContext]);

  // Focus Logic
  useEffect(() => {
    if (isContinuityMode && buildDirInputRef.current) {
        setTimeout(() => buildDirInputRef.current?.focus(), 100);
    }
  }, [isContinuityMode]);

  // --- Auto-fill Logic ---
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

      // Auto-set Image Name logic
      
      // สร้าง Suffix
      let suffix = "";
      if (buildContext && buildContext !== ".") {
          suffix = `-${buildContext.replace(/\//g, '-')}`;
      } else if (serviceName) {
          suffix = `-${serviceName}`;
      }
      
      const autoImage = `${rName}${suffix}`.toLowerCase().replace(/[^a-z0-9-_]/g, "");
      
      // อัปเดตเฉพาะเมื่อ ImageName ยังว่างอยู่
      if(!imageName) {
          setImageName(autoImage);
      }
      
    } catch (e) {}
  }, [repoUrl, serviceName, buildContext]);

  // Validators
  const validateGit = async () => {
    if (!gitToken) return alert("Please enter Git Token");
    setGitValidating(true);
    try {
      const res = await fetch("/api/validate", {
        method: "POST", body: JSON.stringify({ type: "github", token: gitToken })
      });
      const data = await res.json();
      setGitValid(data.valid);
      if (!data.valid) alert("GitHub Token Invalid!");
    } finally { setGitValidating(false); }
  };

  const validateDocker = async () => {
    if (!dockerUser || !dockerToken) return alert("Please enter Docker User & Token");
    setDockerValidating(true);
    try {
      const res = await fetch("/api/validate", {
        method: "POST", body: JSON.stringify({ type: "docker", username: dockerUser, token: dockerToken })
      });
      const data = await res.json();
      setDockerValid(data.valid);
      if (!data.valid) alert("Docker Credentials Invalid!");
    } finally { setDockerValidating(false); }
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
    } catch (err) { alert("Failed to load template"); } 
    finally { setLoadingTemplate(false); }
  };

  const handleReset = () => {
    router.push("/");
    setRepoUrl(""); setBuildContext(""); setGroupName(""); setServiceName("");
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // 0. Validate Inputs
    if (!serviceName) return alert("Please enter a Service Name.");
    if (buildMode && !dockerUser) return alert("Please enter Docker Username.");

    // 1. Validate Token Check
    if (isPrivateRepo && !gitValid && gitToken) {
       if(!confirm("Git Token hasn't been validated. Continue?")) return;
    }
    if (buildMode && !dockerValid && dockerToken) {
       if(!confirm("Docker Token hasn't been validated. Continue?")) return;
    }

    setLoading(true);

    try {
      // Step 2: Create Project Structure
      const createRes = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            email,
            isNewGroup: true,
            groupName,
            repoUrl: repoUrl.trim(),
            isPrivate: isPrivateRepo,
            gitUser,
            gitToken,
            serviceName,
            contextPath: buildContext.trim() || ".",
            
            // ส่ง Image Config
            imageName: imageName.trim(),
            
            dockerUser,
            dockerToken,
            customDockerfile: useCustomDockerfile ? customDockerfileContent : undefined
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

      // Step 3: Start Scan
      const scanRes = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
            serviceId: createData.serviceId,
            imageTag: imageTag.trim() || "latest" // ส่ง Tag ไปด้วย
        }),
      });

      const scanData = await scanRes.json();

      // ✅ แก้ไข: ใช้ pipelineId ในการ Redirect (แทน scanId)
      // เพราะ scanId คือ ID ของ Engine กลาง (ซ้ำกันทุกคน) แต่ pipelineId คือ ID ของการรันรอบนี้ (ไม่ซ้ำ)
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
      <form onSubmit={onSubmit} className="w-full max-w-xl p-6 space-y-6 bg-white rounded-xl border border-slate-200 shadow-sm mt-6 relative z-10">
        
        {/* Banner Monorepo */}
        {isContinuityMode && (
           <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-start justify-between gap-3 animate-in slide-in-from-top-2">
               <div className="flex items-start gap-3">
                   <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                        <GitBranch size={18} />
                   </div>
                   <div>
                       <h4 className="text-sm font-bold text-indigo-900">Multi-Service Build Mode</h4>
                       <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                           Add another service for <b>{groupName || "this repository"}</b>.<br/>
                           Please specify the <b>Build Directory</b> below.
                       </p>
                   </div>
               </div>
               <button type="button" onClick={handleReset} className="text-xs text-slate-500 underline hover:text-slate-800 whitespace-nowrap">
                  Clear / Start New
               </button>
           </div>
        )}

        <div className="border-b pb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {buildMode ? "Scan & Build Configuration" : "Security Scan Configuration"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">Configure your repository and build settings.</p>
        </div>

        {/* ================= REPOSITORY SECTION (GROUP) ================= */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <FolderTree size={14}/> Repository (Project Group)
                </h3>
                {repoUrl && (
                    <div className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono flex items-center gap-1">
                        <Info size={10}/> Detected Owner: <span className="font-bold text-slate-700">{repoOwner}</span>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1.5 font-semibold text-slate-700 text-sm">Git Repository URL</label>
                    <div className="relative">
                        <input
                            type="url"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/owner/repo"
                            required
                            className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition ${isContinuityMode ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-white'}`}
                        />
                        {isContinuityMode && <div className="absolute right-3 top-2 text-slate-400"><Lock size={16} /></div>}
                    </div>
                </div>
                <div>
                    <label className="block mb-1.5 font-semibold text-slate-700 text-sm">Group Name</label>
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
                 <div className="flex items-center gap-2 mb-2">
                    <input type="checkbox" id="isPrivate" checked={isPrivateRepo} onChange={(e) => setIsPrivateRepo(e.target.checked)} className="w-4 h-4 accent-blue-600"/>
                    <label htmlFor="isPrivate" className="text-sm font-medium text-slate-700 cursor-pointer">Private Repository?</label>
                 </div>
                 {isPrivateRepo && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pl-6 border-l-2 border-slate-200 animate-in fade-in slide-in-from-top-1">
                        <input type="text" value={gitUser} onChange={e => setGitUser(e.target.value)} placeholder="Git Username" className="border p-2 rounded text-sm outline-none"/>
                        <div className="relative">
                            <input type="password" value={gitToken} onChange={e => setGitToken(e.target.value)} placeholder="Git Token" className="w-full border p-2 rounded text-sm outline-none"/>
                            <TokenValidator isValid={gitValid} isValidating={gitValidating} onValidate={validateGit} />
                        </div>
                    </div>
                 )}
            </div>
        </div>

        <hr className="border-slate-100" />

        {/* ================= SERVICE SECTION (IMAGE) ================= */}
        <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Server size={14}/> Service & Build (Image)
            </h3>

            {/* Service Name & Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="mb-1.5 font-semibold text-slate-700 text-sm flex items-center">
                        Service Name 
                        <InfoTooltip text="A logical name to identify this service (e.g. 'backend', 'api', 'frontend'). It helps organize your scan history." />
                    </label>
                    <input
                        type="text"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        placeholder="e.g. backend"
                        required
                        className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                    />
                </div>
                <div>
                    <label className="block mb-1.5 font-semibold text-slate-700 text-sm">Build Directory</label>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 select-none">/root/</span>
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
            
            {/* Custom Dockerfile Button */}
            <div className="border rounded-lg p-3 bg-white border-slate-200 hover:border-blue-300 transition group flex justify-between items-center">
                 <div className="flex items-center gap-2">
                     <FileText size={16} className="text-slate-400 group-hover:text-blue-500"/>
                     <span className="text-sm text-slate-600">Dockerfile Config</span>
                     {useCustomDockerfile && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded">Custom</span>}
                 </div>
                 <button type="button" onClick={() => setIsEditorOpen(true)} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded text-slate-700 font-medium">
                     {useCustomDockerfile ? "Edit Code" : "Customize"}
                 </button>
            </div>

            {/* Docker Credentials & Image Config */}
            {buildMode && (
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                 
                 {/* PREVIEW BOX */}
                 <div className="bg-blue-100 p-3 rounded-lg border border-blue-200 text-xs text-blue-800">
                    <p className="font-semibold uppercase tracking-wide mb-1 opacity-70 flex justify-between">
                        <span>Target Image Preview</span>
                        <span className="text-[10px] bg-blue-200 px-1.5 rounded text-blue-900">Auto-Generated</span>
                    </p>
                    <p className="font-mono break-all text-sm flex items-center gap-1">
                       <Box size={14} />
                       index.docker.io/<span className="font-bold">{dockerUser || "user"}</span>/<span className="font-bold">{imageName || "repo-service"}</span>:<span className="font-bold bg-yellow-100 px-1 rounded text-yellow-800 border border-yellow-200">{imageTag}</span>
                    </p>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 text-xs font-semibold text-slate-500">Docker User</label>
                        <input value={dockerUser} onChange={(e) => setDockerUser(e.target.value)} placeholder="Docker Hub User" className="w-full border p-2 rounded text-sm outline-none bg-white" />
                    </div>
                    <div className="relative">
                        <label className="block mb-1 text-xs font-semibold text-slate-500">Docker Token</label>
                        <input value={dockerToken} onChange={(e) => setDockerToken(e.target.value)} placeholder="Docker Hub Token" type="password" className="w-full border p-2 rounded text-sm outline-none bg-white" />
                        <div className="top-8 right-0 absolute"><TokenValidator isValid={dockerValid} isValidating={dockerValidating} onValidate={validateDocker} /></div>
                    </div>
                 </div>
                 
                 {/* IMAGE NAME & TAG */}
                 <div className="pt-2 border-t border-blue-100">
                     <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="mb-1 text-xs font-bold text-slate-700 flex items-center">
                                Target Image Name
                                <InfoTooltip text="The full repository path where the Docker image will be pushed (e.g. 'repo-name' or 'project/service'). Excludes registry URL and tag." />
                            </label>
                            <input 
                                value={imageName} 
                                onChange={(e) => setImageName(e.target.value)} 
                                placeholder="repo-service"
                                className="w-full border p-2 rounded text-sm outline-none font-mono text-slate-700 bg-white"
                            />
                        </div>
                        <div className="w-28">
                            <label className="block mb-1 text-xs font-bold text-slate-700 flex items-center gap-1"><Tag size={12}/> Tag</label>
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

        {/* Submit Button */}
        <div className="pt-2">
          <button disabled={loading} className="w-full bg-slate-900 text-white px-6 py-3.5 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-70 flex justify-center items-center gap-2 shadow-lg shadow-slate-200 transition-all active:scale-[0.98]">
            {loading ? <Loader2 className="animate-spin" /> : (isContinuityMode ? "Save & Scan Next Service" : "Save Project & Start Scan")}
          </button>
        </div>
      </form>
      </div>
      
      {/* Editor Slide-over */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity" onClick={() => setIsEditorOpen(false)} />
      )}
      <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-[600px] lg:w-[800px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isEditorOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Code2 className="text-blue-600"/> Dockerfile Editor</h3>
                    <p className="text-xs text-slate-500">{buildContext ? `Editing for directory: /${buildContext}` : "Editing for Root directory"}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-300 shadow-sm">
                        <LayoutTemplate size={14} className="text-slate-500"/>
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
                    <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500"><X size={20} /></button>
                </div>
            </div>
            <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden flex flex-col">
                {loadingTemplate && <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center"><Loader2 className="animate-spin text-white w-8 h-8"/></div>}
                <div className="px-4 py-2 bg-[#2d2d2d] border-b border-[#444] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <input type="checkbox" id="enableCustom" checked={useCustomDockerfile} onChange={(e) => setUseCustomDockerfile(e.target.checked)} className="accent-blue-500 w-4 h-4 cursor-pointer"/>
                         <label htmlFor="enableCustom" className="text-xs text-gray-300 cursor-pointer select-none">Enable Custom Dockerfile</label>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">Dockerfile</span>
                </div>
                <textarea
                    value={customDockerfileContent}
                    onChange={(e) => { setCustomDockerfileContent(e.target.value); if (!useCustomDockerfile) setUseCustomDockerfile(true); }}
                    placeholder="# Load a template or paste your Dockerfile here..."
                    className="flex-1 w-full p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm outline-none resize-none leading-relaxed"
                    spellCheck={false}
                />
            </div>
            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
                 <div className="text-xs text-amber-600 flex items-center gap-1">{useCustomDockerfile && <><AlertTriangle size={12}/> Overrides default build.</>}</div>
                 <button onClick={() => setIsEditorOpen(false)} className="flex items-center gap-2 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition shadow-lg"><Save size={16} /> Save & Close</button>
            </div>
        </div>
      </div>

      {/* Limit Modal */}
      {showLimitModal && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Limit Reached</h3>
                <p className="text-sm text-slate-600 mb-4">{limitMessage}</p>
                <div className="flex justify-end"><button onClick={() => setShowLimitModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-slate-50">Close</button></div>
            </div>
         </div>
      )}
    </>
  );
}

export default function ScanForm(props: Props) {
    return (
        <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center text-slate-400">Loading Configuration...</div>}>
            <ScanFormContent {...props} />
        </Suspense>
    );
}