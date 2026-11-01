import React, { useState } from "react";
import { TrendingUp, Users, PieChart, LineChart } from "lucide-react";
import { Loan, PortfolioMetrics } from "../types";
import { formatCurrency } from "../utils/loanCalculations";
import { calculateRateOfReturn, currentMonthAcquisitionRate, rankBorrowersByExposure } from "../utils/analysisMetrics";
import { GrowthCharts } from "./GrowthCharts";
import { PortfolioDonut } from "./PortfolioDonut";
import { AnalysisModal } from "./AnalysisModal";
import { AssetBanner } from "./AssetBanner";

interface AnalysisPageProps {
  loans: Loan[];
  metrics: PortfolioMetrics;
  theme: any;
}

type CardId = "rate-of-return" | "client-acquisition" | "loan-distribution" | "asset-projection";

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ loans, metrics, theme: t }) => {
  const [openCard, setOpenCard] = useState<CardId | null>(null);

  const rateOfReturn = calculateRateOfReturn(metrics);
  const acquisitionThisMonth = currentMonthAcquisitionRate(loans);
  const ranked = rankBorrowersByExposure(loans);
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];

  const cards: { id: CardId; icon: React.ReactNode; title: string; intro: string; modalSummary: string; modalBody: string; chart: React.ReactNode }[] = [
    {
      id: "asset-projection",
      icon: <LineChart className="w-4 h-4" />,
      title: "Asset Projection",
      intro: "How your lent capital is expected to grow over the coming months, based on current loan terms.",
      modalSummary: "Projected growth of total assets under management",
      modalBody: `Your portfolio currently stands at ${formatCurrency(metrics.totalPrincipalLent)} in principal lent, with ${formatCurrency(metrics.totalOutstanding)} still outstanding. At the current pace of lending and collection, this chart shows how your asset base is expected to move month over month.`,
      chart: <GrowthCharts loans={loans} theme={t} />,
    },
    {
      id: "rate-of-return",
      icon: <TrendingUp className="w-4 h-4" />,
      title: "Rate of Return",
      intro: `Currently earning ${rateOfReturn.toFixed(1)}% return on principal lent, from interest collected.`,
      modalSummary: `${rateOfReturn.toFixed(1)}% return on principal lent so far`,
      modalBody: `Net profit of ${formatCurrency(metrics.totalProfit)} against ${formatCurrency(metrics.totalPrincipalLent)} lent gives a return of ${rateOfReturn.toFixed(1)}%. This reflects interest collected across all loans, active and completed, and will shift as more loans mature or default.`,
      chart: <GrowthCharts loans={loans} theme={t} />,
    },
    {
      id: "client-acquisition",
      icon: <Users className="w-4 h-4" />,
      title: "Client Acquisition",
      intro: `${acquisitionThisMonth} new client${acquisitionThisMonth === 1 ? "" : "s"} added this month.`,
      modalSummary: "New clients acquired over time",
      modalBody: `You added ${acquisitionThisMonth} new client${acquisitionThisMonth === 1 ? "" : "s"} this month, out of ${ranked.length} total unique borrowers on the platform. Steady client growth keeps the lending pipeline healthy alongside repayments from existing borrowers.`,
      chart: null,
    },
    {
      id: "loan-distribution",
      icon: <PieChart className="w-4 h-4" />,
      title: "Loan Distribution",
      intro: "How outstanding loans are spread across active, overdue, completed and defaulted status \u2014 the health of the platform.",
      modalSummary: "Portfolio health across loan statuses",
      modalBody: `${metrics.activeLoansCount} active, ${metrics.overdueCount} overdue, ${metrics.completedLoansCount} completed and ${metrics.defaultedCount} defaulted loans make up the current book. A healthy platform keeps overdue and defaulted shares low relative to active and completed.`,
      chart: <PortfolioDonut metrics={metrics} />,
    },
  ];

  const activeCard = cards.find((c) => c.id === openCard) || null;

  return (
    <div className="overflow-y-auto flex-1" style={{ background: "var(--background)" }}>
      <AssetBanner loans={loans} metrics={metrics} />

      <div className="grid grid-cols-1 md:grid-cols-2">
        {cards.map((card, i) => (
          <button
            key={card.id}
            onClick={() => setOpenCard(card.id)}
            className="text-left p-6 transition-colors hover:bg-[var(--bg-raised)]"
            style={{
              borderColor: "var(--border)",
              borderBottomWidth: i < 2 ? 1 : 0,
              borderBottomStyle: "solid",
              borderRightWidth: i % 2 === 0 ? 1 : 0,
              borderRightStyle: "solid",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: "var(--gold-500)" }}>{card.icon}</span>
              <h3 className="cl-mono text-xs font-bold uppercase tracking-widest" style={{ color: "var(--foreground)" }}>
                {card.title}
              </h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {card.intro}
            </p>
            <span className="inline-block mt-3 text-xs font-semibold" style={{ color: "var(--gold-500)" }}>
              View analysis &rarr;
            </span>
          </button>
        ))}
      </div>

      {top && bottom && (
        <p className="px-6 py-4 text-xs border-t" style={{ color: "var(--muted-foreground)", borderColor: "var(--border)" }}>
          Highest exposure: <span style={{ color: "var(--foreground)" }}>{top.borrowerName}</span> ({formatCurrency(top.outstanding)}) &middot;
          {" "}Lowest: <span style={{ color: "var(--foreground)" }}>{bottom.borrowerName}</span> ({formatCurrency(bottom.outstanding)})
        </p>
      )}

      <AnalysisModal
        open={!!activeCard}
        onClose={() => setOpenCard(null)}
        title={activeCard?.title || ""}
        summary={activeCard?.modalSummary || ""}
        body={activeCard?.modalBody || ""}
        chart={activeCard?.chart}
      />
    </div>
  );
};