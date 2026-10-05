"use client";

import { useState } from "react";
import { X, Layers, ExternalLink, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface CreateActionModalProps {
  isOpen?: boolean;
  feedback: any | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateActionModal({ isOpen, feedback, onClose, onSuccess }: CreateActionModalProps) {
  if (isOpen === false) return null;
  const [integration, setIntegration] = useState<"LINEAR" | "JIRA" | "GITHUB">("LINEAR");
  const [title, setTitle] = useState(
    feedback ? `[Feedback] ${feedback.featureArea || "Issue"}: ${feedback.content.slice(0, 60)}...` : ""
  );
  const [description, setDescription] = useState(
    feedback ? `Customer Report: "${feedback.content}"\nCustomer Tier: ${feedback.customerLabel || "Unknown"}\nSource Channel: ${feedback.channel}\nSentiment: ${feedback.sentiment}` : ""
  );
  const [priority, setPriority] = useState<"URGENT" | "HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          integration,
          priority,
          feedbackId: feedback?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create issue ticket");

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to push action ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Push to Issue Tracker
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Close the loop by creating a linked Linear or Jira engineering issue
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Integration Target Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Integration Tool
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "LINEAR", label: "Linear Issue", color: "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300" },
                { id: "JIRA", label: "Jira Ticket", color: "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" },
                { id: "GITHUB", label: "GitHub Issue", color: "border-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200" },
              ].map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setIntegration(tool.id as any)}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                    integration === tool.id
                      ? `${tool.color} ring-2 ring-indigo-500`
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {tool.label}
                </button>
              ))}
            </div>
          </div>

          {/* Issue Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Issue Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priority Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="URGENT">🔴 Urgent (Blocking enterprise customer)</option>
              <option value="HIGH">🟠 High (Major feature request / bug)</option>
              <option value="MEDIUM">🟡 Medium (Normal priority)</option>
              <option value="LOW">🔵 Low (Minor tweak)</option>
            </select>
          </div>

          {/* Issue Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Issue Description / Customer Context
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
              Create {integration} Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
