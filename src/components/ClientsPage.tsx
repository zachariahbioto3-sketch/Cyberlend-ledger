import React, { useState, useMemo } from "react";
import {
  Users, Search, Star, AlertTriangle, UserX,
  Mail, MapPin, CreditCard, TrendingUp, FileText,
  ChevronRight, X, Edit3, Save, Flag, Plus, ArrowLeft,
  DollarSign, Activity, CheckCircle, Clock, ShieldAlert, BarChart2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Loan, ClientFlag } from "../types";
import { formatCompactCurrency, calculatePortfolioMetrics } from "../utils/loanCalculations";

interface ClientsPageProps {
  loans: Loan[];
  theme: any;
  onUpdateLoan?: (id: string, updates: Partial<Loan>) => void;
}

const FLAG_META: Record<ClientFlag, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  VIP:         { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  icon: <Star className="w-3 h-3" /> },
  New:         { color: "#5b7cfa", bg: "rgba(91,124,250,0.12)",  border: "rgba(91,124,250,0.3)",  icon: <Plus className="w-3 h-3" /> },
  Regular:     { color: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.3)",  icon: <Users className="w-3 h-3" /> },
  Defaulter:   { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)", icon: <AlertTriangle className="w-3 h-3" /> },
  Blacklisted: { color: "#dc2626", bg: "rgba(220,38,38,0.12)",   border: "rgba(220,38,38,0.3)",   icon: <UserX className="w-3 h-3" /> },
};

function getBorrowerStats(loans: Loan[]) {
  const totalLent      = loans.reduce((s, l) => s + l.loanAmount, 0);
  const totalCollected = loans.reduce((s, l) => s + l.interestCollected, 0);
  const totalTx        = loans.reduce((s, l) => s + l.transactions.length, 0);
  const repayRate      = loans.length
    ? Math.round((loans.filter((l) => l.status === "Completed").length / loans.length) * 100)
    : 0;
  return { totalLent, totalCollected, totalTx, repayRate };
}

function groupByBorrower(loans: Loan[]): Record<string, Loan[]> {
  return loans.reduce((acc, loan) => {
    const key = loan.borrowerPhone || loan.borrowerName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(loan);
    return acc;
  }, {} as Record<string, Loan[]>);
}

// ── PORTFOLIO SUMMARY PANEL ──────────────────────────────────────────────────
interface PortfolioSummaryPanelProps { loans: Loan[]; theme: any; grouped: Record<string, Loan[]>; }

