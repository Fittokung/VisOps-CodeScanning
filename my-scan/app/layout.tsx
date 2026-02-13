import "./globals.css";
import React from "react";
import { Providers } from "./providers";
import ActiveScanMonitor from "@/components/ActiveScanMonitor";

export const metadata = {
  title: "Vis Scan",
  description: "Code scanning UI",
  icons: {
    icon: "/icon",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen antialiased text-slate-900"
        suppressHydrationWarning={true}
      >
        <Providers>
          {children}
          <ActiveScanMonitor />{" "}
        </Providers>
      </body>
    </html>
  );
}
