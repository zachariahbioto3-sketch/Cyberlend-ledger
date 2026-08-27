import React, { useState, useMemo } from 'react';
import { X, PlusCircle, Check } from 'lucide-react';
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
  const [category, setCategory] = useState<LoanCategory>('Personal');
  const [originationDate, setOriginationDate] = useState(todayStr);
  const [notes, setNotes] = useState('');

  const calc = useMemo(() => calculateCyberlendLoan(loanAmount, term), [loanAmount, term]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim() || !borrowerPhone.trim()) { alert('Name and phone required'); return; }
    onAddLoan({ borrowerName: borrowerName.trim(), borrowerPhone: borrowerPhone.trim(), borrowerEmail: borrowerEmail.trim(), loanAmount, term, category, originationDate, notes: notes.trim() });
    setBorrowerName(''); setBorrowerPhone(''); setBorrowerEmail(''); setLoanAmount(5000); setTerm(5); setCategory('Personal'); setOriginationDate(todayStr); setNotes('');
    onClose();
  };

  const inputCls = "w-full px-3 py-2 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors text-black text-xs";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        <div className="p-5 bg-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <PlusCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">New Loan</h3>
              <p className="text-[11px] text-gray-400">Add borrower to ledger</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Full Name *</label>
              <input required type="text" value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} placeholder="John Kariuki" className={inputCls} />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Phone *</label>
              <input required type="tel" value={borrowerPhone} onChange={(e) => setBorrowerPhone(e.target.value)} placeholder="+254712345678" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Email (Optional)</label>
            <input type="email" value={borrowerEmail} onChange={(e) => setBorrowerEmail(e.target.value)} placeholder="email@example.com" className={inputCls} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Principal (KES)</label>
              <input required type="number" step="500" min="500" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} className={`${inputCls} font-bold`} />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Term</label>
              <select value={term} onChange={(e) => setTerm(Number(e.target.value))} className={inputCls}>
                <option value={3}>3 Months</option>
                <option value={4}>4 Months</option>
                <option value={5}>5 Months</option>
                <option value={6}>6 Months</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as LoanCategory)} className={inputCls}>
                <option value="Personal">Personal</option>
                <option value="Business">Business</option>
                <option value="Emergency">Emergency</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" required value={originationDate} onChange={(e) => setOriginationDate(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." className={`${inputCls} resize-none`} />
          </div>

          {/* Live preview */}
          <div className="p-4 rounded-2xl bg-black text-white grid grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-gray-400 block uppercase tracking-wide">Monthly</span>
              <span className="text-base font-bold">{formatCurrency(calc.monthlyPayment)}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block uppercase tracking-wide">Total Due</span>
              <span className="text-base font-bold">{formatCurrency(calc.totalRepayable)}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block uppercase tracking-wide">Your Profit</span>
              <span className="text-base font-bold">{formatCurrency(calc.totalRepayable - loanAmount)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-gray-500 hover:text-black hover:bg-gray-100 transition-colors font-medium text-xs">
              Cancel
            </button>
            <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-gray-900 text-white font-semibold shadow-sm transition-colors text-xs">
              <Check className="w-3.5 h-3.5" />
              Add Loan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
