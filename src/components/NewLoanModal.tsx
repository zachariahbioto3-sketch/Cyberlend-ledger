import React, { useState, useMemo } from "react";
import { X, PlusCircle, Check, ChevronDown, User, AlertTriangle, Clock } from "lucide-react";
import { LoanCategory, LoanPurpose, Loan } from "../types";
import { calculateCyberlendLoan, formatCurrency, formatCompactCurrency } from "../utils/loanCalculations";

const LOAN_PURPOSES: LoanPurpose[] = [
  "Business Capital","School Fees","Medical Emergency","Land/Property",
  "Agriculture","Home Improvement","Debt Consolidation","Electronics/Assets",
  "Personal Use","Other",
];

interface NewLoanModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  onAddLoan:  (loan: any) => void;
  theme:      any;
  existingLoans?: Loan[];
  prefillClient?: Loan | null;
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({
  isOpen, onClose, onAddLoan, theme: t, existingLoans = [], prefillClient = null,
}) => {
  if (!isOpen) return null;

  const mono     = "'Space Mono', monospace";
  const todayStr = new Date().toISOString().split("T")[0];

  const [borrowerPhone,  setBorrowerPhone]  = useState(prefillClient?.borrowerPhone  || "");
  const [borrowerName,   setBorrowerName]   = useState(prefillClient?.borrowerName   || "");
  const [borrowerEmail,  setBorrowerEmail]  = useState(prefillClient?.borrowerEmail  || "");
  const [loanAmount,     setLoanAmount]     = useState<number>(5000);
  const [term,           setTerm]           = useState<number>(5);
  const [category,       setCategory]       = useState<LoanCategory>("Personal");
  const [loanPurpose,    setLoanPurpose]    = useState<LoanPurpose | "">(prefillClient?.loanPurpose || "");
  const [originationDate,setOriginationDate]= useState(todayStr);
  const [notes,          setNotes]          = useState("");

  // Detect returning client by phone number
  const returningClientLoans = useMemo(() => {
    if (!borrowerPhone.trim()) return [];
    return existingLoans.filter((l) => l.borrowerPhone === borrowerPhone.trim());
  }, [borrowerPhone, existingLoans]);

  const isReturning = returningClientLoans.length > 0;
  const latestLoan  = isReturning ? returningClientLoans[0] : null;

  // Outstanding balance = sum of principal on active/overdue loans
  const outstandingBalance = useMemo(() => {
    return returningClientLoans
      .filter((l) => l.status === "Active" || l.status === "Overdue")
      .reduce((s, l) => s + l.remainingBalance, 0);
  }, [returningClientLoans]);

  // Auto-fill name from returning client
  useMemo(() => {
    if (isReturning && latestLoan && !prefillClient) {
      setBorrowerName(latestLoan.borrowerName);
      setBorrowerEmail(latestLoan.borrowerEmail || "");
    }
  }, [isReturning, latestLoan]);

  const effectivePrincipal = loanAmount + outstandingBalance;
  const calc = useMemo(
    () => calculateCyberlendLoan(effectivePrincipal, term),
    [effectivePrincipal, term]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim() || !borrowerPhone.trim()) { alert("Name and phone are required"); return; }
    onAddLoan({
      borrowerName:    borrowerName.trim(),
      borrowerPhone:   borrowerPhone.trim(),
      borrowerEmail:   borrowerEmail.trim(),
      borrowerPhoto:   latestLoan?.borrowerPhoto    || prefillClient?.borrowerPhoto    || "",
      borrowerIdPhoto: latestLoan?.borrowerIdPhoto  || prefillClient?.borrowerIdPhoto  || "",
      borrowerAddress: latestLoan?.borrowerAddress  || prefillClient?.borrowerAddress  || "",
      borrowerIdNumber:latestLoan?.borrowerIdNumber || prefillClient?.borrowerIdNumber || "",
      borrowerUsername:latestLoan?.borrowerUsername || prefillClient?.borrowerUsername || "",
      kraPin:          latestLoan?.kraPin           || prefillClient?.kraPin           || "",
      occupation:      latestLoan?.occupation       || prefillClient?.occupation       || "",
      referralSource:  latestLoan?.referralSource   || prefillClient?.referralSource   || "",
      clientNotes:     latestLoan?.clientNotes      || prefillClient?.clientNotes      || "",
      clientFlags:     latestLoan?.clientFlags      || prefillClient?.clientFlags      || ["New"],
      dateJoined:      latestLoan?.dateJoined       || prefillClient?.dateJoined       || todayStr,
      loanPurpose:     loanPurpose || latestLoan?.loanPurpose || prefillClient?.loanPurpose,
      outstandingBalance,
      loanAmount,
      term,
      category,
      originationDate,
      notes: notes.trim(),
    });
    onClose();
  };

  const inputStyle  = { background: t.bgInput, borderColor: t.border, color: t.text, fontFamily: mono };
  const labelStyle  = { fontFamily: mono, color: t.textFaint };
  const optionStyle = { background: t.bgModal, color: t.text };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)" }}>

      <div className="w-full flex flex-col rounded-2xl border overflow-hidden shadow-2xl"
        style={{ background: t.bgModal, borderColor: t.borderMid, width: "88vw", maxWidth: "620px", maxHeight: "88vh" }}>

        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between shrink-0" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl border" style={{ background: t.bgBtn, borderColor: t.border }}>
              <PlusCircle className="w-4 h-4" style={{ color: t.textMuted }} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>
                {isReturning ? "NEW LOAN — RETURNING CLIENT" : "NEW LOAN"}
              </h3>
              <p className="text-[10px]" style={{ color: t.textFaint }}>
                {isReturning ? `${returningClientLoans.length} previous loan(s) on file` : "Add borrower to ledger"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: t.textFaint }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">

            {/* Returning client profile banner */}
            {isReturning && latestLoan && (
              <div className="rounded-2xl border p-4 flex items-center gap-4"
                style={{ background: "rgba(91,124,250,0.08)", borderColor: "rgba(91,124,250,0.3)" }}>
                <div className="w-14 h-14 rounded-2xl border overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ borderColor: "rgba(91,124,250,0.4)", background: "rgba(91,124,250,0.12)" }}>
                  {latestLoan.borrowerPhoto ? (
                    <img src={latestLoan.borrowerPhoto} alt={latestLoan.borrowerName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold" style={{ fontFamily: mono, color: "#5b7cfa" }}>
                      {latestLoan.borrowerName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ fontFamily: mono, color: t.text }}>{latestLoan.borrowerName}</p>
                  <p className="text-[10px]" style={{ color: t.textFaint, fontFamily: mono }}>{latestLoan.borrowerPhone}</p>
                  <div className="flex gap-3 mt-1.5 flex-wrap">
                    <span className="text-[10px]" style={{ fontFamily: mono, color: "#5b7cfa" }}>
                      {returningClientLoans.length} loan(s)
                    </span>
                    {outstandingBalance > 0 && (
                      <span className="flex items-center gap-1 text-[10px]" style={{ fontFamily: mono, color: "#f59e0b" }}>
                        <AlertTriangle className="w-3 h-3" />
                        {formatCompactCurrency(outstandingBalance)} outstanding — rolled into new loan
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Previous loans history for returning client */}
            {isReturning && returningClientLoans.length > 0 && (
              <div className="rounded-2xl border p-4" style={{ background: t.bgActive, borderColor: t.border }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
                  style={{ fontFamily: mono, color: t.textFaint }}>BORROWING HISTORY</p>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {returningClientLoans
                    .slice()
                    .sort((a, b) => b.originationDate.localeCompare(a.originationDate))
                    .map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-2.5 rounded-xl border"
                      style={{ background: t.bgCard, borderColor: t.border }}>
                      <div>
                        <p className="text-[10px] font-bold" style={{ fontFamily: mono, color: t.text }}>{l.loanNumber}</p>
                        <p className="text-[9px]" style={{ color: t.textFaint }}>{l.originationDate} · {l.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold" style={{ fontFamily: mono, color: t.text }}>
                          {formatCompactCurrency(l.loanAmount)}
                        </p>
                        <span className="text-[9px] px-2 py-0.5 rounded-full"
                          style={{
                            fontFamily: mono,
                            color:      l.status === "Active" ? "#5b7cfa" : l.status === "Overdue" ? "#f87171" : l.status === "Completed" ? "#4ade80" : "#f87171",
                            background: l.status === "Active" ? "rgba(91,124,250,0.12)" : l.status === "Overdue" ? "rgba(248,113,113,0.12)" : l.status === "Completed" ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                          }}>
                          {l.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phone — triggers returning client lookup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>
                  PHONE * <span style={{ color: "#5b7cfa" }}>(used to detect returning client)</span>
                </label>
                <input required type="tel" value={borrowerPhone}
                  onChange={(e) => setBorrowerPhone(e.target.value)}
                  placeholder="+254712345678"
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                  style={inputStyle} />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>FULL NAME *</label>
                <input required type="text" value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="John Kariuki"
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                  style={inputStyle} />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>EMAIL (OPTIONAL)</label>
              <input type="email" value={borrowerEmail}
                onChange={(e) => setBorrowerEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                style={inputStyle} />
            </div>

            {/* Loan purpose */}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>LOAN PURPOSE</label>
              <div className="relative">
                <select value={loanPurpose} onChange={(e) => setLoanPurpose(e.target.value as LoanPurpose)}
                  className="w-full px-3 py-2 pr-8 rounded-xl text-xs border focus:outline-none appearance-none"
                  style={inputStyle}>
                  <option value="">-- Select purpose --</option>
                  {LOAN_PURPOSES.map((p) => <option key={p} value={p} style={optionStyle}>{p}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textMuted }} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>
                  NEW PRINCIPAL
                </label>
                <input required type="number" step="500" min="500" value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none font-bold"
                  style={inputStyle} />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>TERM</label>
                <div className="relative">
                  <select value={term} onChange={(e) => setTerm(Number(e.target.value))}
                    className="w-full px-3 py-2 pr-8 rounded-xl text-xs border focus:outline-none appearance-none"
                    style={inputStyle}>
                    {[3,4,5,6].map((n) => <option key={n} value={n} style={optionStyle}>{n} Months</option>)}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textMuted }} />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>CATEGORY</label>
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value as LoanCategory)}
                    className="w-full px-3 py-2 pr-8 rounded-xl text-xs border focus:outline-none appearance-none"
                    style={inputStyle}>
                    {["Personal","Business","Emergency","Agriculture","Education","Medical","Other"].map((c) => (
                      <option key={c} value={c} style={optionStyle}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textMuted }} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>START DATE</label>
              <input required type="date" value={originationDate}
                onChange={(e) => setOriginationDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                style={inputStyle} />
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>NOTES</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes..."
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none resize-none"
                style={inputStyle} />
            </div>

            {/* Loan summary breakdown */}
            <div className="p-4 rounded-2xl border" style={{ background: t.bgActive, borderColor: t.borderMid }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ fontFamily: mono, color: t.textFaint }}>
                LOAN BREAKDOWN
              </p>
              {outstandingBalance > 0 && (
                <div className="flex justify-between mb-2 pb-2 border-b" style={{ borderColor: t.border }}>
                  <span className="text-[10px]" style={{ fontFamily: mono, color: "#f59e0b" }}>Outstanding rolled in</span>
                  <span className="text-[10px] font-bold" style={{ fontFamily: mono, color: "#f59e0b" }}>+ {formatCurrency(outstandingBalance)}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "EFFECTIVE PRINCIPAL", value: formatCurrency(effectivePrincipal) },
                  { label: "MONTHLY INTEREST",    value: formatCurrency(calc.monthlyPayment) },
                  { label: "TOTAL DUE",           value: formatCurrency(calc.totalRepayable) },
                ].map((s) => (
                  <div key={s.label}>
                    <span className="text-[9px] uppercase tracking-widest block mb-1" style={{ fontFamily: mono, color: t.textFaint }}>{s.label}</span>
                    <span className="text-sm font-bold block" style={{ fontFamily: mono, color: t.text }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium"
              style={{ color: t.textMuted }}>Cancel</button>
            <button type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
              style={{ fontFamily: mono, background: t.btnPrimary, color: t.btnPrimaryTx }}>
              <Check className="w-3.5 h-3.5" /> ADD LOAN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
