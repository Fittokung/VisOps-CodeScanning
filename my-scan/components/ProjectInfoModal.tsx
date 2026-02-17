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
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0 gap-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl block">
        
        {/* Header Banner */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Box className="w-6 h-6 text-blue-600 dark:text-blue-400" />
             </div>
             <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {info?.projectName || "Loading Project..."}
                </DialogTitle>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <a href={info?.settings.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                        <GitBranch size={12} />
                        {info?.settings.repoUrl?.replace("https://github.com/", "") || "..."}
                    </a>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <div className="flex items-center gap-1">
                        {info?.settings.isPrivateRepo ? <Lock size={10} /> : <Globe size={10} />}
                        {info?.settings.isPrivateRepo ? "Private" : "Public"}
                    </div>
                </div>
             </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
            {error ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/20 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" /> {error}
                </div>
            ) : !info ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-sm text-slate-400">Loading details...</p>
                </div>
            ) : (
                <>
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Services</p>
                             <p className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {info.serviceCount}
                                <span className="text-xs font-normal text-slate-500">Active</span>
                             </p>
                        </div>
                         <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Security</p>
                             <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
                                <Shield size={14} /> Enabled
                             </p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 col-span-2">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Credentials</p>
                             <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                                    <GitBranch size={12} className="text-[#F1502F]" />
                                    {info.credentials.gitUser}
                                </div>
                                <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                                    <Box size={12} className="text-[#0db7ed]" />
                                    {info.credentials.dockerUser}
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Services List */}
                    <div className="space-y-3">
                        <SectionHeader icon={Server} title="Configured Services" />
                        <div className="grid grid-cols-1 gap-2">
                            {info.services?.map((svc, idx) => (
                                <div key={idx} className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-900 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                            {svc.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-none mb-1">{svc.name}</h4>
                                            <p className="text-xs text-slate-500 font-mono">{svc.image}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-[10px] font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 font-mono flex items-center gap-1.5">
                                            <span className="text-slate-400">path:</span> {svc.context}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dockerfile Preview */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                             <SectionHeader icon={FileCode} title="Dockerfile Preview" />
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
                                   {info.dockerfileSource}
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={handleCopy} 
                                    className="h-6 text-[10px] px-2 text-slate-500 hover:text-blue-600"
                                >
                                    {copied ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />}
                                    {copied ? "Copied" : "Copy"}
                                </Button>
                             </div>
                        </div>
                        
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                            <pre className="block p-4 text-[10px] font-mono leading-relaxed overflow-x-auto h-[180px] text-slate-600 dark:text-slate-400 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                                <code>{info.dockerfileContent}</code>
                            </pre>
                            {/* Gradient Fade for long content */}
                            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent pointer-events-none" />
                        </div>
                    </div>
                </>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
