import React from "react";
import { Loan, PortfolioMetrics } from "../types";
import { formatCompactCurrency } from "../utils/loanCalculations";

interface TrackerBarProps {
  metrics: PortfolioMetrics;
  theme: any;
  selectedClient: Loan;
  onClose: () => void;
}

export const TrackerBar: React.FC<TrackerBarProps> = ({ metrics, theme: t, selectedClient, onClose }) => {
  const mono = "'Space Mono', monospace";
  return (
    <div
      className="flex items-center justify-between px-6 py-3 border-b gap-4 shrink-0"
      style={{
        background: t.bgCard,
        borderColor: t.border,
        animation: "slideDown 0.3s ease-out",
      }}
    >
      <div className="flex items-center gap-6 flex-1 flex-wrap">
        {[
          { label: "TOTAL LENT",  value: formatCompactCurrency(metrics.totalPrincipalLent), color: "#5b7cfa" },
          { label: "OUTSTANDING", value: formatCompactCurrency(metrics.totalOutstanding),   color: "#f59e0b" },
          { label: "COLLECTED",   value: formatCompactCurrency(metrics.totalCollected),     color: "#4ade80" },
          { label: "PROFIT",      value: formatCompactCurrency(metrics.totalProfit),        color: "#a78bfa" },
        ].map((stat, i) => (
          <React.Fragment key={stat.label}>
            {i > 0 && <div className="w-px h-5 shrink-0" style={{ background: t.border }} />}
            <div className="shrink-0">
              <p className="text-[9px] uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>{stat.label}</p>
              <p className="text-xs font-bold" style={{ fontFamily: mono, color: stat.color }}>{stat.value}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full border flex items-center justify-center shrink-0"
            style={{ background: t.bgActive, borderColor: t.borderMid }}
          >
            <span className="text-xs font-bold" style={{ fontFamily: mono, color: t.text }}>
              {selectedClient.borrowerName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-xs font-bold" style={{ fontFamily: mono, color: t.text }}>{selectedClient.borrowerName}</p>
            <p className="text-[9px]" style={{ fontFamily: mono, color: t.textFaint }}>VIEWING PROFILE</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all hover:opacity-80"
          style={{ fontFamily: mono, background: t.bgBtn, borderColor: t.border, color: t.textMuted }}
        >
          ? CLOSE PROFILE
        </button>
      </div>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
