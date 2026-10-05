"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Building2,
  Shield,
  LogOut,
  Plus,
  Upload,
  Radio,
  User as UserIcon,
  Moon,
  Sun,
  Bell,
} from "lucide-react";
import AddFeedbackModal from "@/components/feedback/AddFeedbackModal";
import CSVUploadModal from "@/components/feedback/CSVUploadModal";
import SimulateChannelModal from "@/components/feedback/SimulateChannelModal";

export default function Navbar() {
  const { data: session } = useSession();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("theme") === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  const role = (session?.user as any)?.role || "VIEWER";
  const workspaceName = (session?.user as any)?.workspaceName || "Acme Corp";
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";

  const canIngest = role === "ADMIN" || role === "ANALYST";

  const getRoleBadge = (r: string) => {
    switch (r) {
      case "ADMIN":
        return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
      case "ANALYST":
        return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800";
      case "VIEWER":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors">
        {/* Workspace Display */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium leading-none">Workspace</div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight mt-0.5">
              {workspaceName}
            </div>
          </div>
        </div>

        {/* Ingestion & User Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Anomaly Alerts Quick Link */}
          <Link
            href="/alerts"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative"
            title="Real-Time Anomaly Alerts"
          >
            <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
          </Link>

          {canIngest ? (
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Feedback
              </button>
              <button
                onClick={() => setShowCSVModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                CSV Import
              </button>
              <button
                onClick={() => setShowSimModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                Simulate Stream
              </button>
            </div>
          ) : (
            <div className="text-xs px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
              Read-Only Access
            </div>
          )}

          {/* User Profile & Role Pill */}
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div className="flex items-center gap-2.5 pl-1">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{userName}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{userEmail}</div>
            </div>

            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${getRoleBadge(
                role
              )}`}
            >
              {role}
            </span>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>


      {/* Modals */}
      {showAddModal && (
        <AddFeedbackModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      )}
      {showCSVModal && (
        <CSVUploadModal isOpen={showCSVModal} onClose={() => setShowCSVModal(false)} />
      )}
      {showSimModal && (
        <SimulateChannelModal isOpen={showSimModal} onClose={() => setShowSimModal(false)} />
      )}
    </>
  );
}
