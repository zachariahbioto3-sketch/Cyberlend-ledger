import React, { useState } from "react";
import { Loan, PortfolioMetrics } from "../types";
import { formatCurrency } from "../utils/loanCalculations";
import { calculateRateOfReturn, currentMonthAcquisitionRate, rankBorrowersByExposure } from "../utils/analysisMetrics";
import { GrowthCharts } from "./GrowthCharts";
import { PortfolioDonut } from "./PortfolioDonut";
import { AnalysisModal } from "./AnalysisModal";

interface MobileAnalysisViewProps {
  loans: Loan[];
  metrics: PortfolioMetrics;
  theme: any;
}

type ModalId = "distribution" | "projection" | "health" | null;

export const MobileAnalysisView: React.FC<MobileAnalysisViewProps> = ({ loans, metrics, theme: t }) => {
  const [open, setOpen] = useState<ModalId>(null);

  const ranked = rankBorrowersByExposure(loans);
  const top3 = ranked.slice(0, 3);
  const bottom = ranked[ranked.length - 1];
  const rateOfReturn = calculateRateOfReturn(metrics);
  const acquisitionThisMonth = currentMonthAcquisitionRate(loans);

  const distributionSummary = ranked.length === 0
    ? "No borrowers yet."
    : `${top3.map((b) => `${b.borrowerName} (${formatCurrency(b.outstanding)})`).join(", ")}${
        ranked.length > 3 ? `, down to ${bottom.borrowerName} (${formatCurrency(bottom.outstanding)})` : ""
      }.`;

  const distributionBody = `Assets are spread across ${ranked.length} unique borrower${ranked.length === 1 ? "" : "s"}. ${
    ranked[0] ? `${ranked[0].borrowerName} holds the largest share at ${ranked[0].shareOfPortfolio.toFixed(1)}% of outstanding exposure.` : ""
  } ${bottom && ranked.length > 1 ? `${bottom.borrowerName} holds the smallest, at ${bottom.shareOfPortfolio.toFixed(1)}%.` : ""} Return on principal lent stands at ${rateOfReturn.toFixed(1)}%, with ${acquisitionThisMonth} new client${acquisitionThisMonth === 1 ? "" : "s"} added this month.`;

  return (
    <div className="px-4 pb-28 pt-4 space-y-4">
      {/* Ranked text summary */}
      <button
        onClick={() => setOpen("distribution")}
        className="w-full text-left rounded-[var(--radius-md)] border p-4"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        <h3 className="cl-mono text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)" }}>
          Asset Distribution
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
          {distributionSummary}
        </p>
        <span className="inline-block mt-2 text-xs font-semibold" style={{ color: "var(--gold-500)" }}>
          View full breakdown →
        </span>
      </button>

      {/* Asset projection chart */}
      <button
        onClick={() => setOpen("projection")}
        className="w-full text-left rounded-[var(--radius-md)] border p-4"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        <h3 className="cl-mono text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)" }}>
          Asset Projection
        </h3>
        <GrowthCharts loans={loans} theme={t} />
      </button>

      {/* Portfolio health chart */}
      <button
        onClick={() => setOpen("health")}
        className="w-full text-left rounded-[var(--radius-md)] border p-4"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        <h3 className="cl-mono text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)" }}>
          Portfolio Health
        </h3>
        <PortfolioDonut metrics={metrics} compact />
      </button>

      <AnalysisModal
        open={open === "distribution"}
        onClose={() => setOpen(null)}
        title="Asset Distribution"
        summary="Borrowers ranked by outstanding exposure, highest to lowest"
        body={distributionBody}
      />
      <AnalysisModal
        open={open === "projection"}
        onClose={() => setOpen(null)}
        title="Asset Projection"
        summary="Projected growth of total assets under management"
        body={`Principal lent: ${formatCurrency(metrics.totalPrincipalLent)}. Outstanding: ${formatCurrency(metrics.totalOutstanding)}. This chart tracks how your lent capital moves month over month.`}
        chart={<GrowthCharts loans={loans} theme={t} />}
      />
      <AnalysisModal
        open={open === "health"}
        onClose={() => setOpen(null)}
        title="Portfolio Health"
        summary="Loan distribution across statuses"
        body={`${metrics.activeLoansCount} active, ${metrics.overdueCount} overdue, ${metrics.completedLoansCount} completed, ${metrics.defaultedCount} defaulted.`}
        chart={<PortfolioDonut metrics={metrics} />}
      />
    </div>
  );
};
