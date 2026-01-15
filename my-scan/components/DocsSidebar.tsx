"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navConfig = [
  {
    title: "Overview",
    items: [
      { title: "Introduction", href: "/docs/getting-started" },
      { title: "Architecture", href: "/docs/architecture" },
    ],
  },
  {
    title: "Getting Started",
    items: [
      { title: "Setup & Config", href: "/docs/getting-started#setup" },
      { title: "Quick Start", href: "/docs/getting-started#quick-start" },
    ],
  },
  {
    title: "Guides",
    items: [
      { title: "Scan Only Mode", href: "/docs/guides/scan-only" },
      { title: "Scan & Build Mode", href: "/docs/guides/scan-build" },
    ],
  },
  {
    title: "Reference",
    items: [{ title: "Supported Scanners", href: "/docs/scanners" }],
  },
];

export default function DocsSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-full pt-1">
      <div className="mb-8 px-2 font-bold text-slate-900 tracking-tight">
        VisOps Docs
      </div>
      {navConfig.map((group, index) => (
        <div key={index} className="mb-6">
          <h4 className="mb-2 px-2 text-xs font-semibold text-slate-900 uppercase tracking-wider">
            {group.title}
          </h4>
          <div className="grid grid-flow-row auto-rows-max text-sm">
            {group.items.map((item, itemIndex) => {
              const isActive = pathname === item.href.split("#")[0];
              return (
                <Link
                  key={itemIndex}
                  href={item.href}
                  className={`group flex w-full items-center rounded-md px-2 py-1.5 hover:bg-slate-50 hover:text-slate-900 ${
                    isActive
                      ? "font-medium text-slate-900 bg-slate-100"
                      : "text-slate-500"
                  }`}
                >
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
