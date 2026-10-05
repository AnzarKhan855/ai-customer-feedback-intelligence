"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AppShell from "@/components/layout/AppShell";
import {
  Shield,
  Users,
  Building2,
  Trash2,
  AlertTriangle,
  Plus,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Database,
  Lock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeType, setPurgeType] = useState<"actioned" | "older_30" | "all">("actioned");
  const [purging, setPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState("");

  // Invite state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ANALYST");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");

  const currentRole = (session?.user as any)?.role || "VIEWER";
  const workspaceName = (session?.user as any)?.workspaceName || "Acme Corp (Demo)";
  const isAdmin = currentRole === "ADMIN";

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workspace/members");
      const data = await res.json();
      if (data.members) {
        setMembers(data.members);
      }
    } catch (e) {
      console.error("Failed to load members:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError("");

    try {
      const res = await fetch("/api/workspace/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");

      setShowInviteModal(false);
      setName("");
      setEmail("");
      setRole("ANALYST");
      fetchMembers();
    } catch (err: any) {
      setError(err.message || "Failed to invite teammate");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isAdmin) return;
    try {
      const res = await fetch("/api/workspace/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
        );
      }
    } catch (e) {
      alert("Failed to update role");
    }
  };

  const handleExecutePurge = async () => {
    if (!isAdmin) return;
    setPurging(true);
    setPurgeSuccess("");

    try {
      let body: any = {};
      if (purgeType === "all") {
        body = { action: "purge_all" };
      } else if (purgeType === "actioned") {
        body = { action: "purge_criteria", status: "ACTIONED" };
      } else if (purgeType === "older_30") {
        body = { action: "purge_criteria", olderThanDays: 30 };
      }

      const res = await fetch("/api/feedback/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to execute purge");

      setPurgeSuccess(data.message || "Purge executed successfully.");
      setShowPurgeModal(false);
    } catch (err: any) {
      alert(`Purge failed: ${err.message}`);
    } finally {
      setPurging(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Workspace & Team Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage multi-tenant workspace settings, data governance, and Role-Based Access Control (RBAC)
          </p>
        </div>

        {/* Purge Success Alert */}
        {purgeSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{purgeSuccess}</span>
            </div>
            <button onClick={() => setPurgeSuccess("")} className="text-emerald-600 font-bold">
              Dismiss
            </button>
          </div>
        )}

        {/* Workspace Info Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Active Multi-Tenant Workspace
                </div>
                <div className="text-base font-bold text-slate-900">{workspaceName}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ● Tenant Isolation Active
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-100">
            <div>
              <span className="font-semibold text-slate-700">Multi-Tenancy Guard:</span>
              <p className="mt-0.5 text-slate-500">Every query strictly filtered by session workspaceId.</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Your Current Role:</span>
              <p className="mt-0.5 font-bold uppercase text-indigo-600">{currentRole}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700">AI Model Pipeline:</span>
              <p className="mt-0.5 text-slate-500">Claude 3.5 / 3.7 Sonnet + Vector Retrieval</p>
            </div>
          </div>
        </div>

        {/* Team Members List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Team Members & Roles ({members.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdmin
                  ? "Admins can assign and change roles for any teammate"
                  : "Only workspace admins have permission to invite or modify roles"}
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Invite Member
              </button>
            )}
          </div>

          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <span className="text-xs text-slate-400">Loading team members...</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{member.name}</div>
                      <div className="text-xs text-slate-500">{member.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Joined {formatDate(member.createdAt)}</span>

                    {isAdmin ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="ANALYST">ANALYST</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    ) : (
                      <span className="text-xs font-bold px-2 py-0.5 rounded border uppercase bg-slate-100 text-slate-700">
                        {member.role}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🚨 ADMIN ONLY: Data Governance & Purge Controls */}
        {isAdmin && (
          <div className="bg-white rounded-xl border border-rose-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">
                    Data Governance & Purge Zone (Admin Only)
                  </h3>
                  <p className="text-xs text-rose-700">
                    Permanently delete feedback batches or wipe workspace records for compliance
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900 uppercase">
                Admin Exclusive
              </span>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                As an Administrator, you possess permissions to clean up resolved customer records, purge old datasets, or permanently wipe feedback to comply with privacy regulations.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setPurgeType("actioned");
                    setShowPurgeModal(true);
                  }}
                  className="p-3 rounded-lg border border-slate-200 hover:border-rose-300 bg-slate-50 hover:bg-rose-50/40 text-left transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">Purge Actioned Feedback</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Deletes all feedback marked as "ACTIONED" to keep inbox clean.
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-rose-600 mt-3 inline-flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Purge Actioned
                  </span>
                </button>

                <button
                  onClick={() => {
                    setPurgeType("older_30");
                    setShowPurgeModal(true);
                  }}
                  className="p-3 rounded-lg border border-slate-200 hover:border-rose-300 bg-slate-50 hover:bg-rose-50/40 text-left transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">Purge Older than 30 Days</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Retains only fresh customer signals from the past month.
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-rose-600 mt-3 inline-flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Purge &gt;30d
                  </span>
                </button>

                <button
                  onClick={() => {
                    setPurgeType("all");
                    setShowPurgeModal(true);
                  }}
                  className="p-3 rounded-lg border border-rose-200 hover:border-rose-400 bg-rose-50/30 hover:bg-rose-100/40 text-left transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-rose-900">Wipe All Workspace Feedback</div>
                    <div className="text-[11px] text-rose-700 mt-1">
                      Full destructive purge of all feedback and vector embeddings.
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-rose-700 mt-3 inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Complete Wipe
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Purge Confirmation Modal */}
        {showPurgeModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-200">
              <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-200 flex items-center justify-center text-rose-800 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-900">Confirm Data Purge</h3>
                  <p className="text-xs text-rose-700">This action cannot be undone.</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-700">
                  Are you sure you want to execute this purge:
                  <strong className="block text-slate-900 text-sm mt-1">
                    {purgeType === "all"
                      ? "Permanently delete ALL feedback in this workspace"
                      : purgeType === "actioned"
                      ? "Delete all feedback with status 'ACTIONED'"
                      : "Delete all feedback older than 30 days"}
                  </strong>
                </p>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
                  Note: Associated AI vector embeddings and theme links will also be safely removed.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowPurgeModal(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={purging}
                    onClick={handleExecutePurge}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {purging ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Purging Records...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        Yes, Execute Purge
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-800">Invite Team Member</h3>
                <p className="text-xs text-slate-500">Add a new user to {workspaceName}</p>
              </div>

              <form onSubmit={handleInvite} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jordan@company.com"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role Assignment <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ADMIN">ADMIN — Full management & settings</option>
                    <option value="ANALYST">ANALYST — Feedback ingestion & triage</option>
                    <option value="VIEWER">VIEWER — Read-only analytics & search</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add Teammate
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
