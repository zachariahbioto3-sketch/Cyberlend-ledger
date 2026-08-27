import React from 'react';
import { Building2, PlusCircle, Download, RotateCcw, Search, Bell } from 'lucide-react';
import { PortfolioMetrics } from '../types';
import { formatCompactCurrency } from '../utils/loanCalculations';

interface NavbarProps {
  metrics: PortfolioMetrics;
  onOpenNewLoanModal: () => void;
  onExportCSV: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ metrics, onOpenNewLoanModal, onExportCSV, onResetData }) => {
  return (
    <header className="hidden md:flex sticky top-0 z-30 bg-white border-b border-gray-100 h-14 items-center px-6 gap-4 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-2.5 min-w-[180px]">
        <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-black tracking-tight">Cyberlend</span>
      </div>

      {/* Search bar */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search loans, borrowers..."
          className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors"
        />
      </div>

      {/* Quick metrics */}
      <div className="hidden lg:flex items-center gap-5 text-xs ml-4">
        <div className="text-center">
          <p className="text-gray-400 text-[10px] uppercase tracking-wide">Lent</p>
          <p className="font-bold text-black">{formatCompactCurrency(metrics.totalPrincipalLent)}</p>
        </div>
        <div className="w-px h-6 bg-gray-100" />
        <div className="text-center">
          <p className="text-gray-400 text-[10px] uppercase tracking-wide">Outstanding</p>
          <p className="font-bold text-black">{formatCompactCurrency(metrics.totalOutstanding)}</p>
        </div>
        <div className="w-px h-6 bg-gray-100" />
        <div className="text-center">
          <p className="text-gray-400 text-[10px] uppercase tracking-wide">Collected</p>
          <p className="font-bold text-black">{formatCompactCurrency(metrics.totalCollected)}</p>
        </div>
        <div className="w-px h-6 bg-gray-100" />
        <div className="text-center">
          <p className="text-gray-400 text-[10px] uppercase tracking-wide">Profit</p>
          <p className="font-bold text-black">{formatCompactCurrency(metrics.totalProfit)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <button onClick={onExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-100 hover:bg-gray-200 text-black transition-colors">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
        <button onClick={onResetData} className="p-1.5 rounded-xl text-gray-400 hover:text-black hover:bg-gray-100 transition-colors" title="Reset sample data">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button onClick={onOpenNewLoanModal} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-black hover:bg-gray-900 text-white shadow-sm transition-colors">
          <PlusCircle className="w-3.5 h-3.5" />
          New Loan
        </button>
        <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center ml-1">
          <span className="text-white text-[10px] font-bold">CL</span>
        </div>
      </div>
    </header>
  );
};
