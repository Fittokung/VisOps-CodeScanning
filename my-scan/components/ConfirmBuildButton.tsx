// /components/ConfirmBuildButton.tsx
"use client";
import React, { useState } from "react";

export default function ConfirmBuildButton({ scanId }: { scanId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onConfirm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/scan/confirm-build/${scanId}`, {
        method: "POST",
      });
      const j = await res.json();
      setMessage(
        res.ok
          ? `Build queued: ${j.buildStatus}`
          : `Error: ${JSON.stringify(j)}`
      );
    } catch (e) {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={onConfirm}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Queuing build..." : "Confirm Build"}
      </button>
      {message && <div className="mt-2 text-sm">{message}</div>}
    </div>
  );
}
