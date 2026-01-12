// app/layout.tsx
import "./globals.css";
import React from "react";
import { Providers } from "./providers";

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
