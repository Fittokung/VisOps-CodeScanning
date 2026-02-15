"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, FileCode, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserDockerEditorModalProps {
  serviceId: string | null;
  isOpen: boolean;
  onClose: () => void;
  serviceName?: string;
}

export function UserDockerEditorModal({ serviceId, isOpen, onClose, serviceName }: UserDockerEditorModalProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>("unknown");

  useEffect(() => {
    if (isOpen && serviceId) {
      fetchDockerfile();
    } else {
        setContent("");
        setError(null);
    }
  }, [isOpen, serviceId]);

  const fetchDockerfile = async () => {
    if (!serviceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/services/${serviceId}/dockerfile`);
      if (!res.ok) throw new Error("Failed to fetch Dockerfile");
      const data = await res.json();
      setContent(data.content || "");
      setSource(data.source || "unknown");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!serviceId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/services/${serviceId}/dockerfile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      
      if (!res.ok) throw new Error("Failed to save Dockerfile");
      
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Edit Dockerfile: {serviceName}
            {source === "template" && <span className="text-xs font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded ml-2">Template</span>}
            {source === "custom" && <span className="text-xs font-normal bg-purple-100 text-purple-700 px-2 py-0.5 rounded ml-2">Custom</span>}
            {source === "default" && <span className="text-xs font-normal bg-gray-100 text-gray-700 px-2 py-0.5 rounded ml-2">Default</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-slate-950 rounded-md border border-slate-800 p-4 relative overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400">
              <p>{error}</p>
              <Button variant="ghost" size="sm" onClick={fetchDockerfile} className="mt-2">
                <RefreshCw className="h-4 w-4 mr-2" /> Retry
              </Button>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full bg-transparent text-slate-300 font-mono text-sm resize-none outline-none focus:ring-0 p-0"
              spellCheck={false}
              placeholder="# Enter Dockerfile content here..."
            />
          )}
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
