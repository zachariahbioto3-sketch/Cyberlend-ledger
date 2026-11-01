$ErrorActionPreference = "Stop"
$utf8 = New-Object System.Text.UTF8Encoding($false)
Set-Location "C:\Users\USER\Desktop\cyberlend-ledger"

function Swap($text, $old, $new) {
  $n = ([regex]::Matches($text, [regex]::Escape($old))).Count
  if ($n -eq 0) { Write-Host "  (already applied, skipping)"; return $text }
  if ($n -gt 1) { throw "Expected 1 match, found $n for: $old" }
  return $text.Replace($old, $new)
}

Write-Host "1. App.tsx merge wiring..."
$p = "$PWD\src\App.tsx"
$s = [System.IO.File]::ReadAllText($p)
$before = $s
$s = Swap $s 'className="flex-1 flex flex-col min-w-0 overflow-x-hidden"' 'className={"flex-1 flex flex-col min-w-0 overflow-x-hidden" + (desktopTab === "analysis" ? " analysis-merge" : "")}'
$s = Swap $s 'className="flex items-center justify-between px-4 pt-4 pb-3 border-b" style=' 'className={"flex items-center justify-between px-4 pt-4 pb-3 border-b" + (mobileTab === "analysis" ? " analysis-mobile-top" : "")} style='
if ($s -ne $before) { [System.IO.File]::WriteAllText($p, $s, $utf8); Write-Host "  written" }

Write-Host "2. index.css banner styles..."
$cssPath = "$PWD\src\index.css"
$cssContent = [System.IO.File]::ReadAllText($cssPath)
if ($cssContent -notmatch '--banner-bg') {
  $css = @"

/* ---- Analysis banner (change --banner-bg to recolor the banner and top bar) ---- */
:root { --banner-bg: #0E6B7A; }

.analysis-merge > header {
  background: var(--banner-bg) !important;
  border-color: transparent !important;
  backdrop-filter: none !important;
}
.analysis-merge > header button {
  background: rgba(255,255,255,0.16) !important;
  color: #fff !important;
}
.analysis-merge > div:nth-child(2) {
  background: var(--banner-bg);
  border-color: transparent !important;
}
.analysis-merge > div:nth-child(2) button { color: #fff !important; }

.analysis-mobile-top {
  background: var(--banner-bg);
  border-color: transparent !important;
}
.analysis-mobile-top .font-brand,
.analysis-mobile-top svg { color: #fff !important; }
.analysis-mobile-top button {
  background: rgba(255,255,255,0.16) !important;
  border-color: transparent !important;
}
"@
  [System.IO.File]::AppendAllText($cssPath, $css, $utf8)
  Write-Host "  appended"
} else {
  Write-Host "  (already present, skipping)"
}

Write-Host "3. AssetBanner.tsx..."
$banner = @'
import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Loan, PortfolioMetrics } from "../types";
import { formatCurrency } from "../utils/loanCalculations";

interface AssetBannerProps {
  loans: Loan[];
  metrics: PortfolioMetrics;
  onClick?: () => void;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const monthKey = (d: string) => (d ? d.slice(0, 7) : "");
const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  return MONTHS[parseInt(m, 10) - 1] + " " + y.slice(2);
};

export const AssetBanner: React.FC<AssetBannerProps> = ({ loans, metrics, onClick }) => {
  const months = [...new Set(loans.map((l) => monthKey(l.originationDate)))].filter(Boolean).sort();

  let running = 0;
  const actual = months.map((m) => {
    running += loans.filter((l) => monthKey(l.originationDate) === m).reduce((s, l) => s + l.loanAmount, 0);
    return { month: monthLabel(m), assets: running };
  });

  const lastThree = actual.slice(-3);
  const avg = lastThree.length > 1
    ? (lastThree[lastThree.length - 1].assets - lastThree[0].assets) / (lastThree.length - 1)
    : 0;
  const base = actual.length ? actual[actual.length - 1].assets : 0;
  const last = months.length ? months[months.length - 1] : new Date().toISOString().slice(0, 7);
  const [ly, lm] = last.split("-").map((n) => parseInt(n, 10));

  const projection = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(ly, lm - 1 + i + 1, 1);
    return {
      month: MONTHS[d.getMonth()] + " " + String(d.getFullYear()).slice(2),
      projected: Math.round(base + avg * (i + 1)),
    };
  });

  const data = [
    ...actual.map((d, i) => ({
      month: d.month,
      assets: d.assets as number | null,
      projected: (i === actual.length - 1 ? d.assets : null) as number | null,
    })),
    ...projection.map((d) => ({
      month: d.month,
      assets: null as number | null,
      projected: d.projected as number | null,
    })),
  ];

  const tick = { fontSize: 11, fill: "rgba(255,255,255,0.75)" };

  return (
    <div
      onClick={onClick}
      className="px-5 pt-4 pb-6 rounded-b-[28px] text-white"
      style={{ background: "var(--banner-bg)", cursor: onClick ? "pointer" : "default" }}
    >
      <p className="cl-mono text-[11px] font-bold uppercase tracking-widest opacity-80">Asset Growth</p>
      <p className="cl-mono text-3xl font-bold mt-1">{formatCurrency(metrics.totalPrincipalLent)}</p>
      <p className="text-xs opacity-80 mb-3">Principal lent, with 6-month projection</p>
      <ResponsiveContainer width="100%" height={200} minWidth={0}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
          <XAxis dataKey="month" tick={tick} axisLine={false} tickLine={false} />
          <YAxis
            tick={tick}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v: number) => (v >= 1000 ? (v / 1000).toFixed(0) + "k" : String(v))}
          />
          <Tooltip
            formatter={(v: any) => "KES " + Number(v).toLocaleString()}
            contentStyle={{ background: "#111214", border: "none", borderRadius: 12, color: "#fff", fontSize: 12 }}
          />
          <Line type="monotone" dataKey="assets" stroke="#FFFFFF" strokeWidth={2.5} dot={false} connectNulls={false} name="Actual" />
          <Line type="monotone" dataKey="projected" stroke="rgba(255,255,255,0.7)" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls={false} name="Projected" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
