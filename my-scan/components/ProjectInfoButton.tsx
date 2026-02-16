"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { ProjectInfoModal } from "@/components/ProjectInfoModal";

interface ProjectInfoButtonProps {
  projectId: string;
}

export default function ProjectInfoButton({ projectId }: ProjectInfoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors text-xs font-medium border-l border-slate-300 dark:border-slate-700 ml-2 pl-2"
      >
        <Info size={14} />
        <span>Details Info</span>
      </button>

      <ProjectInfoModal
        projectId={projectId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
