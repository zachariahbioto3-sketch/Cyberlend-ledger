import React, { useState } from "react";
import { Loan, PortfolioMetrics } from "../types";
import type { Theme } from "../App";
import { generatePortfolioSummaryPdf } from "../utils/pdfReportGenerator";

interface PdfExportModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  loans:    Loan[];
  metrics:  PortfolioMetrics;
  theme:    Theme;
}

export function PdfExportModal({ isOpen, onClose, loans, metrics, theme }: PdfExportModalProps) {
  const isDark = theme === "dark";
  const [orgName, setOrgName]       = useState("Cyberlend");
  const [preparedBy, setPreparedBy] = useState("Admin");
  const [includePaid, setIncludePaid] = useState(false);
  const [loading, setLoading]       = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    try {
      await generatePortfolioSummaryPdf(loans, metrics, {
        organizationName: orgName,
        preparedBy,
        reportTitle: "Portfolio Summary Report",
        includePaidOff: includePaid,
      });
      onClose();
    } catch (e) {
      console.error("PDF export failed", e);
    } finally {
      setLoading(false);
    }
  };

  const base = isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900";
  const sub  = isDark ? "text-gray-400" : "text-gray-500";
  const inp  = isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-100 border-gray-300 text-gray-900";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 ${base}`}>
        <h2 className="text-xl font-bold mb-1">Export PDF Report</h2>
        <p className={`text-sm mb-4 ${sub}`}>Generate a full portfolio summary with all loan details.</p>

        <div className="space-y-3 mb-5">
          <div>
            <label className={`text-xs font-medium ${sub}`}>Organisation Name</label>
            <input value={orgName} onChange={e => setOrgName(e.target.value)}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${inp}`} />
          </div>
          <div>
            <label className={`text-xs font-medium ${sub}`}>Prepared By</label>
            <input value={preparedBy} onChange={e => setPreparedBy(e.target.value)}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${inp}`} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={includePaid} onChange={e => setIncludePaid(e.target.checked)}
              className="rounded" />
            Include completed loans
          </label>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className={`flex-1 py-2 rounded-lg border text-sm font-medium ${isDark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-600 hover:bg-gray-100"}`}>
            Cancel
          </button>
          <button onClick={handleExport} disabled={loading}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium">
            {loading ? "Generating..." : "Export PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
