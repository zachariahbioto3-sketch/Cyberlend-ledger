import React, { useState } from 'react';
import { X, CreditCard, DollarSign, Check } from 'lucide-react';
import { Loan, PaymentMethod, RepaymentTransaction } from '../types';
import { formatCurrency, formatDate } from '../utils/loanCalculations';

interface RecordPaymentModalProps {
  isOpen: boolean;
  loan: Loan | null;
  onClose: () => void;
  onSavePayment: (loanId: string, transaction: Omit<RepaymentTransaction, 'id'>) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  loan,
  onClose,
  onSavePayment,
}) => {
  if (!isOpen || !loan) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayStr);
  const [amount, setAmount] = useState<number>(loan.monthlyPayment);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('M-Pesa');
  const [referenceNumber, setReferenceNumber] = useState<string>(
    `REF-${Date.now().toString().slice(-6)}`
  );
  const [notes, setNotes] = useState<string>('Monthly installment payment');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Payment amount must be greater than 0');
      return;
    }

    const principalPortion = Math.min(amount, loan.remainingBalance);
    const interestPortion = amount - principalPortion;

    const newTransaction: Omit<RepaymentTransaction, 'id'> = {
      loanId: loan.id,
      date,
      amount: Math.round(amount * 100) / 100,
      principalAmount: Math.round(principalPortion * 100) / 100,
      interestAmount: Math.round(interestPortion * 100) / 100,
      paymentMethod,
      referenceNumber: referenceNumber || `REF-${Math.floor(Math.random() * 900000 + 100000)}`,
      status: 'Completed',
      notes: notes || undefined,
    };

    onSavePayment(loan.id, newTransaction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Record Payment</h3>
              <p className="text-sm text-blue-100">{loan.loanNumber} - {loan.borrowerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Current Outstanding Balance</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(loan.remainingBalance)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Monthly Payment Due</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(loan.monthlyPayment)}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount (KES)</label>
            <input
              type="number"
              step="100"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold"
            />
            <p className="text-xs text-gray-500 mt-1">Suggested: {formatCurrency(loan.monthlyPayment)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              {(['M-Pesa', 'Bank Transfer'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`p-4 rounded-lg border-2 transition ${
                    paymentMethod === method
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{method}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reference / Confirmation #</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Payment notes or memo..."
            />
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700 mb-3">Payment Breakdown</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Principal Portion:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(Math.min(amount, loan.remainingBalance))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interest Portion:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(Math.max(0, amount - loan.remainingBalance))}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>New Remaining Balance:</span>
                <span className="text-lg text-blue-600">{formatCurrency(Math.max(0, loan.remainingBalance - amount))}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};