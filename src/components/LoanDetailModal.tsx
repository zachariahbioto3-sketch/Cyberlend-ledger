import React from 'react';
import { X, CreditCard, Calendar, Phone, FileText } from 'lucide-react';
import { Loan } from '../types';
import { formatCurrency, formatDate } from '../utils/loanCalculations';

interface LoanDetailModalProps {
  loan: Loan | null;
  onClose: () => void;
  onRecordPayment: (loan: Loan) => void;
}

export const LoanDetailModal: React.FC<LoanDetailModalProps> = ({ loan, onClose, onRecordPayment }) => {
  if (!loan) return null;

  const pct = Math.round((loan.amountPaid / loan.totalRepayable) * 100);

  const statusBadge: Record<string, string> = {
    Active: 'bg-black text-white',
    Overdue: 'bg-red-100 text-red-700',
    Completed: 'bg-gray-100 text-gray-500',
    Defaulted: 'bg-red-200 text-red-900',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

        <div className="p-5 bg-black flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">{loan.borrowerName}</h3>
            <p className="text-[11px] text-gray-400">{loan.loanNumber} · {loan.category}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${statusBadge[loan.status]}`}>
              {loan.status}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Lent', value: formatCurrency(loan.loanAmount) },
              { label: 'Total Due', value: formatCurrency(loan.totalRepayable) },
              { label: 'Collected', value: formatCurrency(loan.amountPaid) },
              { label: 'Remaining', value: formatCurrency(loan.remainingBalance) },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] text-gray-400 uppercase tracking-wide block">{s.label}</span>
                <span className="text-base font-bold text-black">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>Repayment progress</span>
              <span>{pct}% · {loan.monthsCompleted}/{loan.term} months</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{loan.borrowerPhone}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Started {formatDate(loan.originationDate)}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Next due {formatDate(loan.nextDueDate)}</span>
          </div>

          {loan.notes && (
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-gray-500">{loan.notes}</p>
            </div>
          )}

          {/* Transactions */}
          <div>
            <h4 className="font-semibold text-black mb-2">Payment History ({loan.transactions.length})</h4>
            {loan.transactions.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No payments yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {[...loan.transactions].reverse().map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-black">
                        <CreditCard className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-black">{formatCurrency(tx.amount)}</p>
                        <p className="text-[10px] text-gray-400">{tx.paymentMethod} · {tx.referenceNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">{formatDate(tx.date)}</p>
                      {tx.notes && <p className="text-[10px] text-gray-400">{tx.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {loan.status !== 'Completed' && (
            <button
              onClick={() => { onClose(); onRecordPayment(loan); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-black hover:bg-gray-900 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Record Payment for {loan.borrowerName}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
