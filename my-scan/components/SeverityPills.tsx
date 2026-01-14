// /components/SeverityPills.tsx
"use client";
import React from "react";

export default function SeverityPills({
  counts,
}: {
  counts?: { critical: number; high: number; medium: number; low: number };
}) {
  const c = counts || { critical: 0, high: 0, medium: 0, low: 0 };

  return (
    <div className="flex gap-2">
      <div className="px-3 py-1 rounded bg-red-200">
        Critical: {c.critical}
      </div>
      <div className="px-3 py-1 rounded bg-orange-200">
        High: {c.high}
      </div>
      <div className="px-3 py-1 rounded bg-yellow-200">
        Medium: {c.medium}
      </div>
      <div className="px-3 py-1 rounded bg-green-200">
        Low: {c.low}
      </div>
    </div>
  );
}
