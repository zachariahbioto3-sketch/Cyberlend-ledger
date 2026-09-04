import React, { useState } from "react";
import { X, FileText, Download, CheckCircle2, Settings } from "lucide-react";
import { Loan, PortfolioMetrics } from "../types";
import { generatePortfolioSummaryPdf } from "../utils/pdfReportGenerator";
import { formatCompactCurrency } from "../utils/loanCalculations";

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: Loan[];
  metrics: PortfolioMetrics;
  theme: any;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  loans,
  metrics,
  theme: t,
}) => {
  const [organizationName, setOrganizationName] = useState("Cyberlend Portfolio");
  const [preparedBy, setPreparedBy] = useState("Portfolio Administrator");
  const [reportTitle, setReportTitle] = useState("PORTFOLIO DEBT SERVICE & STANDING REPORT");
  const [includePaidOff, setIncludePaidOff] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  const handleGeneratePdf = () => {
    setIsGenerating(true);
    try {
      generatePortfolioSummaryPdf(loans, metrics, {
        organizationName,
        preparedBy,
        reportTitle,
        includePaidOff,
      });
      setHasDownloaded(true);
      setTimeout(() => setIsGenerating(false), 600);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      setIsGenerating(false);
    }
  };

  const mono = "'Space Mono', monospace";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="relative w-full flex flex-col rounded-3xl overflow-hidden border"
        style={{
          maxWidth: "74vw",
          minWidth: "74vw",
          maxHeight: "84vh",
          background: t.bgModal,
          borderColor: t.borderMid,
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        }}>

        {/* HEADER */}
        <div className="flex items-center justify-between px-7 py-5 border-b shrink-0"
          style={{ background: t.bgCard, borderColor: t.border }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: "rgba(91,124,250,0.15)", border: "1px solid rgba(91,124,250,0.3)" }}>
              <FileText className="w-5 h-5" style={{ color: "#5b7cfa" }} />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>
                EXPORT PDF REPORT
              </h3>
              <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                Audit-ready portfolio summary with KPIs, loan schedule & transactions
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl transition-all"
            style={{ color: t.textMuted, border: `1px solid ${t.border}`, background: t.bgBtn }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

          {/* KPI SNAPSHOT */}
          <div className="rounded-2xl p-5 border" style={{ background: t.bgCard, borderColor: t.border }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ fontFamily: mono, color: t.textFaint }}>
              REPORT DATA SNAPSHOT
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "TOTAL LENT",   value: formatCompactCurrency(metrics.totalPrincipalLent) },
                { label: "OUTSTANDING",  value: formatCompactCurrency(metrics.totalOutstanding) },
                { label: "COLLECTED",    value: formatCompactCurrency(metrics.totalCollected) },
                { label: "NET PROFIT",   value: formatCompactCurrency(metrics.totalProfit) },
              ].map((m) => (
                <div key={m.label} className="rounded-xl p-4 border text-center"
                  style={{ background: t.bgActive, borderColor: t.borderMid }}>
                  <p className="text-[9px] uppercase tracking-widest mb-1" style={{ fontFamily: mono, color: t.textFaint }}>{m.label}</p>
                  <p className="text-sm font-bold" style={{ fontFamily: mono, color: "#5b7cfa" }}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SECTIONS INCLUDED */}
          <div className="rounded-2xl p-5 border" style={{ background: t.bgCard, borderColor: t.border }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ fontFamily: mono, color: t.textFaint }}>
              DOCUMENT SECTIONS INCLUDED
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "1. Executive KPI Metrics Overview",
                "2. Full Loan Schedule Table",
                "3. Transaction Ledger History",
                "4. Portfolio Status Breakdown",
                "5. Overdue & Defaulted Alerts",
                "6. Confidential Report Footer",
              ].map((s) => (
                <div key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                  style={{ background: t.bgActive, borderColor: t.border }}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#5b7cfa" }} />
                  <span className="text-xs" style={{ color: t.textMuted }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CONFIG */}
          <div className="rounded-2xl p-5 border" style={{ background: t.bgCard, borderColor: t.border }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2"
              style={{ fontFamily: mono, color: t.textFaint }}>
              <Settings className="w-3.5 h-3.5" /> REPORT CONFIGURATION
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ fontFamily: mono, color: t.textMuted }}>Organization Name</label>
                <input type="text" value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                  style={{ background: t.bgInput, borderColor: t.borderMid, color: t.text, fontFamily: mono }} />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ fontFamily: mono, color: t.textMuted }}>Prepared By</label>
                <input type="text" value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                  style={{ background: t.bgInput, borderColor: t.borderMid, color: t.text, fontFamily: mono }} />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
                style={{ fontFamily: mono, color: t.textMuted }}>Report Title</label>
              <input type="text" value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                style={{ background: t.bgInput, borderColor: t.borderMid, color: t.text, fontFamily: mono }} />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <input type="checkbox" id="include-paid" checked={includePaidOff}
                onChange={(e) => setIncludePaidOff(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer" />
              <label htmlFor="include-paid" className="text-xs cursor-pointer"
                style={{ color: t.textMuted }}>Include completed & paid-off loans in report</label>
            </div>
          </div>

          {/* SUCCESS BANNER */}
          {hasDownloaded && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border"
              style={{ background: "rgba(74,222,128,0.08)", borderColor: "rgba(74,222,128,0.25)" }}>
              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#4ade80" }} />
              <span className="text-xs font-bold" style={{ fontFamily: mono, color: "#4ade80" }}>
                PDF GENERATED & DOWNLOADED SUCCESSFULLY
              </span>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between px-7 py-4 border-t shrink-0"
          style={{ background: t.bgCard, borderColor: t.border }}>
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all border"
            style={{ fontFamily: mono, color: t.textMuted, borderColor: t.border, background: t.bgBtn }}>
            CANCEL
          </button>
          <button onClick={handleGeneratePdf} disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ fontFamily: mono, background: "#5b7cfa", color: "#ffffff", opacity: isGenerating ? 0.7 : 1 }}>
            <Download className="w-4 h-4" />
            {isGenerating ? "COMPILING PDF..." : "DOWNLOAD PDF"}
          </button>
        </div>

      </div>
    </div>
  );
};
