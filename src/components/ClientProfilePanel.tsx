import React from "react";
import { Loan, PortfolioMetrics, RepaymentTransaction } from "../types";
import { formatCurrency, formatCompactCurrency, formatDate } from "../utils/loanCalculations";
import { ArrowUpRight, MapPin, Plus, Wallet } from "lucide-react";

interface ClientProfilePanelProps {
  client: Loan;
  metrics?: PortfolioMetrics;
  theme: any;
  allLoans: Loan[];
  onEditClient?: (loan: Loan) => void;
  onNewAgreement?: (client: Loan) => void;
  onRecordPayment?: (loan: Loan) => void;
}

type DueStatus = "Paid" | "Partial" | "Missed" | "Upcoming" | "Settled";

interface DueRow {
  cycle: number;
  dueDate: string;
  carryIn: number;
  due: number;
  paid: number;
  carryOut: number;
  status: DueStatus;
  txIds: string[];
}

const STATUS_COLOR: Record<string, string> = {
  Active: "#60a5fa",
  Overdue: "#f87171",
  Completed: "#4ade80",
  Defaulted: "#9ca3af",
};

const DUE_COLOR: Record<DueStatus, string> = {
  Paid: "#4ade80",
  Partial: "#c49a2f",
  Missed: "#f87171",
  Upcoming: "#9ca3af",
  Settled: "#9ca3af",
};

const pad = (n: number) => String(n).padStart(2, "0");

