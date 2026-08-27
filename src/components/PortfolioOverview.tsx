import React from 'react';
import { Loan, PortfolioMetrics } from '../types';
import { formatCurrency, formatDate } from '../utils/loanCalculations';
import { AlertCircle, TrendingUp, DollarSign, Users } from 'lucide-react';

interface PortfolioOverviewProps {
  metrics: PortfolioMetrics;
  loans: Loan[];
  onSelectLoan: (loan: Loan) => void;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  metrics,
  loans,
  onSelectLoan,
}) => {
  const overdueLoans = loans.filter(
    (l) => l.status === 'Overdue' || (l.nextDueDate && new Date(l.nextDueDate) < new Date())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600 font-medium">Total Loans Originated</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalLoansOriginated}</p>
          <p className="text-xs text-gray-500 mt-2">
            {metrics.activeLoansCount} active • {metrics.completedLoansCount} completed
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600 font-medium">Total Principal Lent</span>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.totalPrincipalLent)}</p>
          <p className="text-xs text-gray-500 mt-2">KES currency</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600 font-medium">Interest Earned (20%)</span>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.totalInterestEarned)}</p>
          <p className="text-xs text-gray-500 mt-2">{formatCurrency(metrics.totalAmountPaid)} paid to date</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600 font-medium">Amount Outstanding</span>
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.totalAmountOutstanding)}</p>
          <p className="text-xs text-gray-500 mt-2">{metrics.overdueCount} loans overdue</p>
        </div>
      </div>

      {overdueLoans.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Overdue Payments</h3>
              <p className="text-sm text-red-700 mt-1">{overdueLoans.length} loan(s) require immediate attention:</p>
              <div className="mt-3 space-y-2">
                {overdueLoans.slice(0, 3).map((loan) => (
                  <button
                    key={loan.id}
                    onClick={() => onSelectLoan(loan)}
                    className="w-full text-left p-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm text-red-900 transition"
                  >
                    <span className="font-semibold">{loan.borrowerName}</span> ({loan.loanNumber}) - Due: {formatDate(loan.nextDueDate)} - {formatCurrency(loan.monthlyPayment)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};