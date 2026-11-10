import React from "react";
import { Loan, PortfolioMetrics, RepaymentTransaction } from "../types";
import { formatCurrency, formatCompactCurrency, formatDate } from "../utils/loanCalculations";
import {
  ArrowUpRight, MapPin, Plus, Wallet, Phone, Briefcase, Clock,
  ChevronRight, CreditCard, FileText, X,
} from "lucide-react";

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

// ─── Grouped-rows building blocks (Telegram-profile style) ───────────────────

function GroupCard({ theme: t, children }: { theme: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: t.bgCard, borderColor: t.border }}>
      {children}
    </div>
  );
}

function GroupLabel({ theme: t, children }: { theme: any; children: React.ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-widest px-5 pt-4 pb-1" style={{ color: t.textFaint }}>
      {children}
    </p>
  );
}

function InfoRow({
  theme: t, icon: Icon, label, value, last,
}: { theme: any; icon: any; label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 ${last ? "" : "border-b"}`}
      style={{ borderColor: t.border }}
    >
      <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center" style={{ background: t.bgActive }}>
        <Icon className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate" style={{ color: t.text }}>{value}</p>
        <p className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: t.textFaint }}>{label}</p>
      </div>
    </div>
  );
}

function StatRow({
  theme: t, label, value, last,
}: { theme: any; label: string; value: number; last?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-3.5 ${last ? "" : "border-b"}`}
      style={{ borderColor: t.border }}
    >
      <p className="text-sm" style={{ color: t.text }}>{label}</p>
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold" style={{ color: t.text }}>{value}</span>
        <ChevronRight className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
      </div>
    </div>
  );
}

