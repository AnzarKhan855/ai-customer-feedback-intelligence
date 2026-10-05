"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Download,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CSVUploadModal({ isOpen, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith(".csv")) {
      setError("Please select a valid .csv file");
      return;
    }

    setFile(selected);
    setError("");

    Papa.parse(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setParsedRows(results.data);
        } else {
          setError("The selected CSV file appears to be empty.");
        }
      },
      error: (err) => {
        setError(`CSV Parse error: ${err.message}`);
      },
    });
  };

  const handleUpload = async () => {
    if (parsedRows.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const res = await fetch("/api/feedback/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk upload failed");

      setSummary(data);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to process bulk upload");
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "content,channel,customer_label,source_ref\n" +
      '"Onboarding took forever — I couldn\'t figure out how to invite my team.",SUPPORT_TICKET,Startup Corp,ZD-101\n' +
      '"The new dashboard is gorgeous and finally fast. Huge improvement.",APP_STORE,iOS Power User,AS-204\n' +
      '"Need Google Workspace SSO before we can sign contract.",SALES_CALL,Enterprise Lead,SALES-302\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "loop_sample_feedback.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">CSV Bulk Ingestion</h3>
              <p className="text-xs text-slate-500">Import hundreds of customer records with automatic AI tagging</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {summary ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Bulk Import Processing Completed
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 bg-white rounded-md border border-slate-200">
                    <div className="text-xs text-slate-500">Total Rows</div>
                    <div className="text-lg font-bold text-slate-800">{summary.total}</div>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-md border border-emerald-200">
                    <div className="text-xs text-emerald-700">Imported</div>
                    <div className="text-lg font-bold text-emerald-700">{summary.imported}</div>
                  </div>
                  <div className="p-2.5 bg-rose-50 rounded-md border border-rose-200">
                    <div className="text-xs text-rose-700">Failed</div>
                    <div className="text-lg font-bold text-rose-700">{summary.failed}</div>
                  </div>
                </div>

                {summary.errors && summary.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-rose-50/50 rounded border border-rose-100 text-xs text-rose-800 space-y-1 max-h-32 overflow-y-auto">
                    <div className="font-semibold">Import Warnings / Errors:</div>
                    {summary.errors.map((err: string, i: number) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  View in Inbox
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  {file ? file.name : "Click or drag & drop a CSV file"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Expected columns: <code className="text-indigo-600 font-mono">content</code>,{" "}
                  <code className="text-indigo-600 font-mono">channel</code>,{" "}
                  <code className="text-indigo-600 font-mono">customer_label</code>,{" "}
                  <code className="text-indigo-600 font-mono">source_ref</code>
                </p>
              </div>

              {/* Preview */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">Parsed {parsedRows.length} feedback items</span>
                    <span>Previewing top 2 rows</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs space-y-1.5 font-mono">
                    {parsedRows.slice(0, 2).map((r, i) => (
                      <div key={i} className="truncate text-slate-700">
                        #{i + 1}: {r.content || r.Content || JSON.stringify(r)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Sample CSV
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={parsedRows.length === 0 || uploading}
                    onClick={handleUpload}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Importing & Classifying...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        Import {parsedRows.length > 0 ? `(${parsedRows.length} rows)` : ""}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
