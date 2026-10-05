import Link from "next/link";
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Database,
  BarChart3,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Lock,
  GitBranch,
  TrendingUp,
  FileText,
  Activity,
  Cpu,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -left-48 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-2/3 -right-48 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">LOOP</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 font-semibold border border-indigo-800/60">
                Enterprise Intelligence
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#pipeline" className="hover:text-white transition-colors">
              NLP Architecture
            </a>
            <a href="#capabilities" className="hover:text-white transition-colors">
              Core Capabilities
            </a>
            <a href="#security" className="hover:text-white transition-colors">
              Enterprise Security
            </a>
            <a href="#demo" className="hover:text-white transition-colors">
              Live Demo
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              Launch Platform
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-6 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Next-Generation Voice of Customer Intelligence Platform</span>
          <span className="w-1 h-1 rounded-full bg-indigo-400" />
          <span className="text-indigo-400">Production v2.0</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-tight">
          Turn Scattered Customer Feedback Into{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200">
            Defensible Product Strategy
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Ingest multi-channel customer signals across Intercom, Zendesk, Gong, Discord, and App Reviews. 
          Powered by Aspect-Based Sentiment Analysis (ABSA), an 8-emotion taxonomy, explainable severity index, 
          and a grounded AI Analyst that cites real customer evidence.
        </p>

        {/* Call to Actions */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-base font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 group"
          >
            Explore Live Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/inbox"
            className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-base font-semibold transition-all flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Feedback Intelligence Explorer
          </Link>
          <Link
            href="/ask"
            className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-base font-semibold transition-all flex items-center gap-2"
          >
            <Bot className="w-4 h-4 text-purple-400" />
            Ask LOOP AI Analyst
          </Link>
        </div>

        {/* Demo Credentials Box */}
        <div id="demo" className="mt-12 p-4 max-w-2xl mx-auto rounded-xl bg-slate-900/90 border border-slate-800 text-left shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Instant Demo Access (Pre-Seeded Acme Corp Workspace)
            </span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Active Workspace
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <div className="font-semibold text-rose-400">Admin Role</div>
              <div className="text-slate-400 mt-0.5">admin@loop.dev</div>
              <div className="text-slate-500 font-mono text-[11px] mt-0.5">password123</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <div className="font-semibold text-indigo-400">Analyst Role</div>
              <div className="text-slate-400 mt-0.5">analyst@loop.dev</div>
              <div className="text-slate-500 font-mono text-[11px] mt-0.5">password123</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <div className="font-semibold text-slate-400">Viewer Role</div>
              <div className="text-slate-400 mt-0.5">viewer@loop.dev</div>
              <div className="text-slate-500 font-mono text-[11px] mt-0.5">password123</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Signal Analysis Card */}
      <section className="py-12 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Live NLP Inspection Anatomy</h2>
          <p className="text-2xl font-bold text-white mt-1">
            Beyond Generic Sentiment: Deep Multi-Taxonomy Intelligence
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-800 uppercase">
                  Intercom Ticket #4829
                </span>
                <span className="text-xs text-slate-400">Customer: VP Infrastructure, Tier 1 Enterprise</span>
              </div>
              <p className="text-base text-slate-200 mt-2 font-medium italic">
                "Our single sign-on broke right after the Friday upgrade, locking out 40 engineers. Furthermore, your billing portal double-charged our corporate card."
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xs text-slate-400 font-mono">Severity Index</span>
              <div className="text-3xl font-extrabold text-rose-400">92/100</div>
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wide">P0 Critical</span>
            </div>
          </div>

          {/* Extracted Attributes Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Sentiment & Score</div>
              <div className="text-sm font-bold text-rose-400 mt-1">Negative (-0.88)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Confidence: 96%</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Primary Emotion</div>
              <div className="text-sm font-bold text-amber-400 mt-1">Frustration (89%)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Taxonomy: Plutchik-8</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Intent Classification</div>
              <div className="text-sm font-bold text-indigo-300 mt-1">Bug Report / Complaint</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Confidence: 94%</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Churn Risk Signal</div>
              <div className="text-sm font-bold text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> High Risk Detected
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Lockout + Financial impact</div>
            </div>
          </div>

          {/* ABSA Aspects & RCA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-indigo-400" /> Aspect-Based Sentiment Analysis (ABSA)
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="font-semibold text-slate-200">Aspect: authentication / sso</span>
                  <span className="text-rose-400 font-bold">Negative (-0.92)</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="font-semibold text-slate-200">Aspect: billing / invoicing</span>
                  <span className="text-rose-400 font-bold">Negative (-0.85)</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" /> Root Cause Hypothesis (AI Synthesis)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed p-2 rounded bg-slate-900 border border-slate-800">
                SAML token validation regression introduced in release v2.4 deployment, compounding with Stripe webhook duplication on renewal cycle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The 5 Core Executive Questions */}
      <section id="capabilities" className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Executive Value Proposition</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Answering the 5 Questions Every VP of Product & CX Asks
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Engineered from first principles to replace vanity NPS surveys with empirical customer intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-indigo-800/80 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 flex items-center justify-center text-indigo-400 border border-indigo-800/60">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">1. How do customers feel right now?</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Track real-time sentiment velocity, Net Sentiment Score (-100 to +100), and an 8-emotion distribution (Frustration, Delight, Confusion, Anger, Trust, etc.).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-indigo-800/80 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-950 flex items-center justify-center text-purple-400 border border-purple-800/60">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">2. Which features cause churn risk?</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Aspect-Based Sentiment Analysis pinpoints sentiment toward discrete product components (Auth, Billing, Search, API) and tags active churn indicators.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-indigo-800/80 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-950 flex items-center justify-center text-rose-400 border border-rose-800/60">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">3. What needs urgent triage?</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Explainable 0–100 severity index automatically flags P0/P1 blockers with transparent rationale and fires real-time anomaly alerts before social escalation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-indigo-800/80 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-950 flex items-center justify-center text-blue-400 border border-blue-800/60">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">4. Why are issues occurring?</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automated Root Cause Hypotheses combine entity recognition and semantic clustering to present engineers with candidate system-level failure points.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-indigo-800/80 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400 border border-emerald-800/60">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">5. What should we prioritize next?</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              AI recommendations prioritize backlog initiatives by estimated customer impact and map them directly into a synchronized Product Roadmap.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-indigo-800/80 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-950 flex items-center justify-center text-amber-400 border border-amber-800/60">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Grounded AI Analyst</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Query customer data in plain English with RAG. Every answer cites exact customer verbatims, sentiment scores, and feedback IDs.
            </p>
          </div>
        </div>
      </section>

      {/* NLP Pipeline Architecture Section */}
      <section id="pipeline" className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Engineering Rigor</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            The Multi-Stage Intelligence Pipeline
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Dual-provider architecture with high-precision deterministic offline NLP and Claude 3.5 Sonnet cloud synthesis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative">
            <div className="text-xs font-bold text-indigo-400">Stage 01</div>
            <h4 className="text-base font-bold text-white">Ingestion & Quality Gate</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Normalization, automatic schema detection, deduplication, and a 0–100 Data Quality Score ensuring zero garbage-in analytics.
            </p>
            <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
              CSV · REST API · Streams
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative">
            <div className="text-xs font-bold text-purple-400">Stage 02</div>
            <h4 className="text-base font-bold text-white">Deep NLP Extraction</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plutchik-8 emotion classification, 9 intent categories, ABSA extraction, and explainable 0–100 severity index calculation.
            </p>
            <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
              Dual Engine · Zero Downtime
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative">
            <div className="text-xs font-bold text-blue-400">Stage 03</div>
            <h4 className="text-base font-bold text-white">Multi-Tenant Persistence</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict workspace tenant isolation, relational indexes, pgvector similarity embeddings, and role-based access control.
            </p>
            <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
              Prisma · SQLite & PostgreSQL
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative">
            <div className="text-xs font-bold text-emerald-400">Stage 04</div>
            <h4 className="text-base font-bold text-white">Grounded AI Synthesis</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Executive VoC generation, automated anomaly detection, and interactive RAG conversational analyst with strict source citations.
            </p>
            <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
              Strict Evidence Grounding
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Security & Readiness */}
      <section id="security" className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-900">
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-semibold mb-4">
              <ShieldCheck className="w-4 h-4" /> Enterprise-Grade Trust & Compliance
            </div>
            <h2 className="text-3xl font-bold text-white">
              Built for Security-Conscious Product Organizations
            </h2>
            <p className="text-slate-300 mt-4 leading-relaxed text-sm sm:text-base">
              LOOP is designed with strict multi-tenant isolation, role-based access controls, and zero third-party data lock-in. 
              The platform executes fully locally or deploys smoothly to enterprise VPCs.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-slate-800">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Strict Tenant Isolation</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Every query, embedding, and dataset is scoped to workspace IDs with zero cross-tenant leakage.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Dual-Engine Resilience</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Operates with Claude 3.5 Sonnet or in offline fallback mode with deterministic NLP for resilient high availability.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Empirical Citations</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Distinguishes FACT vs PREDICTION vs INFERENCE on all UI inspection drawers and VoC reports.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-12 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-300">LOOP Intelligence Platform</span>
            <span>· Engineered for Enterprise Product & CX Strategy</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-slate-200 transition-colors">
              Dashboard
            </Link>
            <Link href="/inbox" className="hover:text-slate-200 transition-colors">
              Feedback Inbox
            </Link>
            <Link href="/ask" className="hover:text-slate-200 transition-colors">
              AI Analyst
            </Link>
            <Link href="/login" className="hover:text-slate-200 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
