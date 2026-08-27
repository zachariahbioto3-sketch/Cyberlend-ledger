import React, { useState, useEffect } from 'react';
import { useLoanStore } from './store/loanStore';
import { sampleLoans } from './data/sampleLoans';
import { Loan } from './types';
import { Navbar, PortfolioOverview, LoanLedgerTable, NewLoanModal, RecordPaymentModal, LoanDetailModal } from './components';
import { Building2, LayoutDashboard, Users, TrendingUp, Settings, PlusCircle, Download, RotateCcw, Bell, Menu, X } from 'lucide-react';
import { formatCompactCurrency } from './utils/loanCalculations';

function App() {
  const { loans, setLoans, addLoan, recordPayment, deleteLoan, metrics } = useLoanStore();
  const [newLoanOpen, setNewLoanOpen] = useState(false);
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null);
  const [detailLoan, setDetailLoan] = useState<Loan | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (loans.length === 0) setLoans(sampleLoans);
  }, []);

  const handleSavePayment = (loanId: string, transaction: any) => {
    recordPayment(loanId, transaction);
    setPaymentLoan(null);
  };

  const handleExportCSV = () => {
    if (loans.length === 0) { alert('No loans to export'); return; }
    const headers = ['Loan #','Borrower','Phone','Principal','Total Due','Monthly','Paid','Remaining','Status','Months Done','Months Left'];
    const rows = loans.map((l) => [l.loanNumber,l.borrowerName,l.borrowerPhone,l.loanAmount,l.totalRepayable,l.monthlyPayment,l.amountPaid,l.remainingBalance,l.status,l.monthsCompleted,l.monthsRemaining]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `cyberlend-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleResetData = () => {
    if (confirm('Reset to sample data?')) setLoans(sampleLoans);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-16 bg-white border-r border-gray-100 items-center py-5 gap-5 fixed h-full z-40 shadow-sm">
        {/* Logo */}
        <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center mb-2">
          <Building2 className="w-4 h-4 text-white" />
        </div>

        {/* Nav icons */}
        <nav className="flex flex-col gap-2 flex-1">
          {[
            { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', active: true },
            { icon: <Users className="w-4 h-4" />, label: 'Borrowers' },
            { icon: <TrendingUp className="w-4 h-4" />, label: 'Analytics' },
          ].map((item) => (
            <button
              key={item.label}
              title={item.label}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${item.active ? 'bg-black text-white' : 'text-gray-300 hover:text-black hover:bg-gray-100'}`}
            >
              {item.icon}
            </button>
          ))}
        </nav>

        {/* Bottom icons */}
        <div className="flex flex-col gap-2">
          <button onClick={handleExportCSV} title="Export CSV" className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-300 hover:text-black hover:bg-gray-100 transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={handleResetData} title="Reset Data" className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-300 hover:text-black hover:bg-gray-100 transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">CL</span>
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 md:ml-16 flex flex-col min-h-screen">

        {/* Desktop top navbar */}
        <Navbar
          metrics={metrics}
          onOpenNewLoanModal={() => setNewLoanOpen(true)}
          onExportCSV={handleExportCSV}
          onResetData={handleResetData}
        />

        {/* ── MOBILE HEADER (FinSight style) ── */}
        <div className="md:hidden">
          {/* Top bar */}
          <div className="bg-white px-4 pt-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">CL</span>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Good day,</p>
                <p className="text-xs font-bold text-black">Cyberlend</p>
              </div>
            </div>
            <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">
              <Bell className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Dark balance card (FinSight style) */}
          <div className="mx-4 rounded-2xl bg-black text-white p-5 mb-4">
            <p className="text-[11px] text-gray-400 mb-1">Total Outstanding</p>
            <p className="text-3xl font-bold mb-4">{formatCompactCurrency(metrics.totalOutstanding)}</p>
            <div className="flex justify-between text-[11px]">
              <div>
                <p className="text-gray-400">Total Lent</p>
                <p className="font-semibold">{formatCompactCurrency(metrics.totalPrincipalLent)}</p>
              </div>
              <div>
                <p className="text-gray-400">Collected</p>
                <p className="font-semibold">{formatCompactCurrency(metrics.totalCollected)}</p>
              </div>
              <div>
                <p className="text-gray-400">Profit</p>
                <p className="font-semibold">{formatCompactCurrency(metrics.totalProfit)}</p>
              </div>
            </div>
          </div>

          {/* Quick actions row */}
          <div className="px-4 flex gap-3 mb-4">
            <button onClick={() => setNewLoanOpen(true)} className="flex-1 flex flex-col items-center gap-1.5 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <PlusCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-semibold text-black">New Loan</span>
            </button>
            <button onClick={handleExportCSV} className="flex-1 flex flex-col items-center gap-1.5 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <Download className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-semibold text-black">Export</span>
            </button>
            <button onClick={handleResetData} className="flex-1 flex flex-col items-center gap-1.5 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-semibold text-black">Reset</span>
            </button>
          </div>

          {/* Mobile transaction list */}
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-black">Loans</h2>
              <span className="text-[11px] text-gray-400">{loans.length} total</span>
            </div>
            <div className="space-y-2">
              {loans.slice(0, 10).map((loan) => {
                const statusColor: Record<string, string> = {
                  Active: 'bg-black text-white',
                  Overdue: 'bg-red-100 text-red-600',
                  Completed: 'bg-gray-100 text-gray-500',
                  Defaulted: 'bg-red-200 text-red-900',
                };
                return (
                  <div
                    key={loan.id}
                    onClick={() => setDetailLoan(loan)}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between active:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{loan.borrowerName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-black">{loan.borrowerName}</p>
                        <p className="text-[10px] text-gray-400">{loan.category} · {loan.monthsRemaining} mo left</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-black">{formatCompactCurrency(loan.remainingBalance)}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${statusColor[loan.status]}`}>
                        {loan.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── DESKTOP MAIN CONTENT ── */}
        <main className="hidden md:block flex-1 p-6 space-y-6">
          <PortfolioOverview metrics={metrics} loans={loans} />
          <LoanLedgerTable
            loans={loans}
            onSelectLoan={setDetailLoan}
            onRecordPayment={setPaymentLoan}
            onDeleteLoan={deleteLoan}
            onOpenNewLoan={() => setNewLoanOpen(true)}
          />
        </main>

        {/* ── MOBILE BOTTOM NAV (FinSight style) ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-4 py-3 z-30 shadow-lg">
          <button className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
          </button>
          <button className="flex flex-col items-center gap-1">
            <TrendingUp className="w-5 h-5 text-gray-300" />
          </button>
          <button onClick={() => setNewLoanOpen(true)} className="flex flex-col items-center gap-1">
            <PlusCircle className="w-5 h-5 text-gray-300" />
          </button>
          <button className="flex flex-col items-center gap-1">
            <Users className="w-5 h-5 text-gray-300" />
          </button>
        </nav>

        {/* Bottom padding for mobile nav */}
        <div className="md:hidden h-20" />
      </div>

      {/* Modals */}
      <NewLoanModal isOpen={newLoanOpen} onClose={() => setNewLoanOpen(false)} onAddLoan={(data) => { addLoan(data); setNewLoanOpen(false); }} />
      <RecordPaymentModal isOpen={!!paymentLoan} loan={paymentLoan} onClose={() => setPaymentLoan(null)} onSavePayment={handleSavePayment} />
      <LoanDetailModal loan={detailLoan} onClose={() => setDetailLoan(null)} onRecordPayment={(loan) => { setDetailLoan(null); setPaymentLoan(loan); }} />
    </div>
  );
}

export default App;
