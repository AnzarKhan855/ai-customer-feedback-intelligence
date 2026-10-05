"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Layers, Loader2, AlertCircle, Shield, UserCheck, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@loop.dev");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || "Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("password123");
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <Layers className="w-7 h-7" />
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-white tracking-tight">
          Project LOOP
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          AI Customer-Feedback Intelligence Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In to Workspace"
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-600 mb-2.5 text-center">
              ⚡ Quick Demo Logins (Password: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">password123</code>)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("admin@loop.dev")}
                className="flex flex-col items-center p-2 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100/70 transition-colors text-center"
              >
                <Shield className="w-4 h-4 text-rose-600 mb-0.5" />
                <span className="text-[11px] font-bold text-rose-800">Admin</span>
                <span className="text-[9px] text-rose-600">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("analyst@loop.dev")}
                className="flex flex-col items-center p-2 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 transition-colors text-center"
              >
                <UserCheck className="w-4 h-4 text-indigo-600 mb-0.5" />
                <span className="text-[11px] font-bold text-indigo-800">Analyst</span>
                <span className="text-[9px] text-indigo-600">Ingest/Triage</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("viewer@loop.dev")}
                className="flex flex-col items-center p-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors text-center"
              >
                <Eye className="w-4 h-4 text-slate-600 mb-0.5" />
                <span className="text-[11px] font-bold text-slate-800">Viewer</span>
                <span className="text-[9px] text-slate-500">Read-Only</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Need a separate tenant?{" "}
            <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Create a new workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
