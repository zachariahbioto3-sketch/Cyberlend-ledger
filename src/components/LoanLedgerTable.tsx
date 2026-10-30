import { ExportMenu } from "./ExportMenu";
import React, { useState, useMemo } from "react";
import { Loan } from "../types";
import { formatCurrency, formatDate } from "../utils/loanCalculations";
import { ChevronRight, Plus, Trash2, Search } from "lucide-react";
import { ProfileAvatar } from "./ProfileAvatar";

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
  const [selectedBorrower, setSelectedBorrower] = useState<Loan[] | null>(null);
  const mono = "var(--font-mono)";

  const filtered = useMemo(() => loans.filter((l) => {
    const q = search.toLowerCase();
    return (l.borrowerName.toLowerCase().includes(q) || l.borrowerPhone.includes(q) || l.loanNumber.toLowerCase().includes(q))
      && (statusFilter === "ALL" || l.status === statusFilter);
  }), [loans, search, statusFilter]);

  const borrowerGroups = useMemo(() => {
    const groups = new Map<string, Loan[]>();
    filtered.forEach((loan) => {
      const key = loan.borrowerPhone || loan.borrowerName;
      groups.set(key, [...(groups.get(key) || []), loan]);
    });
    return [...groups.values()].map((group) => group.sort((a, b) => new Date(b.originationDate).getTime() - new Date(a.originationDate).getTime()));
  }, [filtered]);

  const statusStyle = (status: string) => {
    const map: Record<string, { bg: string; color: string; border: string }> = {
      Active:    { bg: '#DCE7FB', color: '#2552B0', border: 'transparent' },
      Overdue:   { bg: '#F9DADA', color: '#A82F2F', border: 'transparent' },
      Completed: { bg: '#DDF3E6', color: '#14703F', border: 'transparent' },
      Defaulted: { bg: '#EBC9C9', color: '#7A1F1F', border: 'transparent' },
    };
    return map[status] || map.Completed;
  };

  return (
    <div className="rounded-2xl border overflow-hidden hidden md:block" style={{ background: t.bgCard, borderColor: t.border }}>
      {/* Header */}
      <div className="p-5 border-b" style={{ borderColor: t.border }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold tracking-widest uppercase" style={{ fontFamily: mono, color: t.text }}>MASTER LEDGER</h2>
            <p className="text-[10px] mt-0.5" style={{ fontFamily: mono, color: t.textFaint }}>{borrowerGroups.length} BORROWERS Â· {loans.length} LOANS - {formatCurrency(loans.reduce((s, l) => s + (l.status === "Active" || l.status === "Overdue" ? l.remainingBalance : 0), 0))} OUTSTANDING</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportMenu loans={loans} />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: t.textFaint }} />
              <input
                type="text" placeholder="Search..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none w-full sm:w-40 transition-colors"
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
            {borrowerGroups.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-16 text-xs" style={{ fontFamily: mono, color: t.textFaint }}>
                  NO RECORDS.{" "}
                  <button onClick={onOpenNewLoan} style={{ color: t.text, textDecoration: "underline" }}>ADD ONE</button>
                </td>
              </tr>
            ) : borrowerGroups.map((group, idx) => {
              const loan = group[0];
              const totalLent = group.reduce((sum, item) => sum + item.loanAmount, 0);
              const totalDue = group.reduce((sum, item) => sum + item.totalRepayable, 0);
              const totalPaid = group.reduce((sum, item) => sum + item.amountPaid, 0);
              const remaining = group.reduce((sum, item) => sum + item.remainingBalance, 0);
              const pct = totalDue ? Math.round((totalPaid / totalDue) * 100) : 0;
              const hasOverdue = group.some((item) => item.status === "Overdue");
              const groupStatus = hasOverdue ? "Overdue" : group.some((item) => item.status === "Active") ? "Active" : group.every((item) => item.status === "Completed") ? "Completed" : loan.status;
              const ss = statusStyle(groupStatus);
              return (
                <tr
                  key={loan.borrowerPhone || loan.borrowerName}
                  onClick={() => setSelectedBorrower(group)}
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
                      <ProfileAvatar name={loan.borrowerName} photo={loan.borrowerPhoto} className="h-7 w-7" textClassName="text-[10px]" />
                      <div>
                      <p className="font-semibold" style={{ color: t.text }}>{loan.borrowerName}</p>
                        <p className="text-[10px]" style={{ color: t.textFaint }}>{loan.borrowerPhone} Â· {group.length} LOAN{group.length === 1 ? "" : "S"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5" style={{ color: t.textMuted }}>{group.length > 1 ? "MULTIPLE" : loan.category}</td>
                  <td className="px-4 py-3.5 font-bold" style={{ fontFamily: mono, color: t.text }}>{formatCurrency(totalLent)}</td>
                  <td className="px-4 py-3.5" style={{ fontFamily: mono, color: t.textMuted }}>{formatCurrency(totalDue)}</td>
                  <td className="px-4 py-3.5 font-bold" style={{ fontFamily: mono, color: t.text }}>{group.length > 1 ? "VIEW LOANS" : formatCurrency(loan.monthlyPayment)}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-bold" style={{ fontFamily: mono, color: t.text }}>{formatCurrency(remaining)}</span>
                    <p className="text-[10px]" style={{ color: t.textFaint }}>{group.length} loan{group.length === 1 ? "" : "s"}</p>
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
                      {group.some((item) => item.status !== "Completed") && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedBorrower(group); }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: t.textFaint }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = t.bgActive; e.currentTarget.style.color = t.text; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.textFaint; }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedBorrower(group); }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: t.textFaint }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = t.bgActive; e.currentTarget.style.color = t.text; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.textFaint; }}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedBorrower(group); }}
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

      {selectedBorrower && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedBorrower(null)}>
          <div className="w-full max-w-xl rounded-2xl border p-5 shadow-2xl" style={{ background: t.bgModal, borderColor: t.border }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest" style={{ fontFamily: mono, color: t.text }}>{selectedBorrower[0].borrowerName}</h3>
                <p className="text-[10px]" style={{ color: t.textFaint }}>{selectedBorrower[0].borrowerPhone} Â· {selectedBorrower.length} LOANS</p>
              </div>
              <button onClick={() => setSelectedBorrower(null)} className="rounded-lg px-2 py-1 text-xs" style={{ color: t.textFaint }}>CLOSE</button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {selectedBorrower.map((loan) => {
                const ss = statusStyle(loan.status);
                return <button key={loan.id} onClick={() => { setSelectedBorrower(null); onSelectLoan(loan); }} className="flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors hover:bg-[var(--bg-active)]" style={{ borderColor: t.border }}>
                  <div><p className="text-xs font-bold" style={{ color: t.text }}>{loan.loanNumber}</p><p className="text-[10px]" style={{ color: t.textFaint }}>{loan.category} Â· {formatDate(loan.originationDate)}</p></div>
                  <div className="text-right"><p className="text-xs font-bold" style={{ fontFamily: mono, color: t.text }}>{formatCurrency(loan.remainingBalance)}</p><span className="text-[9px] font-bold" style={{ color: ss.color }}>{loan.status.toUpperCase()}</span></div>
                </button>;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};






