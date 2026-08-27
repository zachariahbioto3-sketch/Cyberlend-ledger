import React from 'react';
import { TrendingUp, Wallet, AlertCircle, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react';
import { Loan, PortfolioMetrics } from '../types';
import { formatCurrency } from '../utils/loanCalculations';

interface PortfolioOverviewProps {
  metrics: PortfolioMetrics;
  loans: Loan[];
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ metrics, loans }) => {
  const overdueLoans = loans.filter((l) => l.status === 'Overdue');

  const cards = [
    {
      label: 'Total Lent',
      value: formatCurrency(metrics.totalPrincipalLent),
      sub: `${metrics.totalLoansOriginated} loans`,
      icon: <Wallet className="w-4 h-4" />,
    },
    {
      label: 'Outstanding',
      value: formatCurrency(metrics.totalOutstanding),
      sub: `${metrics.activeLoansCount} active`,
      icon: <Clock className="w-4 h-4" />,
    },
    {
      label: 'Collected',
      value: formatCurrency(metrics.totalCollected),
      sub: `${metrics.completedLoansCount} completed`,
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    {
      label: 'Net Profit',
      value: formatCurrency(metrics.totalProfit),
      sub: 'from interest',
      icon: <TrendingUp className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <div key={card.label} className={`rounded-2xl p-5 border transition-shadow hover:shadow-md ${i === 0 ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${i === 0 ? 'text-gray-400' : 'text-gray-400'}`}>{card.label}</span>
              <div className={`p-1.5 rounded-lg ${i === 0 ? 'bg-white/10' : 'bg-gray-100'}`}>
                {card.icon}
              </div>
            </div>
            <div className={`text-xl font-bold ${i === 0 ? 'text-white' : 'text-black'}`}>{card.value}</div>
            <p className={`text-[11px] mt-1 ${i === 0 ? 'text-gray-400' : 'text-gray-400'}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {overdueLoans.length > 0 && (
        <div className="bg-black text-white rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-white/10 shrink-0">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold">
              {overdueLoans.length} Overdue Loan{overdueLoans.length > 1 ? 's' : ''} — Collect Now
            </h4>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
              {overdueLoans.map((l) => (
                <span key={l.id}>
                  <span className="font-semibold text-white">{l.borrowerName}</span>
                  {' · '}
                  <span className="text-gray-300">{formatCurrency(l.monthlyPayment)} overdue</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
