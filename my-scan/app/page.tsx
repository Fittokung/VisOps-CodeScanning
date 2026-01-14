// /app/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Shield, Container, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      // If logged in, redirect based on setup status
      const isSetupComplete = (session?.user as any)?.isSetupComplete;
      if (isSetupComplete) {
        router.push("/dashboard");
      } else {
        router.push("/setup");
      }
    }
  }, [status, session, router]);

  // Show landing page for unauthenticated users
  if (status === "loading") {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">VisOps Scan</h1>
          <p className="text-gray-600 text-lg mb-8">
            Automated security scanning and vulnerability detection
          </p>

          {/* Login Button */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="white"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="white"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                fill="white"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="white"
              />
            </svg>
            Continue with Google
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <Shield className="w-6 h-6 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-1 text-gray-900">
              Security Scanning
            </h3>
            <p className="text-sm text-gray-600">
              Gitleaks, Semgrep, and Trivy integration
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <Container className="w-6 h-6 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-1 text-gray-900">
              Container Scanning
            </h3>
            <p className="text-sm text-gray-600">
              Docker image vulnerability detection
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <TrendingUp className="w-6 h-6 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-1 text-gray-900">Scan History</h3>
            <p className="text-sm text-gray-600">
              Track and compare results over time
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
