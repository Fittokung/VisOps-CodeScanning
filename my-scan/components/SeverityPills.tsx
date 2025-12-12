// /components/SeverityPills.tsx
"use client";
import React from "react";

export default function SeverityPills({
  counts,
}: {
  counts: { critical: number; high: number; medium: number; low: number };
}) {
  return (
    <div className="flex gap-2">
      <div className="px-3 py-1 rounded bg-red-200">
        Critical: {counts.critical}
      </div>
      <div className="px-3 py-1 rounded bg-orange-200">High: {counts.high}</div>
      <div className="px-3 py-1 rounded bg-yellow-200">
        Medium: {counts.medium}
      </div>
      <div className="px-3 py-1 rounded bg-green-200">Low: {counts.low}</div>
    </div>
  );
}
