"use client";

import { ReactNode, useState } from "react";

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

export default function Tooltip({
  children,
  content,
  position = "top",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-[10px] font-medium text-white bg-slate-900 rounded shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 ${
            position === "top"
              ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
              : position === "bottom"
              ? "top-full mt-2 left-1/2 -translate-x-1/2"
              : position === "left"
              ? "right-full mr-2 top-1/2 -translate-y-1/2"
              : "left-full ml-2 top-1/2 -translate-y-1/2"
          }`}
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 border-transparent ${
              position === "top"
                ? "border-t-slate-900 top-full left-1/2 -translate-x-1/2"
                : position === "bottom"
                ? "border-b-slate-900 bottom-full left-1/2 -translate-x-1/2"
                : position === "left"
                ? "border-l-slate-900 left-full top-1/2 -translate-y-1/2"
                : "border-r-slate-900 right-full top-1/2 -translate-y-1/2"
            }`}
          />
        </div>
      )}
    </div>
  );
}
