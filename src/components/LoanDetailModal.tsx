import React from 'react';
import { X, CreditCard, Calendar, Phone, FileText, Edit3 } from "lucide-react";
import { Loan } from '../types';
import { formatCurrency, formatDate } from '../utils/loanCalculations';

interface ThemeTokens { [key: string]: string; }

interface LoanDetailModalProps {
  loan: Loan | null;
  onClose: () => void;
  onEditClient?: (loan: Loan) => void;
  onEditClient?: (loan: Loan) => void;
  onRecordPayment: (loan: Loan) => void;
  theme: ThemeTokens;
}

export const LoanDetailModal: React.FC<LoanDetailModalProps> = ({ loan, onClose, onRecordPayment, theme: t }) => {
  if (!loan) return null;

  const mono = "'Space Mono', monospace";
  const pct = Math.round((loan.amountPaid / loan.totalRepayable) * 100);

  const statusStyle = (status: string) => {
    const map: Record<string, { bg: string; color: string; border: string }> = {
      Active:    { bg: t.bgActive,            color: t.text,      border: t.borderMid },
      Overdue:   { bg: 'rgba(220,50,50,0.1)', color: '#f87171',   border: 'rgba(220,50,50,0.2)' },
      Completed: { bg: t.bgCard,              color: t.textMuted, border: t.border },
      Defaulted: { bg: 'rgba(180,20,20,0.1)', color: '#fca5a5',   border: 'rgba(180,20,20,0.2)' },
    };
    return map[status] || map.Completed;
  };

  const ss = statusStyle(loan.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)' }}>
      <div className="rounded-2xl border overflow-hidden shadow-2xl" style={{ background: t.bgModal, borderColor: t.borderMid, width: "88vw", height: "82vh", overflowY: "auto" }}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: t.border }}>
          <div>
            <h3 className="text-sm font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>{loan.borrowerName.toUpperCase()}</h3>
            <p className="text-[10px]" style={{ color: t.textFaint }}>{loan.loanNumber} · {loan.category}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border" style={{ fontFamily: mono, background: ss.bg, color: ss.color, borderColor: ss.border }}>
              {loan.status.toUpperCase()}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: t.textFaint }}><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'LENT', value: formatCurrency(loan.loanAmount) },
              { label: 'TOTAL DUE', value: formatCurrency(loan.totalRepayable) },
              { label: 'COLLECTED', value: formatCurrency(loan.amountPaid) },
              { label: 'REMAINING', value: formatCurrency(loan.remainingBalance) },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl border" style={{ background: t.bgCard, borderColor: t.border }}>
                <span className="text-[9px] uppercase tracking-widest block mb-1" style={{ fontFamily: mono, color: t.textFaint }}>{s.label}</span>
                <span className="text-base font-bold" style={{ fontFamily: mono, color: t.text }}>{s.value}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between text-[9px] mb-1" style={{ fontFamily: mono, color: t.textFaint }}>
              <span>REPAYMENT PROGRESS</span>
              <span>{pct}% · {loan.monthsCompleted}/{loan.term} MONTHS</span>
            </div>
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: t.progressBg }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: t.progressFill }} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[10px]" style={{ color: t.textFaint }}>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{loan.borrowerPhone}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Started {formatDate(loan.originationDate)}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due {formatDate(loan.nextDueDate)}</span>
          </div>

          {loan.notes && (
            <div className="flex items-start gap-2 p-3 rounded-xl border" style={{ background: t.bgCard, borderColor: t.border }}>
              <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: t.textFaint }} />
              <p className="text-xs" style={{ color: t.textMuted }}>{loan.notes}</p>
            </div>
          )}

          <div>
            <h4 className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ fontFamily: mono, color: t.textFaint }}>
              PAYMENT HISTORY ({loan.transactions.length})
            </h4>
            {loan.transactions.length === 0 ? (
              <p className="text-center py-4 text-xs" style={{ fontFamily: mono, color: t.textFaint }}>NO PAYMENTS YET</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {[...loan.transactions].reverse().map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ background: t.bgCard, borderColor: t.border }}>
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg border" style={{ background: t.bgActive, borderColor: t.border }}>
                        <CreditCard className="w-3 h-3" style={{ color: t.textMuted }} />
                      </div>
                      <div>
                        <p className="font-bold text-xs" style={{ fontFamily: mono, color: t.text }}>{formatCurrency(tx.amount)}</p>
                        <p className="text-[10px]" style={{ color: t.textFaint }}>{tx.paymentMethod} · {tx.referenceNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: t.textMuted }}>{formatDate(tx.date)}</p>
                      {tx.notes && <p className="text-[10px]" style={{ color: t.textFaint }}>{tx.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {loan.status !== 'Completed' && (
            <button onClick={() => { onClose(); onRecordPayment(loan); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg"
              style={{ fontFamily: mono, background: t.btnPrimary, color: t.btnPrimaryTx }}>
              <CreditCard className="w-3.5 h-3.5" />
              RECORD PAYMENT — {loan.borrowerName.toUpperCase()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


