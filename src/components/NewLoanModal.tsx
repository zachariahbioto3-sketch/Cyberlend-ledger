import React, { useState, useMemo } from 'react';
import { X, PlusCircle, Check, ChevronDown } from 'lucide-react';
import { LoanCategory } from '../types';
import { calculateCyberlendLoan, formatCurrency } from '../utils/loanCalculations';

interface ThemeTokens { [key: string]: string; }

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLoan: (loan: any) => void;
  theme: ThemeTokens;
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({ isOpen, onClose, onAddLoan, theme: t }) => {
  if (!isOpen) return null;

  const mono = "'Space Mono', monospace";
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

  const inputStyle = { background: t.bgInput, borderColor: t.border, color: t.text };
  const labelStyle = { fontFamily: mono, color: t.textFaint };
  const optionStyle = { background: t.bgModal, color: t.text };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)' }}>

      <div className="w-full flex flex-col rounded-2xl border overflow-hidden shadow-2xl transition-all" style="width:88vw;height:82vh;max-width:88vw;max-height:82vh"
        style={{ background: t.bgModal, borderColor: t.borderMid, width: "88vw", height: "82vh" }}>

        {/* Modal Header */}
        <div className="p-5 border-b flex items-center justify-between shrink-0" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl border flex items-center justify-center" style={{ background: t.bgBtn, borderColor: t.border }}>
              <PlusCircle className="w-4 h-4" style={{ color: t.textMuted }} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>NEW LOAN</h3>
              <p className="text-[10px]" style={{ color: t.textFaint }}>Add borrower to ledger</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:opacity-80" style={{ color: t.textFaint }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {[
            [{ label: 'FULL NAME *', type: 'text', val: borrowerName, set: setBorrowerName, ph: 'John Kariuki', req: true },
             { label: 'PHONE *', type: 'tel', val: borrowerPhone, set: setBorrowerPhone, ph: '+254712345678', req: true }],
          ].map((row, ri) => (
            <div key={ri} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {row.map((f) => (
                <div key={f.label}>
                  <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>{f.label}</label>
                  <input required={f.req} type={f.type} value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph}
                    className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors hover:border-opacity-80" style={inputStyle} />
                </div>
              ))}
            </div>
          ))}

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>EMAIL (OPTIONAL)</label>
            <input type="email" value={borrowerEmail} onChange={(e) => setBorrowerEmail(e.target.value)} placeholder="email@example.com"
              className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors" style={inputStyle} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>PRINCIPAL</label>
              <input required type="number" step="500" min="500" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none font-bold transition-colors"
                style={{ ...inputStyle, fontFamily: mono }} />
            </div>

            {/* Custom Styled Term Dropdown */}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>TERM</label>
              <div className="relative">
                <select value={term} onChange={(e) => setTerm(Number(e.target.value))}
                  className="w-full px-3 py-2 pr-8 rounded-xl text-xs border focus:outline-none appearance-none cursor-pointer transition-all hover:opacity-95"
                  style={inputStyle}>
                  {[3,4,5,6].map(n => (
                    <option key={n} value={n} style={optionStyle}>
                      {n} Months
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform" style={{ color: t.textMuted }} />
              </div>
            </div>

            {/* Custom Styled Category Dropdown */}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>CATEGORY</label>
              <div className="relative">
                <select value={category} onChange={(e) => setCategory(e.target.value as LoanCategory)}
                  className="w-full px-3 py-2 pr-8 rounded-xl text-xs border focus:outline-none appearance-none cursor-pointer transition-all hover:opacity-95"
                  style={inputStyle}>
                  {['Personal','Business','Emergency','Other'].map(c => (
                    <option key={c} value={c} style={optionStyle}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform" style={{ color: t.textMuted }} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>START DATE</label>
            <input required type="date" value={originationDate} onChange={(e) => setOriginationDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors" style={inputStyle} />
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>NOTES</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..."
              className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none resize-none transition-colors" style={inputStyle} />
          </div>

          <div className="p-4 rounded-2xl border grid grid-cols-3 gap-3" style={{ background: t.bgActive, borderColor: t.borderMid }}>
            {[
              { label: 'MONTHLY', value: formatCurrency(calc.monthlyPayment) },
              { label: 'TOTAL DUE', value: formatCurrency(calc.totalRepayable) },
              { label: 'PROFIT', value: formatCurrency(calc.totalRepayable - loanAmount) },
            ].map((s) => (
              <div key={s.label}>
                <span className="text-[9px] uppercase tracking-widest block mb-1" style={{ fontFamily: mono, color: t.textFaint }}>{s.label}</span>
                <span className="text-sm font-bold block" style={{ fontFamily: mono, color: t.text }}>{s.value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium transition-colors hover:opacity-80" style={{ color: t.textMuted }}>Cancel</button>
            <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg hover:opacity-90 active:scale-95 cursor-pointer"
              style={{ fontFamily: mono, background: t.btnPrimary, color: t.btnPrimaryTx }}>
              <Check className="w-3.5 h-3.5" /> ADD LOAN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


