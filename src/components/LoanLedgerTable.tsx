import React, { useState, useMemo } from 'react';
import { Loan } from '../types';
import { formatCurrency, formatDate } from '../utils/loanCalculations';
import { ChevronRight, Plus, Trash2, Search, SlidersHorizontal } from 'lucide-react';

interface LoanLedgerTableProps {
  loans: Loan[];
  onSelectLoan: (loan: Loan) => void;
  onRecordPayment: (loan: Loan) => void;
  onDeleteLoan: (loanId: string) => void;
  onOpenNewLoan: () => void;
}

export const LoanLedgerTable: React.FC<LoanLedgerTableProps> = ({
  loans, onSelectLoan, onRecordPayment, onDeleteLoan, onOpenNewLoan,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return loans.filter((l) => {
      const q = search.toLowerCase();
      const matchSearch = l.borrowerName.toLowerCase().includes(q) || l.borrowerPhone.includes(q) || l.loanNumber.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [loans, search, statusFilter]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Active: 'bg-black text-white',
      Overdue: 'bg-red-100 text-red-700',
      Completed: 'bg-gray-100 text-gray-500',
      Defaulted: 'bg-red-200 text-red-900',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-black">Loan Ledger</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{loans.length} total records</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-colors w-44"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black text-gray-600"
            >
              <option value="ALL">All</option>
              <option value="Active">Active</option>
              <option value="Overdue">Overdue</option>
              <option value="Completed">Completed</option>
              <option value="Defaulted">Defaulted</option>
            </select>
            <button
              onClick={onOpenNewLoan}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-black hover:bg-gray-900 text-white shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Loan
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">#</th>
              <th className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Borrower</th>
              <th className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Lent</th>
              <th className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total Due</th>
              <th className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Monthly</th>
              <th className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Remaining</th>
              <th className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Progress</th>
              <th className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Next Due</th>
              <th className="px-5 py-3 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-16 text-gray-400 text-sm">
                  No loans found.{' '}
                  <button onClick={onOpenNewLoan} className="text-black font-semibold underline">Add one</button>
                </td>
              </tr>
            ) : (
              filtered.map((loan, idx) => {
                const pct = Math.round((loan.amountPaid / loan.totalRepayable) * 100);
                return (
                  <tr key={loan.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-5 py-3.5 font-mono text-gray-400 text-[10px]">{String(idx + 1).padStart(2, '0')}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px] font-bold">{loan.borrowerName.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-black">{loan.borrowerName}</p>
                          <p className="text-[10px] text-gray-400">{loan.borrowerPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{loan.category}</td>
                    <td className="px-5 py-3.5 font-semibold text-black">{formatCurrency(loan.loanAmount)}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-600">{formatCurrency(loan.totalRepayable)}</td>
                    <td className="px-5 py-3.5 font-semibold text-black">{formatCurrency(loan.monthlyPayment)}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-black">{formatCurrency(loan.remainingBalance)}</span>
                      <p className="text-[10px] text-gray-400">{loan.monthsRemaining} mo left</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-black rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-400">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge(loan.status)}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(loan.nextDueDate)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        {loan.status !== 'Completed' && (
                          <button onClick={() => onRecordPayment(loan)} className="p-1.5 hover:bg-black hover:text-white text-gray-400 rounded-lg transition-colors" title="Record payment">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => onSelectLoan(loan)} className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-lg transition-colors" title="View details">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { if (confirm(`Delete ${loan.borrowerName}'s loan?`)) onDeleteLoan(loan.id); }} className="p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
