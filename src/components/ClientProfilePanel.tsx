import React from "react";
import { Loan, PortfolioMetrics } from "../types";
import { formatCompactCurrency } from "../utils/loanCalculations";
import { Phone, Mail, Calendar, TrendingUp, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface ClientProfilePanelProps {
  client: Loan;
  metrics: PortfolioMetrics;
  theme: any;
  allLoans: Loan[];
}

export const ClientProfilePanel: React.FC<ClientProfilePanelProps> = ({ client, theme: t, allLoans }) => {
  const mono = "'Space Mono', monospace";

  const clientLoans = allLoans.filter(l => l.borrowerName === client.borrowerName);
  const totalBorrowed = clientLoans.reduce((s, l) => s + l.loanAmount, 0);
  const totalPaid     = clientLoans.reduce((s, l) => s + l.amountPaid, 0);
  const totalOwed     = clientLoans.reduce((s, l) => s + l.remainingBalance, 0);
  const hasOverdue    = clientLoans.some(l => l.status === "Overdue");

  const statusColor = (status: string) => {
    if (status === "Active")    return "#5b7cfa";
    if (status === "Overdue")   return "#f87171";
    if (status === "Completed") return "#4ade80";
    return t.textMuted;
  };

  return (
    <div
      style={{
        animation: "profileSlideIn 0.35s cubic-bezier(0.16,1,0.3,1)",
        fontFamily: mono,
      }}
    >
      <style>{`
        @keyframes profileSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header card */}
      <div
        className="rounded-2xl p-5 mb-4 border flex items-center gap-5"
        style={{ background: t.bgCard, borderColor: t.border }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 border text-xl font-bold"
          style={{ background: t.bgActive, borderColor: t.borderMid, color: t.text }}
        >
          {client.borrowerName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold truncate" style={{ color: t.text }}>{client.borrowerName}</p>
          <div className="flex flex-wrap gap-3 mt-1">
            {client.borrowerPhone && (
              <span className="flex items-center gap-1 text-[10px]" style={{ color: t.textMuted }}>
                <Phone className="w-3 h-3" />{client.borrowerPhone}
              </span>
            )}
            {client.borrowerEmail && (
              <span className="flex items-center gap-1 text-[10px]" style={{ color: t.textMuted }}>
                <Mail className="w-3 h-3" />{client.borrowerEmail}
              </span>
            )}
            {client.originationDate && (
              <span className="flex items-center gap-1 text-[10px]" style={{ color: t.textMuted }}>
                <Calendar className="w-3 h-3" />Since {client.originationDate}
              </span>
            )}
          </div>
        </div>
        <div
          className="px-3 py-1 rounded-full text-[10px] font-bold border shrink-0"
          style={{
            color: hasOverdue ? "#f87171" : "#4ade80",
            borderColor: hasOverdue ? "rgba(248,113,113,0.3)" : "rgba(74,222,128,0.3)",
            background: hasOverdue ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.1)",
          }}
        >
          {hasOverdue ? "OVERDUE" : "GOOD STANDING"}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "TOTAL BORROWED", value: formatCompactCurrency(totalBorrowed), icon: <TrendingUp className="w-3.5 h-3.5" />, color: "#5b7cfa" },
          { label: "TOTAL PAID",     value: formatCompactCurrency(totalPaid),     icon: <CheckCircle className="w-3.5 h-3.5" />, color: "#4ade80" },
          { label: "STILL OWING",   value: formatCompactCurrency(totalOwed),     icon: <AlertCircle className="w-3.5 h-3.5" />, color: hasOverdue ? "#f87171" : "#f59e0b" },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-4 border" style={{ background: t.bgCard, borderColor: t.border }}>
            <div className="flex items-center gap-1.5 mb-2" style={{ color: k.color }}>{k.icon}
              <span className="text-[9px] uppercase tracking-widest" style={{ color: t.textFaint }}>{k.label}</span>
            </div>
            <p className="text-lg font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Loans list */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: t.bgCard, borderColor: t.border }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: t.border }}>
          <Clock className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
          <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: t.textFaint }}>
            LOAN HISTORY ({clientLoans.length})
          </p>
        </div>
        {clientLoans.map((loan, i) => {
          const pct = loan.totalRepayable > 0 ? Math.round((loan.amountPaid / loan.totalRepayable) * 100) : 0;
          return (
            <div
              key={loan.id}
              className="px-5 py-4"
              style={{
                borderBottom: i < clientLoans.length - 1 ? `1px solid ${t.border}` : "none",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[11px] font-bold" style={{ color: t.text }}>{loan.loanNumber}</span>
                  <span className="ml-2 text-[9px]" style={{ color: t.textFaint }}>{loan.originationDate}</span>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold border"
                  style={{
                    color: statusColor(loan.status),
                    borderColor: statusColor(loan.status) + "44",
                    background: statusColor(loan.status) + "18",
                  }}
                >
                  {loan.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] mb-2" style={{ color: t.textMuted }}>
                <span>Principal: <strong style={{ color: t.text }}>{formatCompactCurrency(loan.loanAmount)}</strong></span>
                <span>Paid: <strong style={{ color: "#4ade80" }}>{formatCompactCurrency(loan.amountPaid)}</strong></span>
                <span>Remaining: <strong style={{ color: loan.status === "Overdue" ? "#f87171" : t.text }}>{formatCompactCurrency(loan.remainingBalance)}</strong></span>
              </div>
              <div className="w-full rounded-full h-1.5" style={{ background: t.progressBg }}>
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{ width: pct + "%", background: loan.status === "Overdue" ? "#f87171" : "#5b7cfa" }}
                />
              </div>
              <p className="text-[9px] mt-1" style={{ color: t.textFaint }}>{pct}% repaid</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
