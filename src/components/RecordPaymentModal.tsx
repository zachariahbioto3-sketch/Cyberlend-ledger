import React, { useState, useEffect } from 'react';
import { X, CreditCard, Check, Smartphone, Building2, RefreshCw } from 'lucide-react';
import { Loan, PaymentMethod, RepaymentTransaction } from '../types';
import { formatCurrency, formatDate, nextDueAfter, toLocalISO } from '../utils/loanCalculations';

interface ThemeTokens { [key: string]: string; }
type PayMode = 'interest' | 'settle';

interface RecordPaymentModalProps {
  isOpen: boolean;
  loan: Loan | null;
  onClose: () => void;
  onSavePayment: (loanId: string, transactions: Omit<RepaymentTransaction, 'id'>[]) => void;
  theme: ThemeTokens;
}

const NOTE_INTEREST = 'Monthly interest - loan rolled over';
const NOTE_SETTLE = 'Principal + interest - loan settled';

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, loan, onClose, onSavePayment, theme: t }) => {
  const mono = "'Space Mono', monospace";
  const [mode, setMode] = useState<PayMode>('interest');
  const [date, setDate] = useState(toLocalISO(new Date()));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('M-Pesa');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState(NOTE_INTEREST);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !loan) return;
    setMode('interest');
    setDate(toLocalISO(new Date()));
    setPaymentMethod('M-Pesa');
    setReferenceNumber('REF-' + Date.now().toString().slice(-6));
    setNotes(NOTE_INTEREST);
  }, [isOpen, loan?.id]);

  if (!isOpen || !loan) return null;

  const interestDue = loan.monthlyInterest;
  const amount = mode === 'interest' ? interestDue : loan.loanAmount + interestDue;
  const nextMonth = loan.monthsCompleted + 1;
  const pastTerm = nextMonth > loan.term;
  const nextDue = nextDueAfter(loan.originationDate, nextMonth);
  const balanceAfter = mode === 'settle' ? 0 : loan.loanAmount;
  const isCompleted = loan.status === 'Completed';
  const inputStyle = { background: t.bgInput, borderColor: t.border, color: t.text };

  const pickMode = (m: PayMode) => {
    setMode(m);
    setNotes(m === 'interest' ? NOTE_INTEREST : NOTE_SETTLE);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCompleted) return;
    const ref = referenceNumber.trim() || ('REF-' + Date.now().toString().slice(-6));
    const txs: Omit<RepaymentTransaction, 'id'>[] = [
      { loanId: loan.id, date, amount: interestDue, paymentMethod, referenceNumber: ref, status: 'Completed', paymentType: 'Interest', notes: notes || undefined },
    ];
    if (mode === 'settle') {
      txs.push({ loanId: loan.id, date, amount: loan.loanAmount, paymentMethod, referenceNumber: ref + '-P', status: 'Completed', paymentType: 'Principal', notes: 'Principal returned - loan settled' });
    }
    onSavePayment(loan.id, txs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)' }}>
      <div className="rounded-2xl border overflow-hidden shadow-2xl" style={{ background: t.bgModal, borderColor: t.borderMid, width: "88vw", maxWidth: "560px", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl border" style={{ background: t.bgBtn, borderColor: t.border }}>
              <CreditCard className="w-4 h-4" style={{ color: t.textMuted }} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>RECORD PAYMENT</h3>
              <p className="text-[10px]" style={{ color: t.textFaint }}>{loan.borrowerName} - {loan.loanNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: t.textFaint }}><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ background: t.bgActive, borderColor: t.borderMid }}>
            {[
              { label: 'PRINCIPAL OUT', value: formatCurrency(loan.remainingBalance) },
              { label: 'MONTHLY INTEREST', value: formatCurrency(interestDue) },
              { label: 'NEXT DUE', value: formatDate(loan.nextDueDate) },
            ].map((s) => (
              <div key={s.label}>
                <span className="text-[9px] uppercase tracking-widest block mb-1" style={{ fontFamily: mono, color: t.textFaint }}>{s.label}</span>
                <span className="text-xs font-bold" style={{ fontFamily: mono, color: t.text }}>{s.value}</span>
              </div>
            ))}
          </div>

          {isCompleted && (
            <p className="text-[11px] font-bold" style={{ fontFamily: mono, color: t.text }}>This loan is already settled. No more payments can be recorded.</p>
          )}

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest mb-2" style={{ fontFamily: mono, color: t.textFaint }}>PAYMENT TYPE</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'interest', label: 'PAY INTEREST', sub: 'Loan rolls over' },
                { key: 'settle', label: 'SETTLE LOAN', sub: 'Principal + interest' },
              ] as const).map((o) => (
                <button key={o.key} type="button" onClick={() => pickMode(o.key)}
                  className="flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left"
                  style={{
                    fontFamily: mono,
                    borderColor: mode === o.key ? t.borderStrong : t.border,
                    background: mode === o.key ? t.bgActive : t.bgCard,
                    color: mode === o.key ? t.text : t.textMuted,
                  }}>
                  {o.key === 'interest' ? <RefreshCw className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  <span>
                    <span className="block text-xs font-bold">{o.label}</span>
                    <span className="block text-[9px]">{o.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={{ fontFamily: mono, color: t.textFaint }}>DATE</label>
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={{ fontFamily: mono, color: t.textFaint }}>AMOUNT DUE (KES)</label>
              <div className="w-full px-3 py-2 rounded-xl text-xs border font-bold" style={{ ...inputStyle, fontFamily: mono }}>{formatCurrency(amount)}</div>
              <span className="block text-[9px] mt-1" style={{ fontFamily: mono, color: t.textFaint }}>
                {mode === 'interest' ? 'Interest only' : formatCurrency(loan.loanAmount) + ' principal + ' + formatCurrency(interestDue) + ' interest'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest mb-2" style={{ fontFamily: mono, color: t.textFaint }}>PAYMENT METHOD</label>
            <div className="grid grid-cols-2 gap-2">
              {(['M-Pesa', 'Bank Transfer'] as const).map((method) => (
                <button key={method} type="button" onClick={() => setPaymentMethod(method)}
                  className="flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-xs font-bold"
                  style={{
                    fontFamily: mono,
                    borderColor: paymentMethod === method ? t.borderStrong : t.border,
                    background: paymentMethod === method ? t.bgActive : t.bgCard,
                    color: paymentMethod === method ? t.text : t.textMuted,
                  }}>
                  {method === 'M-Pesa' ? <Smartphone className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={{ fontFamily: mono, color: t.textFaint }}>REFERENCE #</label>
            <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors"
              style={{ ...inputStyle, fontFamily: mono }} />
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={{ fontFamily: mono, color: t.textFaint }}>NOTES</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors" style={inputStyle} />
          </div>

          <div className="p-3 rounded-2xl border space-y-1" style={{ background: t.bgActive, borderColor: t.borderMid }}>
            <div className="flex justify-between items-center">
              <span className="text-[9px] uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>BALANCE AFTER:</span>
              <span className="text-sm font-bold" style={{ fontFamily: mono, color: t.text }}>
                {formatCurrency(balanceAfter)}{mode === 'settle' ? ' - CLEARED' : ''}
              </span>
            </div>
            {mode === 'interest' && (
              <p className="text-[10px]" style={{ fontFamily: mono, color: t.textFaint }}>
                {pastTerm ? 'Past the ' + loan.term + '-month term' : 'Rolls over to month ' + nextMonth + ' of ' + loan.term} - next interest due {formatDate(nextDue)}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium" style={{ color: t.textMuted }}>Cancel</button>
            <button type="submit" disabled={isCompleted} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg"
              style={{ fontFamily: mono, background: t.btnPrimary, color: t.btnPrimaryTx, opacity: isCompleted ? 0.4 : 1 }}>
              <Check className="w-3.5 h-3.5" /> RECORD {formatCurrency(amount)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};