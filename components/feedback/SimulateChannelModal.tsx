"use client";

import { useState } from "react";
import {
  X,
  Radio,
  Loader2,
  CheckCircle2,
  LifeBuoy,
  Star,
  Smile,
  PhoneCall,
  MessageSquare,
} from "lucide-react";
import { FeedbackChannel } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CHANNELS_WITH_ICONS: {
  value: FeedbackChannel;
  title: string;
  desc: string;
  icon: any;
  color: string;
}[] = [
  {
    value: "SUPPORT_TICKET",
    title: "Zendesk & Intercom",
    desc: "Simulate live incoming support tickets and technical bugs",
    icon: LifeBuoy,
    color: "bg-blue-500 text-white",
  },
  {
    value: "APP_STORE",
    title: "App Store & Google Play",
    desc: "Simulate mobile app ratings and user store reviews",
    icon: Star,
    color: "bg-amber-500 text-white",
  },
  {
    value: "NPS_SURVEY",
    title: "NPS & CSAT Surveys",
    desc: "Simulate customer satisfaction and Net Promoter score responses",
    icon: Smile,
    color: "bg-purple-500 text-white",
  },
  {
    value: "SALES_CALL",
    title: "Sales & CRM Discovery",
    desc: "Simulate enterprise buyer notes from Gong / HubSpot sales calls",
    icon: PhoneCall,
    color: "bg-emerald-500 text-white",
  },
  {
    value: "COMMUNITY",
    title: "Discourse & Slack Community",
    desc: "Simulate public community forum discussions and feature votes",
    icon: MessageSquare,
    color: "bg-indigo-500 text-white",
  },
];

export default function SimulateChannelModal({ isOpen, onClose, onSuccess }: Props) {
  const [selectedChannel, setSelectedChannel] = useState<FeedbackChannel>("SUPPORT_TICKET");
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulateBatch: true,
          channel: selectedChannel,
          count,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Simulation failed");

      setResult(data);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">Simulate Channel Stream</h3>
              <p className="text-xs text-slate-500">Inject realistic multi-channel customer stream on demand</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {result ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold">
                    Injected {result.count} Realistic {selectedChannel.replace("_", " ")} Signals
                  </div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    Items were auto-classified, indexed, and embedded for Ask LOOP semantic search.
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Simulate Another Channel
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Channel Source to Simulate:
                </label>
                <div className="space-y-2">
                  {CHANNELS_WITH_ICONS.map((ch) => {
                    const Icon = ch.icon;
                    const isSelected = selectedChannel === ch.value;
                    return (
                      <div
                        key={ch.value}
                        onClick={() => setSelectedChannel(ch.value)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ch.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate-800">{ch.title}</div>
                          <div className="text-[11px] text-slate-500">{ch.desc}</div>
                        </div>
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => setSelectedChannel(ch.value)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Number of items to ingest (1 - 5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={count}
                  onChange={(e) => setCount(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-24 px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSimulate}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Simulating & Indexing...
                    </>
                  ) : (
                    <>
                      <Radio className="w-3.5 h-3.5" />
                      Simulate Incoming Stream
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
