// app/setup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle, XCircle, Loader2, ShieldCheck } from "lucide-react";

export default function SetupWizard() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    githubPAT: "",
    githubUsername: "",
    dockerUsername: "",
    dockerToken: "",
  });

  const [validation, setValidation] = useState({
    github: { valid: false, message: "" },
    docker: { valid: false, message: "" },
  });

  const handleValidate = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/setup/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Validation failed");
        setValidation({
          github: {
            valid: result.githubValid || false,
            message: result.errors?.github || "",
          },
          docker: {
            valid: result.dockerValid || false,
            message: result.errors?.docker || "",
          },
        });
        return;
      }

      if (result.githubValid && result.dockerValid) {
        setValidation({
          github: {
            valid: true,
            message: `✓ Connected as ${result.githubUsername}`,
          },
          docker: { valid: true, message: "✓ Authentication successful" },
        });
        // Auto-fill usernames from validation result
        setFormData((prev) => ({
          ...prev,
          githubUsername: result.githubUsername || prev.githubUsername,
          dockerUsername: result.dockerUsername || prev.dockerUsername,
        }));
        setStep(2);
      } else {
        setValidation({
          github: {
            valid: result.githubValid,
            message: result.errors?.github || "",
          },
          docker: {
            valid: result.dockerValid,
            message: result.errors?.docker || "",
          },
        });
        setError("Some tokens failed validation. Please check and try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to validate tokens");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Setup failed");
        return;
      }

      // Setup completed successfully - update session to refresh isSetupComplete
      await update();

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Failed to complete setup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Setup Your Account
            </h1>
          </div>
          <p className="text-gray-600 text-sm">
            Connect your GitHub and Docker Hub credentials
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${
                step >= 1 ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold text-sm ${
                  step >= 1
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300"
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium">Validate</span>
            </div>
            <div
              className={`h-0.5 w-12 ${
                step >= 2 ? "bg-blue-600" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`flex items-center gap-2 ${
                step >= 2 ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold text-sm ${
                  step >= 2
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300"
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium">Confirm</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Token Input */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Personal Access Token (PAT)
              </label>
              <input
                type="password"
                value={formData.githubPAT}
                onChange={(e) =>
                  setFormData({ ...formData, githubPAT: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              />
              {validation.github.message && (
                <div
                  className={`mt-2 text-sm flex items-center gap-2 ${
                    validation.github.valid ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {validation.github.valid ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {validation.github.message}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Required scopes:{" "}
                <code className="bg-gray-100 px-1 rounded">repo</code>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Username
              </label>
              <input
                type="text"
                value={formData.githubUsername}
                onChange={(e) =>
                  setFormData({ ...formData, githubUsername: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your-github-username"
              />
              <p className="mt-1 text-xs text-gray-500">
                Your GitHub account username
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Docker Hub Username
              </label>
              <input
                type="text"
                value={formData.dockerUsername}
                onChange={(e) =>
                  setFormData({ ...formData, dockerUsername: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your-dockerhub-username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Docker Hub Token or Password
              </label>
              <input
                type="password"
                value={formData.dockerToken}
                onChange={(e) =>
                  setFormData({ ...formData, dockerToken: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="dckr_pat_xxxxxxxxxxxxxxxxxxxx"
              />
              {validation.docker.message && (
                <div
                  className={`mt-2 text-sm flex items-center gap-2 ${
                    validation.docker.valid ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {validation.docker.valid ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {validation.docker.message}
                </div>
              )}
            </div>

            <button
              onClick={handleValidate}
              disabled={
                loading ||
                !formData.githubPAT ||
                !formData.dockerUsername ||
                !formData.dockerToken
              }
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Validating..." : "Validate & Continue"}
            </button>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-900">
                  Tokens Validated Successfully
                </h3>
              </div>
              <div className="space-y-1 text-sm text-green-700">
                <p>{validation.github.message}</p>
                <p>{validation.docker.message}</p>
              </div>
            </div>

            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-semibold text-blue-900">
                  Security Notes
                </h3>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                <li>Tokens encrypted with AES-256</li>
                <li>Maximum 6 active projects per account</li>
                <li>Isolated sandboxed build environments</li>
                <li>Critical vulnerabilities block deployment</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Completing..." : "Complete Setup"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
