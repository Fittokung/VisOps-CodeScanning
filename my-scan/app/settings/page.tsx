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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );

  const githubCreds = credentials.filter((c) => c.provider === "GITHUB");
  const dockerCreds = credentials.filter((c) => c.provider === "DOCKER");

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your connected accounts and organizations.
          </p>
        </div>

        {/* GitHub Section */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-3">
              <Github className="w-6 h-6 text-gray-700" />
              <div>
                <h2 className="font-semibold text-gray-900">GitHub Accounts</h2>
                <p className="text-xs text-gray-500">
                  For accessing private repositories
                </p>
              </div>
            </div>
            <button
              onClick={() => openAddModal("GITHUB")}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition"
            >
              <Plus size={16} /> Add GitHub
            </button>
          </div>
          <div className="divide-y">
            {githubCreds.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
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
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-3">
              <Box className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="font-semibold text-gray-900">
                  Docker Registries
                </h2>
                <p className="text-xs text-gray-500">
                  For pushing/pulling images (Docker Hub)
                </p>
              </div>
            </div>
            <button
              onClick={() => openAddModal("DOCKER")}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={16} /> Add Docker
            </button>
          </div>
          <div className="divide-y">
            {dockerCreds.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No Docker accounts connected.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              {modalType === "GITHUB" ? <Github /> : <Box />}
              Add {modalType === "GITHUB" ? "GitHub" : "Docker"} Account
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Account Name (Alias)
                </label>
                <input
                  required
                  placeholder="e.g. Personal, Company Org"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {modalType === "GITHUB"
                    ? "GitHub Username"
                    : "Docker ID / Org Name"}
                </label>
                <input
                  required
                  placeholder={
                    modalType === "GITHUB" ? "octocat" : "dockeruser"
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Access Token (PAT)
                </label>
                <input
                  required
                  type="password"
                  placeholder="ghp_... or dckr_..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formToken}
                  onChange={(e) => setFormToken(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-600">
                  Set as default account
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center"
                >
                  {saving ? <Loader2 className="animate-spin" /> : "Save"}
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
    <div className="p-4 flex items-center justify-between group hover:bg-gray-50 transition">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
            cred.provider === "GITHUB" ? "bg-gray-800" : "bg-blue-500"
          }`}
        >
          {cred.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{cred.name}</span>
            {cred.isDefault && (
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium border border-green-200">
                DEFAULT
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 font-mono">
            @{cred.username}
          </div>
        </div>
      </div>
      <button
        onClick={() => onDelete(cred.id)}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
        title="Remove Account"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
