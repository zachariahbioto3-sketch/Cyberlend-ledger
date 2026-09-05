import React, { useState } from 'react';
import { X, CreditCard, Check, Smartphone, Building2 } from 'lucide-react';
import { Loan, PaymentMethod, RepaymentTransaction } from '../types';
import { formatCurrency, formatDate } from '../utils/loanCalculations';

interface ThemeTokens { [key: string]: string; }

interface RecordPaymentModalProps {
  isOpen: boolean;
  loan: Loan | null;
  onClose: () => void;
  onSavePayment: (loanId: string, transaction: Omit<RepaymentTransaction, 'id'>) => void;
  theme: ThemeTokens;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, loan, onClose, onSavePayment, theme: t }) => {
  const mono = "'Space Mono', monospace";
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [amount, setAmount] = useState<number>(loan?.monthlyPayment ?? 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('M-Pesa');
  const [referenceNumber, setReferenceNumber] = useState(`REF-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState('Monthly installment');

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen || !loan) return null;
  const newBalance = Math.max(0, loan.remainingBalance - amount);
  const inputStyle = { background: t.bgInput, borderColor: t.border, color: t.text };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) { alert('Amount must be greater than 0'); return; }
    onSavePayment(loan.id, { loanId: loan.id, date, amount: Math.round(amount * 100) / 100, paymentMethod, referenceNumber, status: 'Completed', notes: notes || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)' }}>
      <div className="rounded-2xl border overflow-hidden shadow-2xl" style={{ background: t.bgModal, borderColor: t.borderMid, width: "88vw", height: "82vh", overflowY: "auto" }}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl border" style={{ background: t.bgBtn, borderColor: t.border }}>
              <CreditCard className="w-4 h-4" style={{ color: t.textMuted }} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>RECORD PAYMENT</h3>
              <p className="text-[10px]" style={{ color: t.textFaint }}>{loan.borrowerName} Â· {loan.loanNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: t.textFaint }}><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-4 rounded-2xl border grid grid-cols-3 gap-3" style={{ background: t.bgActive, borderColor: t.borderMid }}>
            {[
              { label: 'OUTSTANDING', value: formatCurrency(loan.remainingBalance) },
              { label: 'MONTHLY DUE', value: formatCurrency(loan.monthlyPayment) },
              { label: 'NEXT DUE', value: formatDate(loan.nextDueDate) },
            ].map((s) => (
              <div key={s.label}>
                <span className="text-[9px] uppercase tracking-widest block mb-1" style={{ fontFamily: mono, color: t.textFaint }}>{s.label}</span>
                <span className="text-xs font-bold" style={{ fontFamily: mono, color: t.text }}>{s.value}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={{ fontFamily: mono, color: t.textFaint }}>DATE</label>
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={{ fontFamily: mono, color: t.textFaint }}>AMOUNT (KES)</label>
              <input required type="number" step="100" min="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none font-bold transition-colors"
                style={{ ...inputStyle, fontFamily: mono }} />
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

          <div className="p-3 rounded-2xl border flex justify-between items-center" style={{ background: t.bgActive, borderColor: t.borderMid }}>
            <span className="text-[9px] uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>BALANCE AFTER:</span>
            <span className="text-sm font-bold" style={{ fontFamily: mono, color: t.text }}>
              {formatCurrency(newBalance)} {newBalance === 0 ? 'âœ“ CLEARED' : ''}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium" style={{ color: t.textMuted }}>Cancel</button>
            <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg"
              style={{ fontFamily: mono, background: t.btnPrimary, color: t.btnPrimaryTx }}>
              <Check className="w-3.5 h-3.5" /> RECORD {formatCurrency(amount)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


