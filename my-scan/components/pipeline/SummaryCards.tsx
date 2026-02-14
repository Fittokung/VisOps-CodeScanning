import React from "react";
import { ShieldAlert, AlertTriangle, AlertCircle, Info } from "lucide-react";

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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-slate-500" /> Findings Summary
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "Critical",
            count: counts.critical,
            color: "text-red-700 bg-red-50 border-red-200 hover:bg-red-100",
            icon: <AlertCircle className="w-4 h-4 text-red-600" />,
          },
          {
            label: "High",
            count: counts.high,
            color: "text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100",
            icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
          },
          {
            label: "Medium",
            count: counts.medium,
            color: "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100",
            icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          },
          {
            label: "Low",
            count: counts.low,
            color: "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100",
            icon: <Info className="w-4 h-4 text-blue-600" />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`p-3 rounded-lg border transition-all duration-200 ${stat.color} flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{stat.label}</span>
                {stat.icon}
            </div>
            <div className="text-3xl font-bold tracking-tight">{stat.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
