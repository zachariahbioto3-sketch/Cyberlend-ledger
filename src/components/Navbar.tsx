import React from 'react';
import { BarChart3, Plus, FileText, Download } from 'lucide-react';
import { PortfolioMetrics } from '../types';
import { formatCurrency, formatCompactCurrency } from '../utils/loanCalculations';

interface NavbarProps {
  metrics: PortfolioMetrics;
  onOpenNewLoanModal: () => void;
  onExportCSV: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  metrics,
  onOpenNewLoanModal,
  onExportCSV,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Cyberlend</h1>
              <p className="text-xs text-slate-400">Loan Ledger & Portfolio Manager</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Total Lent</p>
              <p className="text-lg font-bold text-white">{formatCompactCurrency(metrics.totalPrincipalLent)}</p>
            </div>
            <div className="text-center border-l border-r border-slate-600 px-6">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Outstanding</p>
              <p className="text-lg font-bold text-blue-400">{formatCompactCurrency(metrics.totalAmountOutstanding)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Monthly Revenue</p>
              <p className="text-lg font-bold text-green-400">{formatCurrency(metrics.totalMonthlyRevenue)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium transition"
              title="Export ledger to CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={onOpenNewLoanModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-bold shadow-lg transition"
            >
              <Plus className="w-4 h-4" />
              New Loan
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};