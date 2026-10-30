import { Loan, PortfolioMetrics } from "../types";

// ─── RATE OF RETURN ──────────────────────────────────────────────────────────
// Profit earned so far as a percentage of total principal lent out.

export function calculateRateOfReturn(metrics: PortfolioMetrics): number {
  if (metrics.totalPrincipalLent <= 0) return 0;
  return (metrics.totalProfit / metrics.totalPrincipalLent) * 100;
}

// ─── CLIENT ACQUISITION RATE ─────────────────────────────────────────────────
// New unique borrowers added per calendar month, based on originationDate
// of their first loan (falls back to dateJoined when present).

export interface MonthlyAcquisition {
  month: string;      // "2026-10"
  label: string;       // "Oct 2026"
  newClients: number;
}

function monthKey(dateStr: string): string {
  return dateStr ? dateStr.slice(0, 7) : "";
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const idx = parseInt(m, 10) - 1;
  return `${months[idx] ?? m} ${y}`;
}

export function calculateClientAcquisition(loans: Loan[]): MonthlyAcquisition[] {
  const firstSeenByBorrower = new Map<string, string>();

  for (const loan of loans) {
    const joinDate = loan.dateJoined || loan.originationDate;
    const key = loan.borrowerName;
    const existing = firstSeenByBorrower.get(key);
    if (!existing || joinDate < existing) {
      firstSeenByBorrower.set(key, joinDate);
    }
  }

  const countsByMonth = new Map<string, number>();
  for (const joinDate of firstSeenByBorrower.values()) {
    const key = monthKey(joinDate);
    if (!key) continue;
    countsByMonth.set(key, (countsByMonth.get(key) || 0) + 1);
  }

  return Array.from(countsByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, newClients]) => ({ month, label: monthLabel(month), newClients }));
}

export function currentMonthAcquisitionRate(loans: Loan[]): number {
  const series = calculateClientAcquisition(loans);
  if (series.length === 0) return 0;
  return series[series.length - 1].newClients;
}

// ─── BORROWER RANKING ────────────────────────────────────────────────────────
// Ranks unique borrowers by total outstanding exposure, highest to lowest,
// for the "asset distribution" text summary.

export interface BorrowerExposure {
  borrowerName: string;
  outstanding: number;
  loanAmount: number;
  shareOfPortfolio: number; // percentage
}

export function rankBorrowersByExposure(loans: Loan[]): BorrowerExposure[] {
  const byBorrower = new Map<string, { outstanding: number; loanAmount: number }>();

  for (const loan of loans) {
    const existing = byBorrower.get(loan.borrowerName) || { outstanding: 0, loanAmount: 0 };
    existing.outstanding += loan.remainingBalance || 0;
    existing.loanAmount += loan.loanAmount || 0;
    byBorrower.set(loan.borrowerName, existing);
  }

  const totalOutstanding = Array.from(byBorrower.values()).reduce((sum, b) => sum + b.outstanding, 0);

  return Array.from(byBorrower.entries())
    .map(([borrowerName, v]) => ({
      borrowerName,
      outstanding: v.outstanding,
      loanAmount: v.loanAmount,
      shareOfPortfolio: totalOutstanding > 0 ? (v.outstanding / totalOutstanding) * 100 : 0,
    }))
    .sort((a, b) => b.outstanding - a.outstanding);
}
