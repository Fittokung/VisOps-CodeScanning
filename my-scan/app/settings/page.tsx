"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  Trash2,
  Plus,
  Github,
  Box, // for Docker icon replacement
  CheckCircle2,
  AlertCircle,
  Sliders,
  Key,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Define Credential Type
interface Credential {
  id: string;
  name: string;
  provider: "GITHUB" | "DOCKER";
  username: string;
  isDefault: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<"GITHUB" | "DOCKER">("GITHUB");

  // Form State
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formToken, setFormToken] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated") {
      fetchCredentials();
    }
  }, [status, router]);

  const fetchCredentials = async () => {
    try {
      const res = await fetch("/api/user/settings/credentials");
      const data = await res.json();
      setCredentials(data.credentials || []);
    } catch (error) {
      console.error("Failed to fetch credentials");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = (type: "GITHUB" | "DOCKER") => {
    setModalType(type);
    setFormName("");
    setFormUsername("");
    setFormToken("");
    setFormIsDefault(false);
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/settings/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          provider: modalType,
          username: formUsername,
          token: formToken,
          isDefault: formIsDefault,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchCredentials(); // Reload list
      } else {
        alert("Failed to save credential");
      }
    } catch (error) {
      alert("Error saving credential");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    try {
      await fetch(`/api/user/settings/credentials?id=${id}`, {
        method: "DELETE",
      });
      setCredentials((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      alert("Failed to delete");
    }
  };

  if (loading)
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  const githubCreds = credentials.filter((c) => c.provider === "GITHUB");
  const dockerCreds = credentials.filter((c) => c.provider === "DOCKER");

  return (
    <div className="w-full space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
          <Sliders className="text-slate-400" /> Settings
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1 ml-9">
          Manage your connected accounts, organizations, and access tokens.
        </p>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GitHub Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <Github className="w-5 h-5 text-gray-700 dark:text-slate-300" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-sm">
                  GitHub Accounts
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Access private repositories
                </p>
              </div>
            </div>
            <button
              onClick={() => openAddModal("GITHUB")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-slate-700 rounded-lg hover:bg-black dark:hover:bg-slate-600 transition-colors shadow-sm"
            >
              <Plus size={14} /> Add Account
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
            {githubCreds.length === 0 ? (
              <div className="p-12 text-center text-gray-400 dark:text-slate-500 text-sm flex flex-col items-center gap-2">
                <Github size={32} className="opacity-20" />
                No GitHub accounts connected.
              </div>
            ) : (
              githubCreds.map((cred) => (
                <CredentialItem
                  key={cred.id}
                  cred={cred}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>

        {/* Docker Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <Box className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-sm">
                  Docker Registries
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Push & pull container images
                </p>
              </div>
            </div>
            <button
              onClick={() => openAddModal("DOCKER")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={14} /> Add Registry
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
            {dockerCreds.length === 0 ? (
              <div className="p-12 text-center text-gray-400 dark:text-slate-500 text-sm flex flex-col items-center gap-2">
                <Box size={32} className="opacity-20" />
                No Docker registries connected.
              </div>
            ) : (
              dockerCreds.map((cred) => (
                <CredentialItem
                  key={cred.id}
                  cred={cred}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  modalType === "GITHUB" ? "bg-gray-100 dark:bg-slate-800" : "bg-blue-50 dark:bg-blue-900/20"
                }`}
              >
                {modalType === "GITHUB" ? (
                  <Github size={20} className="text-gray-700 dark:text-slate-300" />
                ) : (
                  <Box size={20} className="text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Add {modalType === "GITHUB" ? "GitHub" : "Docker"} Account
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Enter your credentials below
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1.5 block">
                  Account Name (Alias)
                </label>
                <input
                  required
                  placeholder="e.g. Personal, Company Org"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1.5 block">
                  {modalType === "GITHUB"
                    ? "GitHub Username"
                    : "Docker ID / Org Name"}
                </label>
                <input
                  required
                  placeholder={
                    modalType === "GITHUB" ? "octocat" : "dockeruser"
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                  Access Token (PAT - Classic){" "}
                  <Key size={12} className="text-slate-400" />
                </label>
                <input
                  required
                  type="password"
                  placeholder="ghp_... or dckr_..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-mono text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600"
                  value={formToken}
                  onChange={(e) => setFormToken(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                  Use a generated Personal Access Token (Classic recommended).
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <div className="font-bold mb-1 flex items-center gap-1.5">
                  <AlertCircle size={12} className="text-blue-500" />
                  Required Permissions:
                </div>
                {modalType === "GITHUB" ? (
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>
                      <span className="font-mono text-blue-600 dark:text-blue-400">repo</span>{" "}
                      (Full control of private repositories)
                    </li>
                    <li>
                      <span className="font-mono text-blue-600 dark:text-blue-400">read:user</span>{" "}
                      (Read user profile data)
                    </li>
                  </ul>
                ) : (
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>
                      <span className="font-bold">Read & Write</span> Access
                    </li>
                    <li>
                      Must enable <span className="font-bold">Push & Pull</span> permissions
                    </li>
                  </ul>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-950 focus:ring-blue-500"
                />
                <label
                  htmlFor="isDefault"
                  className="text-sm text-gray-700 dark:text-slate-300 cursor-pointer select-none"
                >
                  Set as default account
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors shadow-sm"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Save Credentials"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CredentialItem({
  cred,
  onDelete,
}: {
  cred: Credential;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="p-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
            cred.provider === "GITHUB" ? "bg-gray-800 dark:bg-slate-700" : "bg-blue-600"
          }`}
        >
          {cred.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              {cred.name}
            </span>
            {cred.isDefault && (
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-0.5">
                <CheckCircle2 size={10} /> DEFAULT
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-slate-400 font-mono mt-0.5">
            @{cred.username}
          </div>
        </div>
      </div>
      <button
        onClick={() => onDelete(cred.id)}
        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        title="Remove Account"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