'@
[System.IO.File]::WriteAllText("$PWD\src\components\AssetBanner.tsx", $banner, $utf8)
Write-Host "  written"

Write-Host "4. PortfolioDonut.tsx bare mode..."
$donutPath = "$PWD\src\components\PortfolioDonut.tsx"
$donut = [System.IO.File]::ReadAllText($donutPath)
if ($donut -notmatch 'bare\?') {
  $donut = $donut.Replace('interface Props { metrics: PortfolioMetrics; compact?: boolean }', 'interface Props { metrics: PortfolioMetrics; compact?: boolean; bare?: boolean }')
  $donut = $donut.Replace('export const PortfolioDonut: React.FC<Props> = ({ metrics, compact = false }) => {', 'export const PortfolioDonut: React.FC<Props> = ({ metrics, compact = false, bare = false }) => {')
  $oldReturn = @'
  return (
    <ChartCard title="Portfolio health">
      <div style={{ position: "relative", height: chartH, width: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={innerR} outerRadius={outerR} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {data.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <p style={{ fontFamily: FONT, fontSize: compact ? 24 : 32, fontWeight: 700, color: INK, lineHeight: 1 }}>{metrics.totalLoansOriginated}</p>
          <p style={{ fontFamily: FONT, fontSize: 12, color: MUTED, marginTop: 4 }}>Total</p>
        </div>
      </div>
      <Legend items={data.map((d) => ({ label: `${d.name} ${d.value}`, color: STATUS_COLORS[d.name] }))} />
    </ChartCard>
  )
}
'@
  $newReturn = @'
  const body = (
    <>
      <div style={{ position: "relative", height: chartH, width: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={innerR} outerRadius={outerR} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {data.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <p style={{ fontFamily: FONT, fontSize: compact ? 24 : 32, fontWeight: 700, color: INK, lineHeight: 1 }}>{metrics.totalLoansOriginated}</p>
          <p style={{ fontFamily: FONT, fontSize: 12, color: MUTED, marginTop: 4 }}>Total</p>
        </div>
      </div>
      <Legend items={data.map((d) => ({ label: `${d.name} ${d.value}`, color: STATUS_COLORS[d.name] }))} />
    </>
  )

  if (bare) return body

  return <ChartCard title="Portfolio health">{body}</ChartCard>
}
'@
  $donut = $donut.Replace($oldReturn, $newReturn)
  [System.IO.File]::WriteAllText($donutPath, $donut, $utf8)
  Write-Host "  written"
} else {
  Write-Host "  (already present, skipping)"
}

Write-Host "5. AnalysisPage.tsx + MobileAnalysisView.tsx (final layout)..."
# (full file contents written unconditionally — safe to re-run)
$desktop = @'
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
'@
[System.IO.File]::WriteAllText("$PWD\src\components\AnalysisPage.tsx", $desktop, $utf8)

$mobile = @'
import React, { useState } from "react";
import { Loan, PortfolioMetrics } from "../types";
import { formatCurrency } from "../utils/loanCalculations";
import { calculateRateOfReturn, currentMonthAcquisitionRate, rankBorrowersByExposure } from "../utils/analysisMetrics";
import { GrowthCharts } from "./GrowthCharts";
import { PortfolioDonut } from "./PortfolioDonut";
import { AnalysisModal } from "./AnalysisModal";
import { AssetBanner } from "./AssetBanner";

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
    <div className="pb-28" style={{ background: "var(--background)" }}>
      <AssetBanner loans={loans} metrics={metrics} onClick={() => setOpen("projection")} />

      <div>
        <button
          onClick={() => setOpen("distribution")}
          className="w-full text-left p-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h3 className="cl-mono text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)" }}>
            Asset Distribution
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            {distributionSummary}
          </p>
          <span className="inline-block mt-2 text-xs font-semibold" style={{ color: "var(--gold-500)" }}>
            View full breakdown &rarr;
          </span>
        </button>

        <button
          onClick={() => setOpen("health")}
          className="w-full text-left p-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h3 className="cl-mono text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)" }}>
            Portfolio Health
          </h3>
          <PortfolioDonut metrics={metrics} compact bare />
        </button>
      </div>

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
'@
[System.IO.File]::WriteAllText("$PWD\src\components\MobileAnalysisView.tsx", $mobile, $utf8)

Write-Host ""
Write-Host "Done. Run: npm run build"