function parseLocal(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addMonths(s: string, n: number): string {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1 + n, d);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Rebuilds the monthly dues from the loan's Interest transactions.
// Each cycle is due = monthlyInterest + shortfall carried from the previous cycle.
function buildDues(loan: Loan, today: Date): DueRow[] {
  const monthly = loan.monthlyInterest;
  const pool = (loan.transactions || [])
    .filter((tx) => tx.status === "Completed" && tx.paymentType === "Interest")
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .map((tx) => ({ id: tx.id, left: tx.amount }));

  const dueDates = Array.from({ length: loan.term }, (_, i) => addMonths(loan.originationDate, i + 1));
  const count = dueDates.filter((d) => parseLocal(d) <= today).length;
  const cycles = Math.min(loan.term, Math.max(count, 1));

  const rows: DueRow[] = [];
  let carry = 0;
  let idx = 0;

  for (let i = 0; i < cycles; i++) {
    const dueDate = dueDates[i];
    const due = monthly + carry;
    let paid = 0;
    const txIds: string[] = [];

    while (paid < due && idx < pool.length) {
      const take = Math.min(pool[idx].left, due - paid);
      paid += take;
      pool[idx].left -= take;
      if (!txIds.includes(pool[idx].id)) txIds.push(pool[idx].id);
      if (pool[idx].left <= 0) idx++;
    }

    const isPast = parseLocal(dueDate) <= today;
    let status: DueStatus;
    if (paid >= due) status = "Paid";
    else if (loan.status === "Completed") status = "Settled";
    else if (isPast) status = paid > 0 ? "Partial" : "Missed";
    else status = "Upcoming";

    const carryOut = Math.max(0, due - paid);
    rows.push({ cycle: i + 1, dueDate, carryIn: carry, due, paid, carryOut, status, txIds });
    carry = carryOut;
  }

  return rows;
}

export const ClientProfilePanel: React.FC<ClientProfilePanelProps> = ({
  client,
  theme: t,
  allLoans,
  onNewAgreement,
  onRecordPayment,
}) => {
  const mono = "var(--font-mono)";
  const today = startOfToday();

  const clientLoans = allLoans
    .filter((l) => l.borrowerName === client.borrowerName)
    .sort((a, b) => Date.parse(b.originationDate) - Date.parse(a.originationDate));

  const openLoans = clientLoans.filter((l) => l.status === "Active" || l.status === "Overdue");
  const activeLoan = openLoans[0];
  const hasOverdue = clientLoans.some((l) => l.status === "Overdue");
  const hasDefaulted = clientLoans.some((l) => l.status === "Defaulted");

  const overallStatus =
    hasOverdue ? "Overdue"
    : openLoans.length > 0 ? "Active"
    : hasDefaulted ? "Defaulted"
    : "Completed";

  const outstanding = clientLoans
    .filter((l) => l.status !== "Completed" && l.status !== "Defaulted")
    .reduce((s, l) => s + l.remainingBalance + (l.carryForward || 0), 0);

  const nextDueStr = openLoans.map((l) => l.nextDueDate).filter(Boolean).sort()[0];
  const daysToDue = nextDueStr
    ? Math.round((parseLocal(nextDueStr).getTime() - today.getTime()) / 86400000)
    : null;
  const dueLine =
    daysToDue === null ? ""
    : daysToDue > 0 ? `Next due in ${daysToDue} days`
    : daysToDue === 0 ? "Due today"
    : `Overdue by ${-daysToDue} days`;

  const address = clientLoans.find((l) => l.borrowerAddress)?.borrowerAddress;
  const notes = clientLoans.find((l) => l.clientNotes?.trim())?.clientNotes?.trim();
  const occupation = clientLoans.find((l) => l.occupation)?.occupation;
  const flags = Array.from(new Set(clientLoans.flatMap((l) => l.clientFlags || [])));
  const purposes = Array.from(new Set(clientLoans.map((l) => l.loanPurpose).filter(Boolean) as string[]));
  const tags = [...flags, ...purposes];
  const totalTransactions = clientLoans.reduce((s, l) => s + (l.transactions?.length || 0), 0);

  const duesByLoan = clientLoans.map((l) => ({ loan: l, rows: buildDues(l, today) }));

  // Maps each payment to the month it was applied to, with that month's totals
  const cycleByTx = new Map<string, { cycle: number; due: number; paid: number; remaining: number }>();
  duesByLoan.forEach(({ rows }) =>
    rows.forEach((r) =>
      r.txIds.forEach((id) => {
        if (!cycleByTx.has(id)) {
          cycleByTx.set(id, { cycle: r.cycle, due: r.due, paid: r.paid, remaining: r.carryOut });
        }
      })
    )
  );

  const payments = clientLoans
    .flatMap((l) => (l.transactions || []).map((tx: RepaymentTransaction) => ({ tx, loanNumber: l.loanNumber })))
    .sort((a, b) => Date.parse(b.tx.date) - Date.parse(a.tx.date));

  const sectionLabel = "text-[9px] uppercase tracking-widest mb-2";

  return (
    <div
      className="space-y-4"
      style={{ fontFamily: mono, animation: "profileSlideIn 0.35s cubic-bezier(0.16,1,0.3,1)" }}
    >
      <style>{`
        @keyframes profileSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="rounded-2xl border p-5" style={{ background: t.bgCard, borderColor: t.border }}>
        <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
          <div
            className="w-28 h-28 shrink-0 rounded-xl overflow-hidden border flex items-center justify-center"
            style={{ background: t.bgActive, borderColor: t.borderMid }}
          >
            {client.borrowerPhoto ? (
              <img
                src={client.borrowerPhoto}
                alt={client.borrowerName}
                className="w-full h-full object-cover"
                style={{ filter: "grayscale(1)" }}
              />
            ) : (
              <span className="text-3xl font-bold" style={{ color: t.text }}>
                {client.borrowerName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="text-left sm:text-right min-w-0">
            <p className="text-4xl font-bold leading-none" style={{ color: t.text }}>
              {formatCurrency(outstanding)}
            </p>
            <p className="text-[9px] uppercase tracking-widest mt-2" style={{ color: t.textFaint }}>
              Outstanding balance
            </p>
          </div>
        </div>

        <p className="text-xl font-bold mt-4 truncate" style={{ color: t.text }}>{client.borrowerName}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[overallStatus] }} />
          <span className="text-[10px] font-bold uppercase" style={{ color: STATUS_COLOR[overallStatus] }}>
            {overallStatus}
          </span>
          {dueLine && <span className="text-[10px]" style={{ color: t.textMuted }}>· {dueLine}</span>}
        </div>
        <p className="text-[9px] uppercase tracking-widest mt-3" style={{ color: t.textFaint }}>
          {occupation || "Client"}
        </p>
        {address && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: t.textMuted }}>
            <MapPin className="w-3 h-3" />{address}
          </p>
        )}
      </div>

      {/* About and tags */}
      <div className="rounded-2xl border p-5" style={{ background: t.bgCard, borderColor: t.border }}>
        <p className={sectionLabel} style={{ color: t.textFaint }}>About</p>
        <p className="text-sm leading-relaxed" style={{ color: t.text }}>
          {notes || "No notes yet."}
        </p>

        {tags.length > 0 && (
          <>
            <p className={`${sectionLabel} mt-4`} style={{ color: t.textFaint }}>Interests</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full text-[10px] border"
                  style={{ borderColor: t.borderMid, color: t.textMuted }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Payment and dues history */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-5" style={{ background: t.bgCard, borderColor: t.border }}>
          <p className={sectionLabel} style={{ color: t.textFaint }}>Payment history</p>
          <div className="max-h-72 overflow-y-auto">
            {payments.length === 0 ? (
              <p className="text-xs" style={{ color: t.textMuted }}>No payments yet.</p>
            ) : (
              payments.map(({ tx, loanNumber }) => {
                const cyc = tx.paymentType === "Interest" ? cycleByTx.get(tx.id) : undefined;
                const short = !!cyc && cyc.remaining > 0;
                return (
                  <div key={tx.id} className="py-2 border-b" style={{ borderColor: t.border }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold" style={{ color: t.text }}>{formatCurrency(tx.amount)}</p>
                        <p className="text-[9px]" style={{ color: t.textFaint }}>
                          {loanNumber} · {tx.paymentType} · {tx.paymentMethod}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px]" style={{ color: t.textMuted }}>{formatDate(tx.date)}</p>
                        <p className="text-[9px]" style={{ color: tx.status === "Completed" ? "#4ade80" : "#f87171" }}>
                          {tx.status}
                        </p>
                      </div>
                    </div>
                    {short && cyc && (
                      <div className="mt-1.5 rounded-lg px-2 py-1.5 border" style={{ borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)" }}>
                        <p className="text-[9px] font-bold" style={{ color: "#f87171" }}>
                          PAID LESS THAN EXPECTED · MONTH {cyc.cycle}
                        </p>
                        <p className="text-[9px] mt-0.5" style={{ color: t.textMuted }}>
                          Expected {formatCurrency(cyc.due)} · Paid {formatCurrency(cyc.paid)} · Remaining{" "}
                          <strong style={{ color: "#f87171" }}>{formatCurrency(cyc.remaining)}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border p-5" style={{ background: t.bgCard, borderColor: t.border }}>
          <p className={sectionLabel} style={{ color: t.textFaint }}>Dues history</p>
          <div className="max-h-72 overflow-y-auto">
            {duesByLoan.length === 0 ? (
              <p className="text-xs" style={{ color: t.textMuted }}>No loans yet.</p>
            ) : (
              duesByLoan.map(({ loan, rows }) => (
                <div key={loan.id} className="mb-3">
                  <p className="text-[10px] font-bold mb-1" style={{ color: t.text }}>{loan.loanNumber}</p>
                  {[...rows].reverse().map((r) => (
                    <div key={r.cycle} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: t.border }}>
                      <div>
                        <p className="text-[11px]" style={{ color: t.text }}>
                          {formatCurrency(r.due)}
                          {r.carryIn > 0 && (
                            <span className="text-[9px] ml-1" style={{ color: t.textFaint }}>
                              (incl. {formatCurrency(r.carryIn)} carried)
                            </span>
                          )}
                        </p>
                        <p className="text-[9px]" style={{ color: t.textFaint }}>
                          Month {r.cycle} · due {formatDate(r.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold" style={{ color: DUE_COLOR[r.status] }}>{r.status.toUpperCase()}</p>
                        {r.carryOut > 0 && r.status !== "Settled" && (
                          <p className="text-[9px]" style={{ color: t.textFaint }}>
                            {formatCurrency(r.carryOut)} carried
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer counts */}
      <div className="rounded-2xl border p-5 grid grid-cols-2" style={{ background: t.bgCard, borderColor: t.border }}>
        <div>
          <p className={sectionLabel} style={{ color: t.textFaint }}>Loans</p>
          <p className="text-2xl font-bold flex items-center gap-2" style={{ color: t.text }}>
            {clientLoans.length}<ArrowUpRight className="w-4 h-4" style={{ color: t.textFaint }} />
          </p>
        </div>
        <div className="border-l pl-5" style={{ borderColor: t.border }}>
          <p className={sectionLabel} style={{ color: t.textFaint }}>Transactions</p>
          <p className="text-2xl font-bold flex items-center gap-2" style={{ color: t.text }}>
            {totalTransactions}<ArrowUpRight className="w-4 h-4" style={{ color: t.textFaint }} />
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 flex gap-3 pt-2 pb-1" style={{ background: t.bgCard }}>
        <button
          onClick={() => onNewAgreement?.(client)}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-bold"
          style={{ borderColor: t.borderMid, color: t.text }}
        >
          <Plus className="w-4 h-4" /> New Agreement
        </button>
        <button
          onClick={() => activeLoan && onRecordPayment?.(activeLoan)}
          disabled={!activeLoan}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold disabled:opacity-40"
          style={{ background: "#c49a2f", color: "#111" }}
        >
          <Wallet className="w-4 h-4" /> Record Payment
        </button>
      </div>
    </div>
  );
};
