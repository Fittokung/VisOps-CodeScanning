import { ReactNode, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

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
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY; // Use fixed, so we don't need scrollY if using fixed position.
      // Actually standard Portals often use absolute + scrollY, or fixed.
      // Let's use FIXED positioning to keep it simple and relative to viewport.
      
      let top = 0;
      let left = 0;

      // Base positions (centering logic handled by transform in CSS)
      switch (position) {
        case "top":
          top = rect.top - 8; // 8px gap
          left = rect.left + rect.width / 2;
          break;
        case "bottom":
          top = rect.bottom + 8;
          left = rect.left + rect.width / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2;
          left = rect.left - 8;
          break;
        case "right":
          top = rect.top + rect.height / 2;
          left = rect.right + 8;
          break;
      }
      setCoords({ top, left });
      setIsVisible(true);
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="relative flex items-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>

      {mounted && isVisible && createPortal(
        <div
          className={`fixed z-[9999] px-2 py-1 text-[10px] font-medium text-white bg-slate-900 rounded shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 pointer-events-none ${
            position === "top"
              ? "-translate-x-1/2 -translate-y-full"
              : position === "bottom"
              ? "-translate-x-1/2"
              : position === "left"
              ? "-translate-x-full -translate-y-1/2"
              : "-translate-y-1/2"
          }`}
          style={{
            top: coords.top,
            left: coords.left,
          }}
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
        </div>,
        document.body
      )}
    </>
  );
}
