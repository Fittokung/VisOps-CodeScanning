// /components/FormScan.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  buildMode: boolean;
};

export default function FormScan({ buildMode }: Props) {
  const [repoUrl, setRepoUrl] = useState("");
  const [dockerUser, setDockerUser] = useState("");
  const [dockerToken, setDockerToken] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload: any = {
      repoUrl,
      buildAfterScan: buildMode,
    };
    if (buildMode) {
      payload.dockerUsername = dockerUser;
      // do not store tokens in client in real app — we pass them in mock then discard
      payload.dockerAccessToken = dockerToken;
    }

    const res = await fetch("/api/scan/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j = await res.json();
    setLoading(false);
    if (res.ok && j.scanId) {
      // navigate to pipeline page
      router.push(`/scan/${j.scanId}`);
    } else {
      alert("Failed to start scan: " + JSON.stringify(j));
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl mx-auto p-4 space-y-4">
      <div>
        <label className="block mb-1 font-medium">Git repository URL</label>
        <input
          type="url"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          required
          className="w-full border px-3 py-2 rounded"
        />
      </div>

      {buildMode && (
        <>
          <div>
            <label className="block mb-1 font-medium">Docker username</label>
            <input
              value={dockerUser}
              onChange={(e) => setDockerUser(e.target.value)}
              placeholder="dockerhub username"
              required
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">
              Docker access token
            </label>
            <input
              value={dockerToken}
              onChange={(e) => setDockerToken(e.target.value)}
              placeholder="secret token"
              required
              type="password"
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        </>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {loading ? "Starting..." : "Start Scan"}
        </button>
      </div>
    </form>
  );
}