const PortfolioSummaryPanel: React.FC<PortfolioSummaryPanelProps> = ({ loans, theme: t, grouped }) => {
  const mono    = "'Space Mono', monospace";
  const metrics = calculatePortfolioMetrics(loans);
  const totalClients = Object.keys(grouped).length;

  const topBorrowers = useMemo(() => {
    return Object.entries(grouped)
      .map(([, clientLoans]) => {
        const latest     = clientLoans[0];
        const totalLent  = clientLoans.reduce((s, l) => s + l.loanAmount, 0);
        const hasOverdue = clientLoans.some((l) => l.status === "Overdue");
        return { name: latest.borrowerName, phone: latest.borrowerPhone, totalLent, hasOverdue, flags: latest.clientFlags || [] };
      })
      .sort((a, b) => b.totalLent - a.totalLent)
      .slice(0, 5);
  }, [grouped]);

  const flagSummary = useMemo(() => {
    return (Object.keys(FLAG_META) as ClientFlag[]).map((f) => ({
      flag: f,
      count: loans.filter((l) => (l.clientFlags || []).includes(f)).length,
    })).filter((x) => x.count > 0);
  }, [loans]);

  // ── FINANCIAL HEALTH METRICS ──
  const collectionRate = useMemo(() => {
    const totalExpected = loans.reduce((s, l) => s + (l.monthlyInterest * l.monthsCompleted), 0);
    if (totalExpected === 0) return 0;
    return Math.min(100, Math.round((metrics.totalCollected / totalExpected) * 100));
  }, [loans, metrics]);

  const monthlyCollections = useMemo(() => {
    const map: Record<string, { collected: number; outstanding: number }> = {};
    loans.forEach((loan) => {
      loan.transactions
        .filter((tx) => tx.status === "Completed" && tx.paymentType === "Interest")
        .forEach((tx) => {
          const month = tx.date.slice(0, 7); // "YYYY-MM"
          if (!map[month]) map[month] = { collected: 0, outstanding: 0 };
          map[month].collected += tx.amount;
        });
      if (loan.status !== "Completed") {
        const month = loan.nextDueDate?.slice(0, 7) || new Date().toISOString().slice(0, 7);
        if (!map[month]) map[month] = { collected: 0, outstanding: 0 };
        map[month].outstanding += loan.monthlyInterest;
      }
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({ month: month.slice(5), ...data }));
  }, [loans]);

  const agingBuckets = useMemo(() => {
    const today = new Date();
    const buckets = [
      { label: "1–30 days",  count: 0, amount: 0 },
      { label: "31–60 days", count: 0, amount: 0 },
      { label: "60+ days",   count: 0, amount: 0 },
    ];
    loans
      .filter((l) => l.status === "Overdue")
      .forEach((l) => {
        const due  = new Date(l.nextDueDate);
        const days = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 30)       { buckets[0].count++; buckets[0].amount += l.loanAmount; }
        else if (days <= 60)  { buckets[1].count++; buckets[1].amount += l.loanAmount; }
        else                  { buckets[2].count++; buckets[2].amount += l.loanAmount; }
      });
    return buckets;
  }, [loans]);



  const portfolioStats = [
    { label: "TOTAL CLIENTS",   value: String(totalClients),                              icon: <Users className="w-4 h-4" />,       color: "#5b7cfa" },
    { label: "TOTAL LENT",      value: formatCompactCurrency(metrics.totalPrincipalLent), icon: <DollarSign className="w-4 h-4" />,  color: "#4ade80" },
    { label: "INTEREST EARNED", value: formatCompactCurrency(metrics.totalCollected),     icon: <TrendingUp className="w-4 h-4" />,  color: "#f59e0b" },
    { label: "ACTIVE LOANS",    value: String(metrics.activeLoansCount),                  icon: <Activity className="w-4 h-4" />,    color: "#5b7cfa" },
    { label: "OVERDUE",         value: String(metrics.overdueCount),                      icon: <Clock className="w-4 h-4" />,       color: metrics.overdueCount > 0 ? "#f87171" : "#4ade80" },
    { label: "COMPLETED",       value: String(metrics.completedLoansCount),               icon: <CheckCircle className="w-4 h-4" />, color: "#4ade80" },
  ];

  return (
    <div className="hidden md:flex flex-1 overflow-y-auto" style={{ background: t.bgCard }}>

      {/* Left column — Portfolio Overview */}
      <div className="flex flex-col px-6 py-6 gap-5 flex-1 border-r" style={{ borderColor: t.border }}>
        <div>
          <h2 className="text-sm font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>PORTFOLIO OVERVIEW</h2>
          <p className="text-[10px] mt-1" style={{ color: t.textFaint, fontFamily: mono }}>SELECT A CLIENT ON THE LEFT TO VIEW THEIR PROFILE</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          {portfolioStats.map((s) => (
            <div key={s.label} className="rounded-2xl border p-5 flex flex-col gap-2" style={{ background: t.bgCard, borderColor: t.border }}>
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>{s.label}</p>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <p className="text-lg font-bold" style={{ fontFamily: mono, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Flag breakdown */}
        {flagSummary.length > 0 && (
          <div className="rounded-2xl border p-5" style={{ background: t.bgCard, borderColor: t.border }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ fontFamily: mono, color: t.textFaint }}>CLIENT SEGMENTS</p>
            <div className="flex gap-2 flex-wrap">
              {flagSummary.map(({ flag, count }) => (
                <div key={flag}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full border text-[10px] font-bold"
                  style={{ fontFamily: mono, background: FLAG_META[flag].bg, borderColor: FLAG_META[flag].border, color: FLAG_META[flag].color }}>
                  {FLAG_META[flag].icon}
                  {flag} <span className="opacity-70">({count})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top borrowers */}
        <div className="rounded-2xl border p-5" style={{ background: t.bgCard, borderColor: t.border }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ fontFamily: mono, color: t.textFaint }}>TOP BORROWERS BY EXPOSURE</p>
          <div className="space-y-2">
            {topBorrowers.map((b, i) => (
              <div key={b.phone} className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ background: t.bgActive, borderColor: t.border }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border"
                  style={{
                    background:  b.hasOverdue ? "rgba(248,113,113,0.15)" : "rgba(91,124,250,0.12)",
                    borderColor: b.hasOverdue ? "rgba(248,113,113,0.4)"  : "rgba(91,124,250,0.3)",
                  }}>
                  <span className="text-[10px] font-bold" style={{ fontFamily: mono, color: b.hasOverdue ? "#f87171" : "#5b7cfa" }}>{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: t.text }}>{b.name}</p>
                  <p className="text-[10px]" style={{ color: t.textFaint, fontFamily: mono }}>{b.phone}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold" style={{ fontFamily: mono, color: "#5b7cfa" }}>{formatCompactCurrency(b.totalLent)}</p>
                  {b.hasOverdue && <p className="text-[9px]" style={{ color: "#f87171", fontFamily: mono }}>OVERDUE</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column — Financial Health */}
      <div className="flex flex-col px-6 py-6 gap-5 w-[340px] xl:w-[380px] shrink-0">
        <div>
          <h2 className="text-sm font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>FINANCIAL HEALTH</h2>
          <p className="text-[10px] mt-1" style={{ color: t.textFaint, fontFamily: mono }}>COLLECTION METRICS & RISK ANALYSIS</p>
        </div>

        {/* Collection rate */}
        <div className="rounded-2xl border p-5" style={{ background: t.bgCard, borderColor: t.border }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>REPAYMENT RATE</p>
            <BarChart2 className="w-3.5 h-3.5" style={{ color: "#5b7cfa" }} />
          </div>
          <div className="flex items-end gap-3 mb-3">
            <p className="text-3xl font-bold" style={{ fontFamily: mono, color: collectionRate >= 80 ? "#4ade80" : collectionRate >= 50 ? "#f59e0b" : "#f87171" }}>
              {collectionRate}%
            </p>
            <p className="text-[10px] mb-1" style={{ color: t.textFaint, fontFamily: mono }}>
              {formatCompactCurrency(metrics.totalCollected)} of expected collected
            </p>
          </div>
          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: t.bgActive }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${collectionRate}%`,
                background: collectionRate >= 80 ? "#4ade80" : collectionRate >= 50 ? "#f59e0b" : "#f87171",
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px]" style={{ color: t.textFaint, fontFamily: mono }}>0%</span>
            <span className="text-[9px]" style={{ color: t.textFaint, fontFamily: mono }}>TARGET: 100%</span>
          </div>
        </div>

        {/* Outstanding vs Collected bar chart */}
        <div className="rounded-2xl border p-5" style={{ background: t.bgCard, borderColor: t.border }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>
              MONTHLY COLLECTIONS
            </p>
            <div className="flex gap-3 text-[9px]" style={{ fontFamily: mono }}>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "#5b7cfa" }} />COLLECTED</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "#f87171" }} />DUE</span>
            </div>
          </div>
          {monthlyCollections.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: t.textFaint, fontFamily: mono }}>NO TRANSACTION DATA YET</p>
          ) : (
            <div style={{ height: 120, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyCollections} barGap={3} barCategoryGap="30%">
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: t.textFaint, fontFamily: mono }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{ background: t.bgCard, border: `1px solid ${t.borderMid}`, borderRadius: 10, fontFamily: mono, fontSize: 10 }}
                    labelStyle={{ color: t.text, fontWeight: 700 }}
                    itemStyle={{ color: t.textMuted }}
                    formatter={(v: number) => [`KES ${v.toLocaleString()}`, undefined]}
                  />
                  <Bar dataKey="collected"   name="Collected" fill="#3b82f6" radius={[3,3,0,0]} />
                  <Bar dataKey="outstanding" name="Due"       fill="#ef4444" opacity={0.6} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Aging debt breakdown */}
        <div className="rounded-2xl border p-5" style={{ background: t.bgCard, borderColor: t.border }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>AGING DEBT</p>
            <ShieldAlert className="w-3.5 h-3.5" style={{ color: metrics.overdueCount > 0 ? "#f87171" : t.textFaint }} />
          </div>
          {metrics.overdueCount === 0 ? (
            <div className="flex flex-col items-center py-3 gap-1.5">
              <CheckCircle className="w-6 h-6" style={{ color: "#4ade80" }} />
              <p className="text-xs font-bold" style={{ fontFamily: mono, color: "#4ade80" }}>ALL CLEAR</p>
              <p className="text-[10px]" style={{ color: t.textFaint, fontFamily: mono }}>NO OVERDUE LOANS</p>
            </div>
          ) : (
            <div className="space-y-2">
              {agingBuckets.map((bucket, i) => {
                const colors = ["#f59e0b", "#f87171", "#dc2626"];
                return (
                  <div key={bucket.label} className="flex items-center justify-between p-2.5 rounded-xl border"
                    style={{ background: t.bgActive, borderColor: t.border }}>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-6 rounded-full" style={{ background: colors[i] }} />
                      <div>
                        <p className="text-[10px] font-bold" style={{ fontFamily: mono, color: t.text }}>{bucket.label}</p>
                        <p className="text-[9px]" style={{ color: t.textFaint, fontFamily: mono }}>{bucket.count} LOAN{bucket.count !== 1 ? "S" : ""}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold" style={{ fontFamily: mono, color: colors[i] }}>
                      {bucket.amount > 0 ? formatCompactCurrency(bucket.amount) : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Outstanding vs Lent summary */}
        <div className="rounded-2xl border p-5" style={{ background: t.bgCard, borderColor: t.border }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ fontFamily: mono, color: t.textFaint }}>CAPITAL EXPOSURE</p>
          <div className="space-y-3">
            {[
              { label: "TOTAL LENT",       value: metrics.totalPrincipalLent, color: "#5b7cfa", pct: 100 },
              { label: "OUTSTANDING",      value: metrics.totalOutstanding,   color: "#f59e0b", pct: metrics.totalPrincipalLent ? Math.round((metrics.totalOutstanding / metrics.totalPrincipalLent) * 100) : 0 },
              { label: "RECOVERED",        value: metrics.totalPrincipalLent - metrics.totalOutstanding, color: "#4ade80", pct: metrics.totalPrincipalLent ? Math.round(((metrics.totalPrincipalLent - metrics.totalOutstanding) / metrics.totalPrincipalLent) * 100) : 0 },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between mb-1">
                  <p className="text-[9px] uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>{row.label}</p>
                  <p className="text-[10px] font-bold" style={{ fontFamily: mono, color: row.color }}>{formatCompactCurrency(row.value)}</p>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: t.bgActive }}>
                  <div className="h-full rounded-full" style={{ width: `${row.pct}%`, background: row.color, opacity: 0.8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
// ────────────────────────────────────────────────────────────────────────────

export const ClientsPage: React.FC<ClientsPageProps> = ({ loans, theme: t, onUpdateLoan }) => {
  const [search, setSearch]           = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editMode, setEditMode]       = useState(false);
  const [filterFlag, setFilterFlag]   = useState<ClientFlag | "All">("All");
  const [editData, setEditData]       = useState<Partial<Loan>>({});

  const mono = "'Space Mono', monospace";

  const grouped = useMemo(() => groupByBorrower(loans), [loans]);

  const clients = useMemo(() => {
    return Object.entries(grouped)
      .map(([key, clientLoans]) => {
        const latest = clientLoans[0];
        const stats  = getBorrowerStats(clientLoans);
        return { key, loans: clientLoans, latest, stats };
      })
      .filter((c) => {
        const matchSearch =
          c.latest.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
          c.latest.borrowerPhone.includes(search) ||
          (c.latest.borrowerEmail || "").toLowerCase().includes(search.toLowerCase());
        const matchFlag =
          filterFlag === "All" ||
          (c.latest.clientFlags || []).includes(filterFlag);
        return matchSearch && matchFlag;
      })
      .sort((a, b) => a.latest.borrowerName.localeCompare(b.latest.borrowerName));
  }, [grouped, search, filterFlag]);

  const selected       = selectedKey ? grouped[selectedKey] : null;
  const selectedLatest = selected ? selected[0] : null;
  const selectedStats  = selected ? getBorrowerStats(selected) : null;

  const handleEdit = () => {
    if (!selectedLatest) return;
    setEditData({
      borrowerAddress:  selectedLatest.borrowerAddress  || "",
      borrowerIdNumber: selectedLatest.borrowerIdNumber || "",
      borrowerEmail:    selectedLatest.borrowerEmail    || "",
      clientNotes:      selectedLatest.clientNotes      || "",
      referralSource:   selectedLatest.referralSource   || "",
      clientFlags:      selectedLatest.clientFlags      || [],
    });
    setEditMode(true);
  };

  const handleSave = () => {
    if (!selected || !onUpdateLoan) return;
    selected.forEach((l) => onUpdateLoan(l.id, editData));
    setEditMode(false);
  };

  const toggleFlag = (flag: ClientFlag) => {
    const current = (editData.clientFlags || []) as ClientFlag[];
    setEditData((prev) => ({
      ...prev,
      clientFlags: current.includes(flag)
        ? current.filter((f) => f !== flag)
        : [...current, flag],
    }));
  };

  const flagCounts = useMemo(() => {
    const counts: Record<string, number> = { All: Object.keys(grouped).length };
    (Object.keys(FLAG_META) as ClientFlag[]).forEach((f) => {
      counts[f] = loans.filter((l) => (l.clientFlags || []).includes(f)).length;
    });
    return counts;
  }, [grouped, loans]);

  const isMobileDetail = selectedKey !== null;

  return (
    <div className="flex h-full min-h-screen relative" style={{ background: t.bg }}>

      {/* ── LEFT — CLIENT LIST ── */}
      <div
        className={`flex flex-col border-r ${isMobileDetail ? "hidden md:flex" : "flex"}`}
        style={{
          width: "340px",
          minWidth: "260px",
          maxWidth: "340px",
          borderColor: t.border,
          background: t.bg,
          flexShrink: 0,
        }}>

        <div className="px-4 md:px-6 pt-5 pb-4 border-b" style={{ borderColor: t.border }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>CLIENTS</h2>
              <p className="text-[10px] mt-0.5" style={{ color: t.textFaint }}>{clients.length} BORROWERS</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
              style={{ background: t.bgCard, borderColor: t.border }}>
              <Users className="w-3.5 h-3.5" style={{ color: "#5b7cfa" }} />
              <span className="text-xs font-bold" style={{ fontFamily: mono, color: t.text }}>{Object.keys(grouped).length}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-3"
            style={{ background: t.bgInput, borderColor: t.borderMid }}>
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: t.textFaint }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email..."
              className="flex-1 bg-transparent text-xs outline-none min-w-0"
              style={{ color: t.text, fontFamily: mono }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="shrink-0 p-1">
                <X className="w-3 h-3" style={{ color: t.textFaint }} />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {(["All", ...Object.keys(FLAG_META)] as (ClientFlag | "All")[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilterFlag(f)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border whitespace-nowrap text-[10px] font-bold transition-all shrink-0"
                style={{
                  fontFamily:  mono,
                  minHeight:   "32px",
                  background:  filterFlag === f ? (f === "All" ? "#5b7cfa" : FLAG_META[f as ClientFlag].bg)     : t.bgCard,
                  borderColor: filterFlag === f ? (f === "All" ? "#5b7cfa" : FLAG_META[f as ClientFlag].border) : t.border,
                  color:       filterFlag === f ? (f === "All" ? "#fff"    : FLAG_META[f as ClientFlag].color)  : t.textMuted,
                }}>
                {f !== "All" && FLAG_META[f as ClientFlag].icon}
                {f}{flagCounts[f] > 0 && ` (${flagCounts[f]})`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Users className="w-8 h-8" style={{ color: t.textFaint }} />
              <p className="text-xs" style={{ color: t.textFaint, fontFamily: mono }}>NO CLIENTS FOUND</p>
            </div>
          ) : (
            clients.map((c) => {
              const flags      = c.latest.clientFlags || [];
              const isActive   = selectedKey === c.key;
              const hasOverdue = c.loans.some((l) => l.status === "Overdue");
              return (
                <button
                  key={c.key}
                  onClick={() => { setSelectedKey(c.key); setEditMode(false); }}
                  className="w-full flex items-center gap-3 px-4 md:px-5 py-4 border-b text-left transition-all cursor-pointer"
                  style={{
                    background:  isActive ? t.bgActive : "transparent",
                    borderColor: t.border,
                    borderLeft:  isActive ? "3px solid #5b7cfa" : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = t.bgCard; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>

                  <div className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0"
                    style={{
                      background:  hasOverdue ? "rgba(248,113,113,0.15)" : t.bgActive,
                      borderColor: hasOverdue ? "rgba(248,113,113,0.4)"  : t.borderMid,
                    }}>
                    <span className="text-sm font-bold" style={{ fontFamily: mono, color: hasOverdue ? "#f87171" : t.text }}>
                      {c.latest.borrowerName.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-xs font-bold truncate" style={{ color: t.text }}>{c.latest.borrowerName}</p>
                      {flags.includes("VIP")         && <Star className="w-3 h-3 shrink-0" style={{ color: "#f59e0b" }} />}
                      {flags.includes("Blacklisted") && <UserX className="w-3 h-3 shrink-0" style={{ color: "#dc2626" }} />}
                    </div>
                    <p className="text-[10px] truncate" style={{ color: t.textFaint, fontFamily: mono }}>
                      {c.latest.borrowerPhone} · {c.loans.length} LOAN{c.loans.length > 1 ? "S" : ""}
                    </p>
                    <p className="text-[10px]" style={{ color: "#5b7cfa", fontFamily: mono }}>
                      {formatCompactCurrency(c.stats.totalLent)} lent
                    </p>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: t.textFaint }} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT — PORTFOLIO SUMMARY + FINANCIAL HEALTH (no client selected) ── */}
      {!selected && <PortfolioSummaryPanel loans={loans} theme={t} grouped={grouped} />}

      {/* ── RIGHT — CLIENT DETAIL (client selected) ── */}
      {selected && selectedLatest && selectedStats && (
        <div
          className="flex flex-col overflow-hidden md:flex-1"
          style={{ background: t.bgCard, position: "absolute" as const, inset: 0, zIndex: 20 }}>
          <div className="flex flex-col h-full w-full" style={{ background: t.bgCard }}>

            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b shrink-0 gap-3"
              style={{ borderColor: t.border }}>
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => { setSelectedKey(null); setEditMode(false); }}
                  className="flex md:hidden items-center justify-center w-8 h-8 rounded-xl border shrink-0"
                  style={{ background: t.bgBtn, borderColor: t.border, color: t.textFaint }}>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl border flex items-center justify-center shrink-0"
                  style={{ background: t.bgActive, borderColor: t.borderMid }}>
                  <span className="text-base md:text-xl font-bold" style={{ fontFamily: mono, color: t.text }}>
                    {selectedLatest.borrowerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm md:text-base font-bold truncate" style={{ fontFamily: mono, color: t.text }}>
                    {selectedLatest.borrowerName}
                  </h3>
                  <p className="text-[10px] mt-0.5" style={{ color: t.textFaint, fontFamily: mono }}>
                    {selectedLatest.borrowerPhone}
                  </p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {(selectedLatest.clientFlags || []).map((f) => (
                      <span key={f}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold"
                        style={{ fontFamily: mono, background: FLAG_META[f].bg, borderColor: FLAG_META[f].border, color: FLAG_META[f].color }}>
                        {FLAG_META[f].icon}{f.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!editMode ? (
                  <button onClick={handleEdit}
                    className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl border text-xs font-bold transition-all"
                    style={{ fontFamily: mono, background: t.bgBtn, borderColor: t.border, color: t.textMuted }}>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">EDIT</span>
                  </button>
                ) : (
                  <>
                    <button onClick={() => setEditMode(false)}
                      className="px-3 md:px-4 py-2 rounded-xl border text-xs font-bold"
                      style={{ fontFamily: mono, background: t.bgBtn, borderColor: t.border, color: t.textMuted }}>
                      <span className="hidden sm:inline">CANCEL</span>
                      <X className="w-3.5 h-3.5 sm:hidden" />
                    </button>
                    <button onClick={handleSave}
                      className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-xs font-bold"
                      style={{ fontFamily: mono, background: "#5b7cfa", color: "#fff" }}>
                      <Save className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">SAVE</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => { setSelectedKey(null); setEditMode(false); }}
                  className="hidden md:flex items-center justify-center p-2 rounded-xl border shrink-0"
                  style={{ background: t.bgBtn, borderColor: t.border, color: t.textFaint }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "TOTAL LENT",    value: formatCompactCurrency(selectedStats.totalLent) },
                  { label: "INTEREST PAID", value: formatCompactCurrency(selectedStats.totalCollected) },
                  { label: "REPAY RATE",    value: `${selectedStats.repayRate}%` },
                  { label: "TRANSACTIONS",  value: String(selectedStats.totalTx) },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl p-5 border"
                    style={{ background: t.bgActive, borderColor: t.border }}>
                    <p className="text-[9px] uppercase tracking-widest mb-1" style={{ fontFamily: mono, color: t.textFaint }}>{s.label}</p>
                    <p className="text-sm font-bold" style={{ fontFamily: mono, color: "#5b7cfa" }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border p-4 md:p-5" style={{ background: t.bg, borderColor: t.border }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ fontFamily: mono, color: t.textFaint }}>
                  CONTACT & PROFILE
                </p>
                {editMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Email",          key: "borrowerEmail",    icon: <Mail className="w-3.5 h-3.5" /> },
                      { label: "Address",         key: "borrowerAddress",  icon: <MapPin className="w-3.5 h-3.5" /> },
                      { label: "ID Number",       key: "borrowerIdNumber", icon: <CreditCard className="w-3.5 h-3.5" /> },
                      { label: "Referral Source", key: "referralSource",   icon: <TrendingUp className="w-3.5 h-3.5" /> },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                          style={{ fontFamily: mono, color: t.textMuted }}>
                          {field.label}
                        </label>
                        <input
                          value={(editData as any)[field.key] || ""}
                          onChange={(e) => setEditData((p) => ({ ...p, [field.key]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl text-xs outline-none border"
                          style={{ background: t.bgInput, borderColor: t.borderMid, color: t.text, fontFamily: mono }}
                        />
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                        style={{ fontFamily: mono, color: t.textMuted }}>Notes</label>
                      <textarea rows={3}
                        value={(editData.clientNotes as string) || ""}
                        onChange={(e) => setEditData((p) => ({ ...p, clientNotes: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl text-xs outline-none border resize-none"
                        style={{ background: t.bgInput, borderColor: t.borderMid, color: t.text, fontFamily: mono }}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-2"
                        style={{ fontFamily: mono, color: t.textMuted }}>
                        <Flag className="w-3 h-3 inline mr-1" /> CLIENT FLAGS
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {(Object.keys(FLAG_META) as ClientFlag[]).map((f) => {
                          const active = (editData.clientFlags || []).includes(f);
                          return (
                            <button key={f} onClick={() => toggleFlag(f)}
                              className="flex items-center gap-1 px-3 py-2 rounded-full border text-[10px] font-bold transition-all"
                              style={{
                                fontFamily:  mono,
                                minHeight:   "32px",
                                background:  active ? FLAG_META[f].bg     : t.bgBtn,
                                borderColor: active ? FLAG_META[f].border : t.border,
                                color:       active ? FLAG_META[f].color  : t.textFaint,
                              }}>
                              {FLAG_META[f].icon}{f}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Email",    value: selectedLatest.borrowerEmail    || "—", icon: <Mail className="w-3.5 h-3.5" /> },
                      { label: "Address",  value: selectedLatest.borrowerAddress  || "—", icon: <MapPin className="w-3.5 h-3.5" /> },
                      { label: "ID No.",   value: selectedLatest.borrowerIdNumber || "—", icon: <CreditCard className="w-3.5 h-3.5" /> },
                      { label: "Referral", value: selectedLatest.referralSource   || "—", icon: <TrendingUp className="w-3.5 h-3.5" /> },
                    ].map((f) => (
                      <div key={f.label} className="flex items-start gap-2 p-3 rounded-xl border"
                        style={{ background: t.bgActive, borderColor: t.border }}>
                        <span style={{ color: t.textFaint }}>{f.icon}</span>
                        <div>
                          <p className="text-[9px] uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>{f.label}</p>
                          <p className="text-xs mt-0.5 break-all" style={{ color: t.text }}>{f.value}</p>
                        </div>
                      </div>
                    ))}
                    {selectedLatest.clientNotes && (
                      <div className="sm:col-span-2 flex items-start gap-2 p-3 rounded-xl border"
                        style={{ background: t.bgActive, borderColor: t.border }}>
                        <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: t.textFaint }} />
                        <div>
                          <p className="text-[9px] uppercase tracking-widest mb-1" style={{ fontFamily: mono, color: t.textFaint }}>NOTES</p>
                          <p className="text-xs" style={{ color: t.text }}>{selectedLatest.clientNotes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border p-4 md:p-5" style={{ background: t.bg, borderColor: t.border }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ fontFamily: mono, color: t.textFaint }}>
                  LOAN HISTORY ({selected.length})
                </p>
                <div className="space-y-2">
                  {selected.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-3 rounded-xl border"
                      style={{ background: t.bgActive, borderColor: t.border }}>
                      <div>
                        <p className="text-xs font-bold" style={{ fontFamily: mono, color: t.text }}>{l.loanNumber}</p>
                        <p className="text-[10px]" style={{ color: t.textFaint }}>{l.category} · {l.originationDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold" style={{ fontFamily: mono, color: t.text }}>
                          {formatCompactCurrency(l.loanAmount)}
                        </p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            fontFamily:  mono,
                            color:       l.status === "Active" ? "#5b7cfa" : l.status === "Overdue" ? "#f87171" : l.status === "Completed" ? "#4ade80" : "#fca5a5",
                            background:  l.status === "Active" ? "rgba(91,124,250,0.1)" : l.status === "Overdue" ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.1)",
                            borderColor: l.status === "Active" ? "rgba(91,124,250,0.3)" : l.status === "Overdue" ? "rgba(248,113,113,0.3)" : "rgba(74,222,128,0.3)",
                          }}>
                          {l.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};