function QuickAction({
  theme: t, icon: Icon, label, onClick, disabled, primary,
}: { theme: any; icon: any; label: string; onClick?: () => void; disabled?: boolean; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 disabled:opacity-40"
    >
      <span
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={primary ? { background: "#c49a2f" } : { background: t.bgActive, border: `1px solid ${t.borderMid}` }}
      >
        <Icon className="w-5 h-5" style={{ color: primary ? "#111" : t.text }} />
      </span>
      <span className="text-[9px] uppercase tracking-wide" style={{ color: t.textFaint }}>{label}</span>
    </button>
  );
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
  const [lightbox, setLightbox] = React.useState<string | null>(null);

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
    daysToDue === null ? "No active loan"
    : daysToDue > 0 ? `Due in ${daysToDue} days`
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

  return (
    <div
      className="space-y-4"
      style={{ fontFamily: mono, animation: "profileSlideIn 0.35s cubic-bezier(0.16,1,0.3,1)" }}
    >
      <style>{`
        @keyframes profileSlideIn {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Identity — centered avatar, name, status (Telegram-style header) */}
      <div className="flex flex-col items-center text-center pt-2 pb-1">
        <div
          className="w-24 h-24 rounded-full overflow-hidden border flex items-center justify-center"
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
            <span className="text-2xl font-bold" style={{ color: t.text }}>
              {client.borrowerName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <p className="text-lg font-bold mt-3" style={{ color: t.text }}>{client.borrowerName}</p>
        <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: t.textFaint }}>
          {occupation || "Client"}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[overallStatus] }} />
          <span className="text-[10px] font-bold uppercase" style={{ color: STATUS_COLOR[overallStatus] }}>
            {overallStatus}
          </span>
          <span className="text-[10px]" style={{ color: t.textMuted }}>· {dueLine}</span>
        </div>

        <p className="text-2xl font-bold mt-4" style={{ color: t.text }}>{formatCurrency(outstanding)}</p>
        <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: t.textFaint }}>
          Outstanding balance
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex items-center justify-center gap-8 py-2">
        <QuickAction theme={t} icon={Wallet} label="Record" primary disabled={!activeLoan} onClick={() => activeLoan && onRecordPayment?.(activeLoan)} />
        <QuickAction theme={t} icon={Plus} label="Agreement" onClick={() => onNewAgreement?.(client)} />
        {client.borrowerPhone && (
          <QuickAction theme={t} icon={Phone} label="Call" onClick={() => { window.location.href = `tel:${client.borrowerPhone}`; }} />
        )}
      </div>

      {/* Info group */}
      <GroupCard theme={t}>
        <GroupLabel theme={t}>Info</GroupLabel>
        {client.borrowerPhone && <InfoRow theme={t} icon={Phone} label="Phone number" value={client.borrowerPhone} />}
        <InfoRow theme={t} icon={Briefcase} label="Occupation" value={occupation || "—"} />
        {address && <InfoRow theme={t} icon={MapPin} label="Address" value={address} />}
        <InfoRow theme={t} icon={CreditCard} label="ID number" value={client.borrowerIdNumber || "—"} />
        <div className="px-5 py-3 border-b" style={{ borderColor: t.border }}>
          <p className="text-[9px] uppercase tracking-wide mb-2" style={{ color: t.textFaint }}>ID photo</p>
          {client.borrowerIdPhoto ? (
            <img
              src={client.borrowerIdPhoto}
              alt="ID document"
              onClick={() => setLightbox(client.borrowerIdPhoto!)}
              className="w-full h-28 object-cover rounded-xl border cursor-zoom-in"
              style={{ borderColor: t.border }}
            />
          ) : (
            <div
              className="w-full h-28 rounded-xl border-2 border-dashed flex items-center justify-center"
              style={{ borderColor: t.border, background: t.bgActive }}
            >
              <span className="text-xs" style={{ color: t.textFaint }}>No ID image</span>
            </div>
          )}
        </div>
        <InfoRow theme={t} icon={Clock} label="Next due" value={dueLine} last />
      </GroupCard>

      {/* About + tags group */}
      {(notes || tags.length > 0) && (
        <GroupCard theme={t}>
          <GroupLabel theme={t}>About</GroupLabel>
          <div className="px-5 pb-4">
            <p className="text-sm leading-relaxed" style={{ color: t.text }}>
              {notes || "No notes yet."}
            </p>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
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
            )}
          </div>
        </GroupCard>
      )}

      {/* Stats group */}
      <GroupCard theme={t}>
        <GroupLabel theme={t}>Overview</GroupLabel>
        <StatRow theme={t} label="Loans" value={clientLoans.length} />
        <StatRow theme={t} label="Transactions" value={totalTransactions} last />
      </GroupCard>

      {/* Payment history group */}
      <GroupCard theme={t}>
        <GroupLabel theme={t}>Payment history</GroupLabel>
        <div className="max-h-72 overflow-y-auto pb-1">
          {payments.length === 0 ? (
            <p className="text-xs px-5 pb-4" style={{ color: t.textMuted }}>No payments yet.</p>
          ) : (
            payments.map(({ tx, loanNumber }, i) => {
              const cyc = tx.paymentType === "Interest" ? cycleByTx.get(tx.id) : undefined;
              const short = !!cyc && cyc.remaining > 0;
              const last = i === payments.length - 1;
              return (
                <div key={tx.id} className={`px-5 py-3 ${last ? "" : "border-b"}`} style={{ borderColor: t.border }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center" style={{ background: t.bgActive }}>
                      <CreditCard className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold" style={{ color: t.text }}>{formatCurrency(tx.amount)}</p>
                        <p className="text-[9px] truncate" style={{ color: t.textFaint }}>
                          {loanNumber} · {tx.paymentType} · {tx.paymentMethod}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[9px]" style={{ color: t.textMuted }}>{formatDate(tx.date)}</p>
                        <p className="text-[9px]" style={{ color: tx.status === "Completed" ? "#4ade80" : "#f87171" }}>
                          {tx.status}
                        </p>
                      </div>
                    </div>
                  </div>
                  {short && cyc && (
                    <div className="mt-2 ml-11 rounded-lg px-2 py-1.5 border" style={{ borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)" }}>
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
      </GroupCard>

      {/* Dues history group */}
      <GroupCard theme={t}>
        <GroupLabel theme={t}>Dues history</GroupLabel>
        <div className="max-h-72 overflow-y-auto pb-2">
          {duesByLoan.length === 0 ? (
            <p className="text-xs px-5 pb-4" style={{ color: t.textMuted }}>No loans yet.</p>
          ) : (
            duesByLoan.map(({ loan, rows }) => (
              <div key={loan.id} className="px-5">
                <div className="flex items-center gap-2 pt-3 pb-1">
                  <FileText className="w-3 h-3" style={{ color: t.textFaint }} />
                  <p className="text-[10px] font-bold" style={{ color: t.text }}>{loan.loanNumber}</p>
                </div>
                {[...rows].reverse().map((r, i, arr) => (
                  <div
                    key={r.cycle}
                    className={`flex items-center justify-between py-2 ${i === arr.length - 1 ? "" : "border-b"}`}
                    style={{ borderColor: t.border }}
                  >
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
      </GroupCard>

      {lightbox && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-6"
          style={{ background: "rgba(10,10,12,0.92)" }}
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <img
            src={lightbox}
            alt="ID document — full view"
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
};

