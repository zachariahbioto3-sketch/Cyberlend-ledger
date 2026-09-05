import React from 'react';
import { PlusCircle, Download, RotateCcw, Search, TrendingUp } from 'lucide-react';
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
    <header className="hidden md:flex sticky top-0 z-30 h-14 items-center px-6 gap-4 border-b border-white/8"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>

      {/* Brand */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center overflow-hidden bg-white/5">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm text-white tracking-widest uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>
            CYBERLEND
          </span>
          <p className="text-[8px] text-white/30 tracking-widest uppercase">Fast Honest Reliable</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
        <input
          type="text"
          placeholder="Search loans, borrowers..."
          className="w-full pl-8 pr-4 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 transition-colors text-white placeholder-white/20"
          style={{ fontFamily: "'Space Mono', monospace" }}
        />
      </div>

      {/* Metrics */}
      <div className="hidden lg:flex items-center gap-5 text-xs ml-2">
        {[
          { label: 'Lent', value: formatCompactCurrency(metrics.totalPrincipalLent) },
          { label: 'Outstanding', value: formatCompactCurrency(metrics.totalOutstanding) },
          { label: 'Collected', value: formatCompactCurrency(metrics.totalCollected) },
          { label: 'Profit', value: formatCompactCurrency(metrics.totalProfit) },
        ].map((m, i) => (
          <React.Fragment key={m.label}>
            {i > 0 && <div className="w-px h-5 bg-white/10" />}
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-widest" style={{ fontFamily: "'Space Mono', monospace" }}>{m.label}</p>
              <p className="font-bold text-white text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>{m.value}</p>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <button onClick={onExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-all">
          <Download className="w-3 h-3" />
          Export
        </button>
        <button onClick={onResetData}
          className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-colors" title="Reset">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button onClick={onOpenNewLoanModal}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-black hover:bg-white/90 transition-all shadow-lg"
          style={{ fontFamily: "'Space Mono', monospace" }}>
          <PlusCircle className="w-3.5 h-3.5" />
          NEW LOAN
        </button>
        <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center ml-1">
          <span className="text-white text-[9px] font-bold" style={{ fontFamily: "'Space Mono', monospace" }}>CL</span>
        </div>
      </div>
    </header>
  );
};
