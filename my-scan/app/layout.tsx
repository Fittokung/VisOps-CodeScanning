import "./globals.css";
import React from "react";
import { Providers } from "./providers";
import ActiveScanMonitor from "@/components/ActiveScanMonitor";

export const metadata = { title: "VisScan", description: "Code scanning UI" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
