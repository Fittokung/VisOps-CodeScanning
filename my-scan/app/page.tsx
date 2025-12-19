// /app/page.tsx
import Link from "next/link";
import TutorialSlider from "@/components/TutorialSlider";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl space-y-12">
        {/* Tutorial Section */}
        <TutorialSlider />

        {/* Divider
        <div className="border-t" /> */}

        {/* Action Section */}
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {/* <h1 className="text-2xl font-bold text-center">
            VisScan — Code & Image Scanning (Mock)
          </h1> */}

          <p className="text-center text-gray-600">
            Choose how you want to scan the repository
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/scan/build"
              className="block border bg-white p-6 rounded-lg hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold mb-2">Scan & Build</h3>
              <p className="text-sm text-gray-600">
                Scan source code and optionally build & push Docker image after
                confirmation
              </p>
            </Link>

            <Link
              href="/scan/scanonly"
              className="block border bg-white p-6 rounded-lg hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold mb-2">Scan Only</h3>
              <p className="text-sm text-gray-600">
                Run security scans (Gitleaks, Semgrep, Trivy) and review results
                only
              </p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
