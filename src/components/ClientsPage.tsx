import React, { useState, useMemo } from "react";
import {
  Users, Search, Shield, Star, AlertTriangle, UserX,
  Phone, Mail, MapPin, CreditCard, TrendingUp, FileText,
  ChevronRight, X, Edit3, Save, Flag, Plus
} from "lucide-react";
import { Loan, ClientFlag } from "../types";
import { formatCompactCurrency } from "../utils/loanCalculations";

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

  const selected = selectedKey ? grouped[selectedKey] : null;
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

  return (
    <div className="flex h-full min-h-screen" style={{ background: t.bg }}>

      {/* LEFT — CLIENT LIST */}
      <div className="flex flex-col border-r"
        style={{
          width: selectedKey ? "38%" : "100%",
          borderColor: t.border,
          transition: "width 0.3s",
          background: t.bg,
        }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: t.border }}>
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

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-3"
            style={{ background: t.bgInput, borderColor: t.borderMid }}>
            <Search className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email..."
              className="flex-1 bg-transparent text-xs outline-none"
              style={{ color: t.text, fontFamily: mono }}
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X className="w-3 h-3" style={{ color: t.textFaint }} />
              </button>
            )}
          </div>

          {/* Flag filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {(["All", ...Object.keys(FLAG_META)] as (ClientFlag | "All")[]).map((f) => (
              <button key={f} onClick={() => setFilterFlag(f)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border whitespace-nowrap text-[10px] font-bold transition-all"
                style={{
                  fontFamily: mono,
                  background:   filterFlag === f ? (f === "All" ? "#5b7cfa" : FLAG_META[f as ClientFlag].bg) : t.bgCard,
                  borderColor:  filterFlag === f ? (f === "All" ? "#5b7cfa" : FLAG_META[f as ClientFlag].border) : t.border,
                  color:        filterFlag === f ? (f === "All" ? "#fff" : FLAG_META[f as ClientFlag].color) : t.textMuted,
                }}>
                {f !== "All" && FLAG_META[f as ClientFlag].icon}
                {f} {flagCounts[f] > 0 && `(${flagCounts[f]})`}
              </button>
            ))}
          </div>
        </div>

        {/* Client list */}
        <div className="flex-1 overflow-y-auto">
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Users className="w-8 h-8" style={{ color: t.textFaint }} />
              <p className="text-xs" style={{ color: t.textFaint, fontFamily: mono }}>NO CLIENTS FOUND</p>
            </div>
          ) : (
            clients.map((c) => {
              const flags = c.latest.clientFlags || [];
              const isActive = selectedKey === c.key;
              const hasOverdue = c.loans.some((l) => l.status === "Overdue");
              return (
                <button key={c.key} onClick={() => { setSelectedKey(c.key); setEditMode(false); }}
                  className="w-full flex items-center gap-3 px-5 py-4 border-b text-left transition-all"
                  style={{
                    background:   isActive ? t.bgActive : "transparent",
                    borderColor:  t.border,
                    borderLeft:   isActive ? `3px solid #5b7cfa` : "3px solid transparent",
                  }}>
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0"
                    style={{
                      background:   hasOverdue ? "rgba(248,113,113,0.15)" : t.bgActive,
                      borderColor:  hasOverdue ? "rgba(248,113,113,0.4)" : t.borderMid,
                    }}>
                    <span className="text-sm font-bold" style={{ fontFamily: mono, color: hasOverdue ? "#f87171" : t.text }}>
                      {c.latest.borrowerName.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-xs font-bold truncate" style={{ color: t.text }}>{c.latest.borrowerName}</p>
                      {flags.includes("VIP") && <Star className="w-3 h-3 shrink-0" style={{ color: "#f59e0b" }} />}
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

      {/* RIGHT — CLIENT DETAIL */}
      {selected && selectedLatest && selectedStats && (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: t.bgCard }}>

          {/* Detail header */}
          <div className="flex items-center justify-between px-6 py-5 border-b shrink-0"
            style={{ borderColor: t.border }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl border flex items-center justify-center"
                style={{ background: t.bgActive, borderColor: t.borderMid }}>
                <span className="text-xl font-bold" style={{ fontFamily: mono, color: t.text }}>
                  {selectedLatest.borrowerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ fontFamily: mono, color: t.text }}>
                  {selectedLatest.borrowerName}
                </h3>
                <p className="text-[10px] mt-0.5" style={{ color: t.textFaint, fontFamily: mono }}>
                  {selectedLatest.borrowerPhone}
                </p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {(selectedLatest.clientFlags || []).map((f) => (
                    <span key={f} className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold"
                      style={{ fontFamily: mono, background: FLAG_META[f].bg, borderColor: FLAG_META[f].border, color: FLAG_META[f].color }}>
                      {FLAG_META[f].icon}{f.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!editMode ? (
                <button onClick={handleEdit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all"
                  style={{ fontFamily: mono, background: t.bgBtn, borderColor: t.border, color: t.textMuted }}>
                  <Edit3 className="w-3.5 h-3.5" /> EDIT
                </button>
              ) : (
                <>
                  <button onClick={() => setEditMode(false)}
                    className="px-4 py-2 rounded-xl border text-xs font-bold"
                    style={{ fontFamily: mono, background: t.bgBtn, borderColor: t.border, color: t.textMuted }}>
                    CANCEL
                  </button>
                  <button onClick={handleSave}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ fontFamily: mono, background: "#5b7cfa", color: "#fff" }}>
                    <Save className="w-3.5 h-3.5" /> SAVE
                  </button>
                </>
              )}
              <button onClick={() => setSelectedKey(null)}
                className="p-2 rounded-xl border"
                style={{ background: t.bgBtn, borderColor: t.border, color: t.textFaint }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Detail body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "TOTAL LENT",    value: formatCompactCurrency(selectedStats.totalLent) },
                { label: "INTEREST PAID", value: formatCompactCurrency(selectedStats.totalCollected) },
                { label: "REPAY RATE",    value: `${selectedStats.repayRate}%` },
                { label: "TRANSACTIONS",  value: String(selectedStats.totalTx) },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-4 border"
                  style={{ background: t.bgActive, borderColor: t.border }}>
                  <p className="text-[9px] uppercase tracking-widest mb-1" style={{ fontFamily: mono, color: t.textFaint }}>{s.label}</p>
                  <p className="text-sm font-bold" style={{ fontFamily: mono, color: "#5b7cfa" }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Contact info / edit */}
            <div className="rounded-2xl border p-5" style={{ background: t.bg, borderColor: t.border }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ fontFamily: mono, color: t.textFaint }}>
                CONTACT & PROFILE
              </p>
              {editMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Email",         key: "borrowerEmail",    icon: <Mail className="w-3.5 h-3.5" /> },
                    { label: "Address",       key: "borrowerAddress",  icon: <MapPin className="w-3.5 h-3.5" /> },
                    { label: "ID Number",     key: "borrowerIdNumber", icon: <CreditCard className="w-3.5 h-3.5" /> },
                    { label: "Referral Source", key: "referralSource", icon: <TrendingUp className="w-3.5 h-3.5" /> },
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
                  {/* Flags */}
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
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all"
                            style={{
                              fontFamily:  mono,
                              background:  active ? FLAG_META[f].bg  : t.bgBtn,
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
                        <p className="text-xs mt-0.5" style={{ color: t.text }}>{f.value}</p>
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

            {/* Loan history */}
            <div className="rounded-2xl border p-5" style={{ background: t.bg, borderColor: t.border }}>
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
      )}
    </div>
  );
};
