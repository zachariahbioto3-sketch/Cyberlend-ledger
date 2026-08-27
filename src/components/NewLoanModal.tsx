import React, { useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import { LoanCategory } from '../types';
import { calculateCyberlendLoan, formatCurrency } from '../utils/loanCalculations';

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLoan: (loan: any) => void;
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({ isOpen, onClose, onAddLoan }) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [loanAmount, setLoanAmount] = useState<number>(5000);
  const [term, setTerm] = useState<number>(5);
  const [category, setCategory] = useState<LoanCategory>('Personal Loan');
  const [originationDate, setOriginationDate] = useState(todayStr);
  const [notes, setNotes] = useState('');

  const loanDetails = useMemo(() => {
    return calculateCyberlendLoan(loanAmount, term);
  }, [loanAmount, term]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim()) {
      alert('Borrower name is required');
      return;
    }

    onAddLoan({
      borrowerName: borrowerName.trim(),
      borrowerPhone: borrowerPhone.trim(),
      borrowerEmail: borrowerEmail.trim(),
      loanAmount,
      term,
      category,
      originationDate,
      notes: notes.trim(),
    });

    setBorrowerName('');
    setBorrowerPhone('');
    setBorrowerEmail('');
    setLoanAmount(5000);
    setTerm(5);
    setCategory('Personal Loan');
    setOriginationDate(todayStr);
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Originate New Loan</h3>
              <p className="text-sm text-blue-100">Add borrower and loan details to ledger</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Borrower Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Kariuki"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={borrowerPhone}
                  onChange={(e) => setBorrowerPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+254712345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={borrowerEmail}
                  onChange={(e) => setBorrowerEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@email.com"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Loan Terms</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount (KES) *</label>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  required
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term (Months) *</label>
                <select
                  value={term}
                  onChange={(e) => setTerm(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={3}>3 Months</option>
                  <option value={5}>5 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as LoanCategory)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Personal Loan">Personal Loan</option>
                  <option value="Business Loan">Business Loan</option>
                  <option value="Emergency Loan">Emergency Loan</option>
                  <option value="Asset-Backed">Asset-Backed</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origination Date</label>
            <input
              type="date"
              value={originationDate}
              onChange={(e) => setOriginationDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional notes about the loan..."
            />
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-3">Loan Preview (20% Fixed Interest)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Principal</p>
                <p className="font-bold text-lg text-gray-900">{formatCurrency(loanAmount)}</p>
              </div>
              <div>
                <p className="text-gray-600">Interest (20%)</p>
                <p className="font-bold text-lg text-blue-600">{formatCurrency(loanDetails.interestAmount)}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Repay</p>
                <p className="font-bold text-lg text-gray-900">{formatCurrency(loanDetails.totalRepayable)}</p>
              </div>
              <div>
                <p className="text-gray-600">Monthly Payment</p>
                <p className="font-bold text-lg text-green-600">{formatCurrency(loanDetails.monthlyPayment)}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
            >
              Originate Loan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};