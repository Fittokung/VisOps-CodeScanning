import React from "react";
import { ShieldAlert } from "lucide-react";

interface SummaryCardsProps {
  counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export const SummaryCards = ({ counts }: SummaryCardsProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4" /> Findings Summary
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "Critical",
            count: counts.critical,
            color: "text-red-600 bg-red-50 border-red-100",
          },
          {
            label: "High",
            count: counts.high,
            color: "text-orange-600 bg-orange-50 border-orange-100",
          },
          {
            label: "Medium",
            count: counts.medium,
            color: "text-yellow-600 bg-yellow-50 border-yellow-100",
          },
          {
            label: "Low",
            count: counts.low,
            color: "text-blue-600 bg-blue-50 border-blue-100",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`p-3 rounded-lg border text-center ${stat.color}`}
          >
            <div className="text-2xl font-bold">{stat.count}</div>
            <div className="text-xs uppercase">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
