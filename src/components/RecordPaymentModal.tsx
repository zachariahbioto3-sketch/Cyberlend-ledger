import React, { useState } from 'react';
import { X, CreditCard, Check, Smartphone, Building2 } from 'lucide-react';
import { Loan, PaymentMethod, RepaymentTransaction } from '../types';
import { formatCurrency, formatDate } from '../utils/loanCalculations';

interface RecordPaymentModalProps {
  isOpen: boolean;
  loan: Loan | null;
  onClose: () => void;
  onSavePayment: (loanId: string, transaction: Omit<RepaymentTransaction, 'id'>) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, loan, onClose, onSavePayment }) => {
  if (!isOpen || !loan) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [amount, setAmount] = useState<number>(loan.monthlyPayment);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('M-Pesa');
  const [referenceNumber, setReferenceNumber] = useState(`REF-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState('Monthly installment');

  const newBalance = Math.max(0, loan.remainingBalance - amount);
  const inputCls = "w-full px-3 py-2 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors text-black text-xs";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) { alert('Amount must be greater than 0'); return; }
    onSavePayment(loan.id, {
      loanId: loan.id, date,
      amount: Math.round(amount * 100) / 100,
      paymentMethod,
      referenceNumber: referenceNumber || `REF-${Math.floor(Math.random() * 900000 + 100000)}`,
      status: 'Completed',
      notes: notes || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        <div className="p-5 bg-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Record Payment</h3>
              <p className="text-[11px] text-gray-400">{loan.borrowerName} · {loan.loanNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Balance summary */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-gray-400 block">Outstanding</span>
              <span className="text-lg font-bold text-black">{formatCurrency(loan.remainingBalance)}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-gray-400 block">Monthly</span>
              <span className="text-lg font-bold text-black">{formatCurrency(loan.monthlyPayment)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block">Next Due</span>
              <span className="text-xs font-semibold text-black">{formatDate(loan.nextDueDate)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Payment Date</label>
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Amount (KES)</label>
              <input required type="number" step="100" min="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className={`${inputCls} font-bold`} />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {(['M-Pesa', 'Bank Transfer'] as const).map((method) => (
                <button key={method} type="button" onClick={() => setPaymentMethod(method)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors ${paymentMethod === method ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-black hover:border-gray-300'}`}>
                  {method === 'M-Pesa' ? <Smartphone className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                  <span className="font-semibold text-xs">{method}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Reference #</label>
            <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} className={`${inputCls} font-mono`} />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
          </div>

          {/* New balance preview */}
          <div className="p-3 rounded-2xl bg-black text-white flex justify-between items-center">
            <span className="text-gray-400">Balance after payment:</span>
            <span className="text-base font-bold">
              {formatCurrency(newBalance)} {newBalance === 0 ? '🎉' : ''}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-gray-500 hover:text-black hover:bg-gray-100 transition-colors font-medium text-xs">
              Cancel
            </button>
            <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-gray-900 text-white font-semibold shadow-sm transition-colors text-xs">
              <Check className="w-3.5 h-3.5" />
              Record {formatCurrency(amount)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
