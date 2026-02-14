"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Loader2, FileCode, Lock, Settings, Copy, Check, GitBranch, Box, Globe, Shield, User, Key, Server } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface ProjectInfoModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ProjectInfo {
  projectName: string;
  imageName: string;
  contextPath: string;
  dockerfileSource: string;
  dockerfileContent: string;
  serviceCount: number;
  services: Array<{
    name: string;
    image: string;
    context: string;
  }>;
  credentials: {
    gitUser: string;
    dockerUser: string;
  };
  settings: {
    isPrivateRepo: boolean;
    repoUrl: string;
  };
}

import { TiltCard } from "@/components/ui/TiltCard";

export function ProjectInfoModal({ projectId, isOpen, onClose }: ProjectInfoModalProps) {
  // ... (keep existing state)
  const [info, setInfo] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchInfo();
    }
  }, [isOpen, projectId]);

  const fetchInfo = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/info`);
      if (!res.ok) throw new Error("Failed to fetch project info");
      const data = await res.json();
      setInfo(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (info?.dockerfileContent) {
      navigator.clipboard.writeText(info.dockerfileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper for Section Headers
  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2 mb-3">
      <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
         <Icon size={14} />
      </div>
      {title}
    </h3>
  );

  // Helper for Info Item
  const InfoItem = ({ label, value, icon: Icon, copyable = false }: { label: string, value: string, icon?: any, copyable?: boolean }) => (
    <div className="group flex flex-col gap-1 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon size={10} />}
        {label}
      </span>
      <div className="flex items-center justify-between gap-2">
         {/* [NEW] Removed truncate, added break-all for potentially long text */}
         <span className="text-sm font-mono text-slate-700 dark:text-slate-300 break-all" title={value}>
            {value}
         </span>
         {copyable && (
            <button 
                onClick={() => navigator.clipboard.writeText(value)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500 transition-all p-1"
            >
                <Copy size={12} />
            </button>
         )}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* [NEW] increased width to max-w-5xl */}
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        
        {/* Header Banner */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex items-start justify-between pr-12">
          <div className="space-y-1">
             <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {info?.projectName || "Loading..."}
                {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
             </DialogTitle>
             <div className="flex items-center gap-2 text-sm text-slate-500">
                <GitBranch size={14} />
                <a href={info?.settings.repoUrl} target="_blank" rel="noreferrer" className="hover:text-blue-500 hover:underline transition-colors truncate max-w-sm block">
                    {info?.settings.repoUrl || "..."}
                </a>
             </div>
          </div>
          
          {info && (
             <div className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border",
                info.settings.isPrivateRepo 
                    ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30"
                    : "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
             )}>
                {info.settings.isPrivateRepo ? <Lock size={10} /> : <Globe size={10} />}
                {info.settings.isPrivateRepo ? "Private" : "Public"}
             </div>
          )}
        </div>

        <div className="p-6 space-y-8">
            {error ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30">
                    {error}
                </div>
            ) : !info ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-sm text-slate-400">Loading project details...</p>
                </div>
            ) : (
                <>
                    {/* Top Grid: Config & Credentials & Services */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Left: Configuration & Services */}
                        <TiltCard className="space-y-4 p-4 rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-900/20 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all group/tilt">
                            <SectionHeader icon={Settings} title={`Configuration (${info.serviceCount} Services)`} />
                            
                            {/* Service List */}
                            <div className="space-y-2">
                                {info.services && info.services.length > 0 ? (
                                    info.services.map((svc, idx) => (
                                        <div key={idx} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 p-3 shadow-sm flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                 <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500">
                                                    <Server size={14} />
                                                 </div>
                                                 <div>
                                                     <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{svc.name}</p>
                                                     <p className="text-sm font-mono text-slate-500 dark:text-slate-400">{svc.image}</p>
                                                 </div>
                                            </div>
                                            <div className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">
                                                {svc.context}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-sm text-slate-500 italic">No services details available</div>
                                )}
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-xs font-semibold text-slate-400 uppercase">Security Scan</span>
                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                        Enabled (Trivy + Gitleaks)
                                    </span>
                                </div>
                            </div>
                        </TiltCard>

                        {/* Right: Credentials */}
                        <TiltCard className="space-y-4 p-4 rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-900/20 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all group/tilt">
                             <SectionHeader icon={Key} title="Credentials" />
                             <div className="grid grid-cols-1 gap-3">
                                {/* Git Creds */}
                                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-[#F1502F]/10 text-[#F1502F]">
                                            <GitBranch size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Git Access</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{info.credentials.gitUser}</p>
                                        </div>
                                    </div>
                                    <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono text-slate-500">
                                        ••••••••
                                    </div>
                                </div>

                                {/* Docker Creds */}
                                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-[#0db7ed]/10 text-[#0db7ed]">
                                            <Box size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Docker Hub</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{info.credentials.dockerUser}</p>
                                        </div>
                                    </div>
                                    <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono text-slate-500">
                                        ••••••••
                                    </div>
                                </div>
                             </div>
                        </TiltCard>
                    </div>

                    {/* Bottom: Dockerfile */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                             <SectionHeader icon={FileCode} title="Dockerfile Preview" />
                             <div className="text-xs text-slate-400 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                Source: <span className="font-semibold text-blue-500">{info.dockerfileSource}</span>
                             </div>
                        </div>
                        
                        <div className="relative group/code">
                            <div className="absolute top-3 right-3 opacity-0 group-hover/code:opacity-100 transition-all z-10">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleCopy} 
                                    className="h-7 text-xs shadow-sm bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 backdrop-blur-sm border-slate-200 dark:border-slate-700"
                                >
                                    {copied ? <Check size={12} className="mr-1.5 text-green-500" /> : <Copy size={12} className="mr-1.5" />}
                                    {copied ? "Copied" : "Copy"}
                                </Button>
                            </div>
                            <pre className="block w-full bg-[#0d1117] text-slate-300 p-4 rounded-xl text-xs overflow-x-auto font-mono border border-slate-800 shadow-inner h-[250px] overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                <code>{info.dockerfileContent}</code>
                            </pre>
                        </div>
                    </div>
                </>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
