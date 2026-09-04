import React, { useState, useMemo } from "react";
import { Loan } from "../types";
import { formatCurrency, formatDate } from "../utils/loanCalculations";
import { ChevronRight, Plus, Trash2, Search } from "lucide-react";

interface ThemeTokens { bg: string; bgCard: string; bgCardHover: string; bgActive: string; bgBtn: string; border: string; borderMid: string; borderStrong: string; text: string; textMuted: string; textFaint: string; btnPrimary: string; btnPrimaryTx: string; rowAlt: string; rowHover: string; progressBg: string; progressFill: string; [key: string]: string; }

interface LoanLedgerTableProps {
  loans: Loan[];
  onSelectLoan: (loan: Loan) => void;
  onRecordPayment: (loan: Loan) => void;
  onDeleteLoan: (loanId: string) => void;
  onOpenNewLoan: () => void;
  onEditClient?: (loan: Loan) => void;
  theme: ThemeTokens;
}

export const LoanLedgerTable: React.FC<LoanLedgerTableProps> = ({ loans, onSelectLoan, onRecordPayment, onDeleteLoan, onOpenNewLoan, onEditClient, theme: t }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const mono = "'Space Mono', monospace";

  const filtered = useMemo(() => loans.filter((l) => {
    const q = search.toLowerCase();
    return (l.borrowerName.toLowerCase().includes(q) || l.borrowerPhone.includes(q) || l.loanNumber.toLowerCase().includes(q))
      && (statusFilter === "ALL" || l.status === statusFilter);
  }), [loans, search, statusFilter]);

  const statusStyle = (status: string) => {
    const map: Record<string, { bg: string; color: string; border: string }> = {
      Active:    { bg: 'rgba(91,124,250,0.15)',  color: '#5b7cfa',  border: 'rgba(91,124,250,0.30)' },
      Overdue:   { bg: 'rgba(239,68,68,0.12)',   color: '#f87171',  border: 'rgba(239,68,68,0.25)' },
      Completed: { bg: 'rgba(255,255,255,0.06)', color: t.textMuted, border: t.border },
      Defaulted: { bg: 'rgba(127,29,29,0.20)',   color: '#fca5a5',  border: 'rgba(127,29,29,0.35)' },
    };
    return map[status] || map.Completed;
  };

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: t.bgCard, borderColor: t.border }}>
      {/* Header */}
      <div className="p-5 border-b" style={{ borderColor: t.border }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold tracking-widest uppercase" style={{ fontFamily: mono, color: t.text }}>MASTER LEDGER</h2>
            <p className="text-[10px] mt-0.5" style={{ fontFamily: mono, color: t.textFaint }}>{loans.length} RECORDS</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: t.textFaint }} />
              <input
                type="text" placeholder="Search..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none w-40 transition-colors"
                style={{ background: t.bgBtn, borderColor: t.border, color: t.text }}
              />
            </div>
            <select
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border focus:outline-none transition-colors"
              style={{ background: t.bgBtn, borderColor: t.border, color: t.textMuted }}
            >
              <option value="ALL">All</option>
              <option value="Active">Active</option>
              <option value="Overdue">Overdue</option>
              <option value="Completed">Completed</option>
              <option value="Defaulted">Defaulted</option>
            </select>
            <button
              onClick={onOpenNewLoan}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ fontFamily: mono, background: t.btnPrimary, color: t.btnPrimaryTx }}
            >
              <Plus className="w-3.5 h-3.5" /> NEW
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: t.border }}>
              {["#","BORROWER","CAT","LENT","TOTAL DUE","MONTHLY","REMAINING","PROGRESS","STATUS","NEXT DUE",""].map((h) => (
                <th key={h} className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap"
                  style={{ fontFamily: mono, color: t.textFaint }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-16 text-xs" style={{ fontFamily: mono, color: t.textFaint }}>
                  NO RECORDS.{" "}
                  <button onClick={onOpenNewLoan} style={{ color: t.text, textDecoration: "underline" }}>ADD ONE</button>
                </td>
              </tr>
            ) : filtered.map((loan, idx) => {
              const pct = Math.round((loan.amountPaid / loan.totalRepayable) * 100);
              const ss = statusStyle(loan.status);
              return (
                <tr
                  key={loan.id}
                  onClick={() => onSelectLoan(loan)}
                  className="border-b transition-colors cursor-pointer"
                  style={{ borderColor: t.border, background: idx % 2 !== 0 ? t.rowAlt : "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = t.rowHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 !== 0 ? t.rowAlt : "transparent")}
                >
                  <td className="px-4 py-3.5 text-[10px]" style={{ fontFamily: mono, color: t.textFaint }}>
                    {String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full border flex items-center justify-center shrink-0"
                        style={{ background: t.bgActive, borderColor: t.borderMid }}>
                        <span className="text-[10px] font-bold" style={{ fontFamily: mono, color: t.text }}>
                          {loan.borrowerName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: t.text }}>{loan.borrowerName}</p>
                        <p className="text-[10px]" style={{ color: t.textFaint }}>{loan.borrowerPhone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5" style={{ color: t.textMuted }}>{loan.category}</td>
                  <td className="px-4 py-3.5 font-bold" style={{ fontFamily: mono, color: t.text }}>{formatCurrency(loan.loanAmount)}</td>
                  <td className="px-4 py-3.5" style={{ fontFamily: mono, color: t.textMuted }}>{formatCurrency(loan.totalRepayable)}</td>
                  <td className="px-4 py-3.5 font-bold" style={{ fontFamily: mono, color: t.text }}>{formatCurrency(loan.monthlyPayment)}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-bold" style={{ fontFamily: mono, color: t.text }}>{formatCurrency(loan.remainingBalance)}</span>
                    <p className="text-[10px]" style={{ color: t.textFaint }}>{loan.monthsRemaining} mo left</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: t.progressBg }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: t.progressFill }} />
                      </div>
                      <span className="text-[9px]" style={{ fontFamily: mono, color: t.textFaint }}>{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border"
                      style={{ fontFamily: mono, background: ss.bg, color: ss.color, borderColor: ss.border }}>
                      {loan.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[10px]" style={{ color: t.textMuted }}>{formatDate(loan.nextDueDate)}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-1">
                      {loan.status !== "Completed" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onRecordPayment(loan); }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: t.textFaint }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = t.bgActive; e.currentTarget.style.color = t.text; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.textFaint; }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectLoan(loan); }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: t.textFaint }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = t.bgActive; e.currentTarget.style.color = t.text; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.textFaint; }}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${loan.borrowerName}?`)) onDeleteLoan(loan.id); }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: t.textFaint }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,50,50,0.1)"; e.currentTarget.style.color = "#f87171"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.textFaint; }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
