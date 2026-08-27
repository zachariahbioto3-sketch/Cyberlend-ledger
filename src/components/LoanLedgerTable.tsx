import React, { useState, useMemo } from 'react';
import { Loan } from '../types';
import { formatCurrency, formatDate } from '../utils/loanCalculations';
import { ChevronRight, Edit2, Trash2, Plus } from 'lucide-react';

interface LoanLedgerTableProps {
  loans: Loan[];
  onSelectLoan: (loan: Loan) => void;
  onRecordPayment: (loan: Loan) => void;
  onDeleteLoan: (loanId: string) => void;
  onOpenNewLoan: () => void;
}

export const LoanLedgerTable: React.FC<LoanLedgerTableProps> = ({
  loans,
  onSelectLoan,
  onRecordPayment,
  onDeleteLoan,
  onOpenNewLoan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'balance-desc' | 'balance-asc' | 'date'>('balance-desc');

  const filteredLoans = useMemo(() => {
    return loans
      .filter((loan) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          loan.loanNumber.toLowerCase().includes(search) ||
          loan.borrowerName.toLowerCase().includes(search) ||
          loan.borrowerPhone.includes(search);

        if (!matchesSearch) return false;
        if (statusFilter !== 'ALL' && loan.status !== statusFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'balance-desc') return b.remainingBalance - a.remainingBalance;
        if (sortBy === 'balance-asc') return a.remainingBalance - b.remainingBalance;
        if (sortBy === 'date') return new Date(b.originationDate).getTime() - new Date(a.originationDate).getTime();
        return 0;
      });
  }, [loans, searchTerm, statusFilter, sortBy]);

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      Active: 'bg-green-100 text-green-800',
      'Paid in Full': 'bg-blue-100 text-blue-800',
      Overdue: 'bg-red-100 text-red-800',
      'Grace Period': 'bg-yellow-100 text-yellow-800',
      Defaulted: 'bg-red-200 text-red-900',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Master Loan Ledger</h2>
          <button
            onClick={onOpenNewLoan}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Add Loan
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search loan #, borrower, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Paid in Full">Paid in Full</option>
            <option value="Overdue">Overdue</option>
            <option value="Grace Period">Grace Period</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="balance-desc">Balance (High to Low)</option>
            <option value="balance-asc">Balance (Low to High)</option>
            <option value="date">Recently Added</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-700">Loan #</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Borrower</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Category</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Principal</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Balance</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Monthly</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Due Date</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredLoans.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-500">
                  No loans found. Create one to get started.
                </td>
              </tr>
            ) : (
              filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-mono font-semibold text-gray-900">{loan.loanNumber}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{loan.borrowerName}</p>
                      <p className="text-xs text-gray-500">{loan.borrowerPhone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{loan.category}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(loan.loanAmount)}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-lg text-blue-600">{formatCurrency(loan.remainingBalance)}</span>
                    <p className="text-xs text-gray-500">{loan.monthsRemaining} mo rem.</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-green-600">{formatCurrency(loan.monthlyPayment)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(loan.status)}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{formatDate(loan.nextDueDate)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {loan.status !== 'Paid in Full' && (
                        <button
                          onClick={() => onRecordPayment(loan)}
                          className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                          title="Record payment"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onSelectLoan(loan)}
                        className="p-2 hover:bg-gray-200 text-gray-600 rounded-lg transition"
                        title="View details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteLoan(loan.id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                        title="Delete loan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};