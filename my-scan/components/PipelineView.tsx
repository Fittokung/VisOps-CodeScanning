// /components/PipelineView.tsx
"use client";

import React, { useEffect, useState } from "react";
import SeverityPills from "./SeverityPills";

type Run = {
  id: string;
  repoUrl: string;
  status: string;
  step: string;
  progress: number;
  counts: { critical: number; high: number; medium: number; low: number };
  logs?: string[];
  buildStatus?: string;
  pipelineUrl?: string;
};

export default function PipelineView({ scanId }: { scanId: string }) {
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/scan/status/${scanId}`);
      if (!res.ok) {
        setRun(null);
        return;
      }
      const j = await res.json();
      setRun(j);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 1500);
    return () => clearInterval(t);
  }, [scanId]);

  if (!run) return <div>Loading run...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h2 className="text-xl font-semibold">Scan for {run.repoUrl}</h2>
      <div className="flex items-center justify-between">
        <div>
          <div>
            Status: <strong>{run.status}</strong>
          </div>
          <div>Step: {run.step}</div>
          <div>Progress: {run.progress}%</div>
        </div>
        {run.pipelineUrl && (
          <a
            href={run.pipelineUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600"
          >
            Open pipeline
          </a>
        )}
      </div>

      <div>
        <div className="w-full bg-gray-200 h-3 rounded">
          <div
            className="bg-blue-500 h-3 rounded"
            style={{ width: `${run.progress}%` }}
          />
        </div>
      </div>

      <div>
        <SeverityPills counts={run.counts} />
      </div>

      <div>
        <h3 className="font-medium">Logs (latest)</h3>
        <div className="bg-black text-white p-2 rounded max-h-48 overflow-auto">
          {(run.logs ?? []).slice(-20).map((l, i) => (
            <div key={i} className="text-xs">
              {l}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div>
          Build status: <strong>{run.buildStatus ?? "idle"}</strong>
        </div>
      </div>
    </div>
  );
}
