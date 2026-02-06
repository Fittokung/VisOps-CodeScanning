//my-scan\app\admin\template\page.tsx

"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Code2, RotateCcw, CheckCircle2 } from "lucide-react";

const SUPPORTED_STACKS = [
  { id: "default", label: "Default / Generic" },
  { id: "node", label: "Node.js" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java (Maven)" },
  { id: "go", label: "Go Lang" },
  { id: "nginx", label: "Nginx / Static" },
];

export default function AdminTemplatesPage() {
  const [selectedStack, setSelectedStack] = useState("default");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // โหลด Template เมื่อเปลี่ยน Stack
  useEffect(() => {
    async function loadTemplate() {
      setLoading(true);
      try {
        const res = await fetch(`/api/templates?stack=${selectedStack}`);
        const text = await res.text();
        setContent(text);
      } catch (error) {
        alert("Failed to load template");
      } finally {
        setLoading(false);
      }
    }
    loadTemplate();
  }, [selectedStack]);

  // บันทึก Template ลง Database
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stack: selectedStack, content }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setLastSaved(new Date());
      // Show success feedback logic here if needed
    } catch (error) {
      alert("Error saving template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Dockerfile Templates
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage global default Dockerfiles for each technology stack.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Menu */}
          <div className="lg:col-span-1 space-y-2">
            {SUPPORTED_STACKS.map((stack) => (
              <button
                key={stack.id}
                onClick={() => setSelectedStack(stack.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between
                  ${
                    selectedStack === stack.id
                      ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-900/50"
                      : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
              >
                <span>{stack.label}</span>
                {selectedStack === stack.id && (
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                )}
              </button>
            ))}
          </div>

          {/* Editor Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[600px]">
              {/* Toolbar */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Code2 size={18} className="text-slate-400" />
                  <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase">
                    {selectedStack}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {lastSaved && (
                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 size={12} /> Saved{" "}
                      {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Save Template
                  </button>
                </div>
              </div>

              {/* Text Area */}
              <div className="flex-1 relative bg-[#1e1e1e]">
                {loading && (
                  <div className="absolute inset-0 bg-[#1e1e1e]/80 flex items-center justify-center z-10">
                    <Loader2 className="animate-spin text-white w-8 h-8" />
                  </div>
                )}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm outline-none resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>

              {/* Footer Helper */}
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                <p>Supports standard Dockerfile syntax.</p>
                <p>Changes apply to all future scans using this stack.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
