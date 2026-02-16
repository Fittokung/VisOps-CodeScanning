"use client";

import { Check, Loader2, X, Circle, Clock, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PipelineJob {
  id: number;
  name: string;
  stage: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  duration: number | null;
}

interface PipelineStepperProps {
  jobs: PipelineJob[];
  status: string;
  scanMode?: string;
  imagePushed?: boolean;
}

export default function PipelineStepper({ 
  jobs, 
  status, 
  scanMode, 
  imagePushed
}: PipelineStepperProps) {

  // Determine stages to show
  let uniqueStages: string[] = [];
  const jobsByStage: Record<string, PipelineJob[]> = {};

  // 1. If we have real jobs, use their stages
  if (jobs && jobs.length > 0) {
      jobs.forEach(job => {
        if (!uniqueStages.includes(job.stage)) {
          uniqueStages.push(job.stage);
        }
        if (!jobsByStage[job.stage]) {
          jobsByStage[job.stage] = [];
        }
        jobsByStage[job.stage].push(job);
      });
  } else {
      // 2. Fallback: Use default expected stages if no jobs yet
      const expectedStages = scanMode === "SCAN_ONLY" 
        ? ["security-scan"] 
        : ["security-scan", "build", "test", "release"];
      
      uniqueStages = [...expectedStages];
      expectedStages.forEach(stage => {
          jobsByStage[stage] = [];
      });
  }
  
  // [NEW] Inject "Docker Push" stage manually if SCAN_AND_BUILD
  // We use "release" as the internal stage name for consistency
  if (scanMode === "SCAN_AND_BUILD") {
      // If we are using real jobs, check if 'release' stage exists
      // If not, and we have real jobs, maybe we shouldn't force it unless we really want to?
      // Actually, for VisOps flow, we usually want to see the Release step at the end.
      
      if (!jobsByStage["release"] || jobsByStage["release"].length === 0) {
           // Only add if we are in the fallback mode OR if we want to force it to appear
           // If we have real jobs, and 'release' is missing, it might be because it's not in the GitLab pipeline yet or at all.
           // But our "Confirm & Push" button logic often implies a manual release step.
           
           if (!uniqueStages.includes("release")) {
               uniqueStages.push("release");
           }
           jobsByStage["release"] = [{
              id: 999999,
              name: "Push to Registry",
              stage: "release",
              status: imagePushed ? "success" : "manual_pending", // Custom status
              started_at: null,
              finished_at: null,
              duration: null
          }];
      }
  }

  // Sort stages
  // Sort stages
  const stageOrder = [
    "setup", 
    "security_audit", 
    "security-scan", // Fallback
    "compile", 
    "build", // Fallback
    "test", // Fallback
    "build_artifact", 
    "container_scan", 
    "release",
    "cleanup"
  ];

  uniqueStages.sort((a, b) => {
    const idxA = stageOrder.indexOf(a);
    const idxB = stageOrder.indexOf(b);
    
    // Both are known stages
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    
    // One is known, one is unknown
    if (idxA !== -1) return -1; // Known comes first? Actually we want unknowns to be handled gracefully.
    // If we have unknown stages, where should they go?
    // Let's put unknowns at the END, but BEFORE cleanup if possible.
    // But simplistic approach: Known first.
    if (idxB !== -1) return 1;

    // Both unknown: keep original order
    return 0;
  });

  const getStageStatus = (stageJobs: PipelineJob[]) => {
    if (stageJobs.some(j => j.status === 'failed')) return 'failed';
    if (stageJobs.some(j => j.status === 'running')) return 'running';
    if (stageJobs.some(j => j.status === 'pending')) return 'pending';
    if (stageJobs.every(j => j.status === 'success' || j.status === 'skipped')) return 'success';
    if (stageJobs.every(j => j.status === 'created')) return 'pending';
    if (stageJobs.some(j => j.status === 'canceled')) return 'canceled';
    return 'pending';
  };

  const formatStageName = (name: string) => {
    if (name === "release") return "PUSH TO REGISTRY"; // More descriptive
    return name.replace(/_/g, " ").replace(/-/g, " ");
  };

   const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="relative flex items-start justify-between w-full px-2">
          {uniqueStages.map((stage, index) => {
            const stageJobs = jobsByStage[stage];
            let stageStatus = getStageStatus(stageJobs);
            
            const isRelease = stage === "release"; 
            if (isRelease && imagePushed) {
                stageStatus = 'success'; 
            }

            const isCompleted = stageStatus === 'success';
            const isRunning = stageStatus === 'running';
            const isFailed = stageStatus === 'failed';
            const isPending = stageStatus === 'pending' || stageStatus === 'canceled' || stageStatus === 'created' || stageStatus === 'manual';

            const totalDuration = stageJobs.reduce((acc, j) => acc + (j.duration || 0), 0);
            
            // Determine connector color
            const isLast = index === uniqueStages.length - 1;
            const connectorColor = isCompleted 
                ? "bg-emerald-500" 
                : "bg-slate-200 dark:bg-slate-700";

            return (
              <div key={stage} className="relative flex flex-col items-center flex-1 group min-w-0">
                 {/* Connector Line (to the right) */}
                 {!isLast && (
                   <div 
                      className={cn(
                        "absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2 transition-colors duration-500 z-0",
                        connectorColor
                      )} 
                   />
                 )}

                {/* Status Point */}
                <div className={cn(
                  "relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 bg-white dark:bg-slate-900",
                  isCompleted ? (isRelease ? "border-emerald-500 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-emerald-500 text-emerald-500") :
                  isRunning ? "border-blue-500 text-blue-500 scale-110 shadow-lg shadow-blue-500/20" :
                  isFailed ? "border-red-500 text-red-500" :
                  "border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600"
                )}>
                  {isRelease ? (
                      <Rocket size={18} className={cn(isCompleted && "text-emerald-600 dark:text-emerald-400")} />
                  ) : (
                      <>
                          {isCompleted && <Check size={18} strokeWidth={3} />}
                          {isRunning && <Loader2 size={18} className="animate-spin" />}
                          {isFailed && <X size={18} strokeWidth={3} />}
                          {isPending && <Circle size={10} fill="currentColor" className="text-slate-200 dark:text-slate-700" />}
                      </>
                  )}
                </div>
                
                {/* Label & Details */}
                <div className="flex flex-col items-center mt-3 gap-1 w-full px-1">
                  <span className={cn(
                    "text-[10px] md:text-xs font-bold uppercase tracking-wider text-center transition-colors truncate w-full",
                    isCompleted ? "text-slate-900 dark:text-white" :
                    isRunning ? "text-blue-600 dark:text-blue-400" :
                    isFailed ? "text-red-600 dark:text-red-400" :
                    "text-slate-400 dark:text-slate-500"
                  )} title={formatStageName(stage)}>
                    {formatStageName(stage)}
                  </span>
                  
                  {/* Duration Badge */}
                  {totalDuration > 0 && (
                     <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <Clock size={10} />
                        {formatDuration(totalDuration)}
                     </div>
                  )}
                </div>
                
                {/* Hover Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute top-14 translate-y-2 group-hover:translate-y-0 bg-slate-900 text-white text-xs rounded-lg py-2 px-3 min-w-[150px] pointer-events-none z-20 shadow-xl border border-slate-700">
                    <div className="font-semibold border-b border-slate-700 pb-1 mb-1 text-slate-300">
                      {formatStageName(stage)} Jobs
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {stageJobs.map(j => (
                          <div key={j.id} className="flex justify-between items-center gap-3">
                              <span className="text-slate-300">{j.name}</span>
                              <span className={cn(
                                  "uppercase text-[9px] font-bold px-1.5 py-0.5 rounded",
                                  j.status === 'success' ? "bg-emerald-500/20 text-emerald-400" :
                                  j.status === 'failed' ? "bg-red-500/20 text-red-400" :
                                  j.status === 'running' ? "bg-blue-500/20 text-blue-400" :
                                  "bg-slate-700 text-slate-400"
                              )}>
                                {j.status}
                              </span>
                          </div>
                      ))}
                    </div>
                    {/* Arrow */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-t border-l border-slate-700 rotate-45"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
  );
}
