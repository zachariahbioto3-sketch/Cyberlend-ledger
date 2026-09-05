import React from 'react';
import { TrendingUp, Wallet, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Loan, PortfolioMetrics } from '../types';
import { formatCurrency } from '../utils/loanCalculations';

interface PortfolioOverviewProps {
  metrics: PortfolioMetrics;
  loans: Loan[];
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ metrics, loans }) => {
  const overdueLoans = loans.filter((l) => l.status === 'Overdue');

  const cards = [
    { label: 'TOTAL LENT', value: formatCurrency(metrics.totalPrincipalLent), sub: `${metrics.totalLoansOriginated} loans`, icon: <Wallet className="w-4 h-4" />, highlight: true },
    { label: 'OUTSTANDING', value: formatCurrency(metrics.totalOutstanding), sub: `${metrics.activeLoansCount} active`, icon: <Clock className="w-4 h-4" /> },
    { label: 'COLLECTED', value: formatCurrency(metrics.totalCollected), sub: `${metrics.completedLoansCount} completed`, icon: <CheckCircle2 className="w-4 h-4" /> },
    { label: 'NET PROFIT', value: formatCurrency(metrics.totalProfit), sub: 'from interest', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div key={card.label}
            className="rounded-2xl p-5 border transition-all hover:border-white/20 group"
            style={{ background: card.highlight ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)', borderColor: card.highlight ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/30" style={{ fontFamily: "'Space Mono', monospace" }}>{card.label}</span>
              <div className="p-1.5 rounded-lg bg-white/5 text-white/30 group-hover:text-white/60 transition-colors">{card.icon}</div>
            </div>
            <div className="text-xl font-bold text-white" style={{ fontFamily: "'Space Mono', monospace" }}>{card.value}</div>
            <p className="text-[10px] mt-1 text-white/30">{card.sub}</p>
          </div>
        ))}
      </div>

      {overdueLoans.length > 0 && (
        <div className="rounded-2xl p-4 border border-white/10 flex items-start gap-3"
          style={{ background: 'rgba(255,50,50,0.05)' }}>
          <div className="p-2 rounded-xl bg-white/5 shrink-0">
            <AlertCircle className="w-4 h-4 text-white/60" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white" style={{ fontFamily: "'Space Mono', monospace" }}>
              {overdueLoans.length} OVERDUE â€” COLLECT NOW
            </h4>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
              {overdueLoans.map((l) => (
                <span key={l.id}>
                  <span className="font-semibold text-white/70">{l.borrowerName}</span>
                  {' Â· '}
                  <span>{formatCurrency(l.monthlyPayment)} overdue</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
