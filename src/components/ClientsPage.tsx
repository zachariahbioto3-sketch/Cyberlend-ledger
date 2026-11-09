import React, { useState, useMemo, useRef } from "react";
import {
  Users, Search, Star, AlertTriangle, UserX,
  Mail, MapPin, CreditCard, TrendingUp, FileText, Calendar,
  ChevronRight, X, Edit3, Save, Flag, Plus, ArrowLeft,
  DollarSign, Activity, CheckCircle, Clock, ShieldAlert,
  BarChart2, Upload, Camera, UserPlus, Phone
} from "lucide-react";
import { useLoanStore } from "../store/loanStore";
import { ClientInfoCard } from "./ClientInfoCard";
import { ClientProfilePanel } from "./ClientProfilePanel";
import { PhotoCapture } from "./PhotoCapture";
import { Loan, ClientFlag, LoanPurpose } from "../types";
import { formatCompactCurrency, calculatePortfolioMetrics } from "../utils/loanCalculations";
import { compressImage } from "../utils/imageUtils";

interface ClientsPageProps {
  loans: Loan[];
  onRegisterSuccess?: () => void;
  theme: any;
  onUpdateLoan?: (id: string, updates: Partial<Loan>) => void;
  onEditClient?: (loan: Loan) => void;
  onRecordPayment?: (loan: Loan) => void;
  onNewAgreement?: (client: Loan) => void;
}

const FLAG_META: Record<ClientFlag, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  VIP:         { color: "var(--warning-fg)", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  icon: <Star className="w-3 h-3" /> },
  New:         { color: "var(--foreground)", bg: "rgba(196,154,47,0.12)",  border: "rgba(196,154,47,0.3)",  icon: <Plus className="w-3 h-3" /> },
  Regular:     { color: "var(--success-fg)", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.3)",  icon: <Users className="w-3 h-3" /> },
  Risk:        { color: "var(--risk-fg)", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.3)",  icon: <ShieldAlert className="w-3 h-3" /> },
  Defaulter:   { color: "var(--danger-fg)", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)", icon: <AlertTriangle className="w-3 h-3" /> },
  Blacklisted: { color: "var(--blacklisted-fg)", bg: "rgba(220,38,38,0.12)",   border: "rgba(220,38,38,0.3)",   icon: <UserX className="w-3 h-3" /> },
};

const LOAN_PURPOSES: LoanPurpose[] = [
  "Business Capital","School Fees","Medical Emergency","Land/Property",
  "Agriculture","Home Improvement","Debt Consolidation","Electronics/Assets",
  "Personal Use","Other",
];

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

// -- NEW CLIENT MODAL ----------------------------------------------------------
interface NewClientModalProps {
  theme: any;
  onClose: () => void;
  onSave: (data: Partial<Loan>) => void;
}

const NewClientModal: React.FC<NewClientModalProps> = ({ theme: t, onClose, onSave }) => {
  const { addToWaitlist } = useLoanStore();
  const mono = "var(--font-mono)";
  const passportRef = useRef<HTMLInputElement>(null);
  const idRef       = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    borrowerName: "", borrowerUsername: "", borrowerPhone: "",
    borrowerEmail: "", borrowerAddress: "", borrowerIdNumber: "",
    kraPin: "", occupation: "", referralSource: "", clientNotes: "",
    loanPurpose: "" as LoanPurpose | "",
    borrowerPhoto: "", borrowerIdPhoto: "",
    clientFlags: ["New"] as ClientFlag[],
    dateNeeded: "", amountNeeded: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleImage = async (key: "borrowerPhoto" | "borrowerIdPhoto", file: File | undefined) => {
    if (!file) return;
    try { set(key, await compressImage(file)); } catch { setErrors({ photo: "Unable to load image" }); }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.borrowerName.trim())  e.borrowerName  = "Full name is required";
    if (!form.borrowerPhone.trim()) e.borrowerPhone = "Phone number is required";
    if (!form.loanPurpose)          e.loanPurpose   = "Select a loan purpose";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      ...form,
      dateJoined: new Date().toISOString().slice(0, 10),
    });
    addToWaitlist({
      name:         form.borrowerName.trim(),
      phone:        form.borrowerPhone.trim(),
      borrowerPhoto: form.borrowerPhoto,
      email:        form.borrowerEmail.trim(),
      occupation:   form.occupation.trim(),
      amountNeeded: Number(form.amountNeeded) || 0,
      purpose:      (form.loanPurpose || "Personal Use") as any,
      dateNeeded:   form.dateNeeded,
      notes:        form.clientNotes.trim(),
      idNumber:     form.borrowerIdNumber.trim(),
      address:      form.borrowerAddress.trim(),
      kraPin:       form.kraPin.trim(),
      referralSource: form.referralSource.trim(),
    });
    onClose();
  };

  const inputStyle = {
    background: t.bgInput, borderColor: t.borderMid,
    color: t.text, fontFamily: mono,
  };

  const labelStyle = { fontFamily: mono, color: t.textMuted };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(17,18,20,0.45)", backdropFilter: "blur(8px)" }}>
      <div className="cl-form-modal relative w-full max-w-2xl rounded-3xl border flex flex-col"
        style={{ background: t.bgCard, borderColor: t.border, maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0 z-10"
          style={{ background: t.bgCard, borderColor: t.border, maxHeight: "90vh" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--secondary)" }}>
              <UserPlus className="w-4 h-4" style={{ color: "var(--foreground)" }} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>
                NEW CLIENT REGISTRATION
              </h2>
              <p className="text-xs" style={{ color: t.textFaint, fontFamily: mono }}>
                CLIENT A  FIRST TIME BORROWER
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl border"
            style={{ background: t.bgBtn, borderColor: t.border, color: t.textFaint }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">

          {/* Photo uploads */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ fontFamily: mono, color: t.textFaint }}>PHOTO DOCUMENTS</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Passport photo */}
              <div>
                <p className="text-xs mb-2 font-bold uppercase" style={labelStyle}>Passport Photo</p>
                <PhotoCapture
                  value={form.borrowerPhoto}
                  onChange={(img) => set("borrowerPhoto", img)}
                  label="Passport Photo"
                  theme={t}
                  facingMode="user"
                />
              </div>

              {/* ID card */}
              <div>
                <p className="text-xs mb-2 font-bold uppercase" style={labelStyle}>ID Card Photo</p>
                <PhotoCapture
                  value={form.borrowerIdPhoto}
                  onChange={(img) => set("borrowerIdPhoto", img)}
                  label="ID Card Photo"
                  theme={t}
                  facingMode="environment"
                />
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ fontFamily: mono, color: t.textFaint }}>PERSONAL INFORMATION</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Full Name *",    key: "borrowerName",     icon: <Users className="w-3.5 h-3.5" />,    type: "text" },
                { label: "Username",       key: "borrowerUsername", icon: <Users className="w-3.5 h-3.5" />,    type: "text" },
                { label: "Phone *",        key: "borrowerPhone",    icon: <Phone className="w-3.5 h-3.5" />,    type: "tel"  },
                { label: "Email",          key: "borrowerEmail",    icon: <Mail className="w-3.5 h-3.5" />,     type: "email"},
                { label: "ID Number",      key: "borrowerIdNumber", icon: <CreditCard className="w-3.5 h-3.5" />, type: "text"},
                { label: "KRA PIN",        key: "kraPin",           icon: <CreditCard className="w-3.5 h-3.5" />, type: "text"},
                { label: "Occupation",     key: "occupation",       icon: <TrendingUp className="w-3.5 h-3.5" />, type: "text"},
                { label: "Referral Source",key: "referralSource",   icon: <TrendingUp className="w-3.5 h-3.5" />, type: "text"},
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={labelStyle}>
                    {f.label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textFaint }}>
                      {f.icon}
                    </span>
                    <input
                      type={f.type}
                      value={(form as any)[f.key]}
                      onChange={e => set(f.key, e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none border"
                      style={{ ...inputStyle, borderColor: errors[f.key] ? "#A82F2F" : t.borderMid }}
                    />
                  </div>
                  {errors[f.key] && (
                    <p className="text-xs mt-1" style={{ color: "var(--danger-fg)", fontFamily: mono }}>
                      {errors[f.key]}
                    </p>
                  )}
                </div>
              ))}

              {/* Address  full width */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={labelStyle}>
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-3.5 h-3.5" style={{ color: t.textFaint }} />
                  <input
                    type="text"
                    value={form.borrowerAddress}
                    onChange={e => set("borrowerAddress", e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none border"
                    style={inputStyle}
                    placeholder="Town, County"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Loan Purpose */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ fontFamily: mono, color: t.textFaint }}>LOAN PURPOSE</p>
            <select
              value={form.loanPurpose}
              onChange={e => set("loanPurpose", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs outline-none border"
              style={{ ...inputStyle, borderColor: errors.loanPurpose ? "#A82F2F" : t.borderMid }}>
              <option value="">-- Select purpose (required for credit scoring) --</option>
              {LOAN_PURPOSES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {errors.loanPurpose && (
              <p className="text-xs mt-1" style={{ color: "var(--danger-fg)", fontFamily: mono }}>
                {errors.loanPurpose}
              </p>
            )}
            <p className="text-xs mt-1.5" style={{ color: t.textFaint, fontFamily: mono }}>
              ? This is used in the credit scoring system
            </p>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ fontFamily: mono, color: t.textFaint }}>CLIENT NOTES</p>
            <textarea
              rows={3}
              value={form.clientNotes}
              onChange={e => set("clientNotes", e.target.value)}
              placeholder="Any additional notes about this client..."
              className="w-full px-4 py-2.5 rounded-xl text-xs outline-none border resize-none"
              style={inputStyle}
            />
          </div>

          {/* Waitlist Fields */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ fontFamily: mono, color: t.textFaint }}>WAITLIST DETAILS</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: mono, color: t.textMuted }}>Date Needed</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: t.textFaint }} />
                  <input type="date" value={form.dateNeeded} onChange={e => set("dateNeeded", e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none border"
                    style={{ background: t.bgInput, borderColor: t.borderMid, color: t.text, fontFamily: mono }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: mono, color: t.textMuted }}>Amount Needed (KES)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: t.textFaint }} />
                  <input type="number" value={form.amountNeeded} onChange={e => set("amountNeeded", e.target.value)}
                    placeholder="0" className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none border"
                    style={{ background: t.bgInput, borderColor: t.borderMid, color: t.text, fontFamily: mono }} />
                </div>
              </div>
            </div>
          </div>

          {/* Client Flags */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ fontFamily: mono, color: t.textFaint }}>CLIENT FLAGS</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(FLAG_META) as ClientFlag[]).map(f => {
                const active = form.clientFlags.includes(f);
                return (
                  <button key={f}
                    onClick={() => set("clientFlags", active
                      ? form.clientFlags.filter(x => x !== f)
                      : [...form.clientFlags, f]
                    )}
                    className="flex items-center gap-1 px-3 py-2 rounded-full border text-xs font-bold transition-all"
                    style={{
                      fontFamily: mono, minHeight: "32px",
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

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t shrink-0"
          style={{ background: t.bgCard, borderColor: t.border, maxHeight: "90vh" }}>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border text-xs font-bold"
            style={{ fontFamily: mono, background: t.bgBtn, borderColor: t.border, color: t.textMuted }}>
            CANCEL
          </button>
          <button onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold"
            style={{ fontFamily: mono, background: "var(--primary)", color: "var(--primary-foreground)" }}><UserPlus className="w-3.5 h-3.5" />
            REGISTER CLIENT
          </button>
        </div>
      </div>
    </div>
  );
};

// -- PORTFOLIO SUMMARY PANEL ---------------------------------------------------
export const ClientsPage: React.FC<ClientsPageProps> = ({ loans, theme: t, onUpdateLoan, onEditClient, onRecordPayment, onNewAgreement }) => {
  const { setSelectedClient } = useLoanStore();
  const [search, setSearch]           = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editMode, setEditMode]       = useState(false);
  const [filterFlag, setFilterFlag]   = useState<ClientFlag | "All">("All");
  const [editData, setEditData]       = useState<Partial<Loan>>({});
  const [showNewClient, setShowNewClient] = useState(false);

  const mono = "var(--font-mono)";
  const grouped = useMemo(() => groupByBorrower(loans), [loans]);

  const clients = useMemo(() => {
    return Object.entries(grouped)
      .map(([key, clientLoans]) => {
        const latest = clientLoans[0];
        const stats  = getBorrowerStats(clientLoans);
        return { key, loans: clientLoans, latest, stats };
      })
      .filter(c => {
        const matchSearch =
          c.latest.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
          c.latest.borrowerPhone.includes(search) ||
          (c.latest.borrowerEmail || "").toLowerCase().includes(search.toLowerCase());
        const matchFlag = filterFlag === "All" || (c.latest.clientFlags || []).includes(filterFlag);
        return matchSearch && matchFlag;
      })
      .sort((a, b) => a.latest.borrowerName.localeCompare(b.latest.borrowerName));
  }, [grouped, search, filterFlag]);

  const selected       = selectedKey ? grouped[selectedKey] : null;
  const selectedLatest = selected ? selected[0] : null;

  const handleEdit = () => {
    if (!selectedLatest) return;
    setEditData({ borrowerName: selectedLatest.borrowerName || "", borrowerPhone: selectedLatest.borrowerPhone || "", occupation: selectedLatest.occupation || "", kraPin: selectedLatest.kraPin || "", borrowerAddress:  selectedLatest.borrowerAddress  || "",
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
    const nm = (editData.borrowerName || "").trim(); const ph = (editData.borrowerPhone || "").trim(); if (!nm || !ph) { alert("Name and phone are required"); return; } const next = { ...editData, borrowerName: nm, borrowerPhone: ph }; selected.forEach(l => onUpdateLoan(l.id, next)); setSelectedKey(ph); if (selectedLatest) setSelectedClient({ ...selectedLatest, ...next });
    setEditMode(false);
  };

  const toggleFlag = (flag: ClientFlag) => {
    const current = (editData.clientFlags || []) as ClientFlag[];
    setEditData(prev => ({
      ...prev,
      clientFlags: current.includes(flag) ? current.filter(f => f !== flag) : [...current, flag],
    }));
  };

  const flagCounts = useMemo(() => {
    const counts: Record<string, number> = { All: Object.keys(grouped).length };
    (Object.keys(FLAG_META) as ClientFlag[]).forEach(f => {
      counts[f] = loans.filter(l => (l.clientFlags || []).includes(f)).length;
    });
    return counts;
  }, [grouped, loans]);

  const isMobileDetail = selectedKey !== null;

  return (
    <div className="flex flex-col lg:flex-row flex-1 w-full min-w-0 min-h-[calc(100vh-56px)]" style={{ background: t.bg }}>

      {/* NEW CLIENT MODAL */}
      {showNewClient && (
        <NewClientModal
          theme={t}
          onClose={() => setShowNewClient(false)}
          onSave={() => setShowNewClient(false)}
        />
      )}

      {/* LEFT  CLIENT LIST */}
      <div
        className={`flex flex-col border-r shrink-0 ${isMobileDetail ? "hidden lg:flex" : "flex"} w-full lg:w-[340px] lg:min-w-[300px] lg:max-w-[360px]`}
        style={{ borderColor: t.border, background: t.bg }}>

        <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: t.border }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>CLIENTS</h2>
              <p className="text-xs mt-0.5" style={{ color: t.textFaint }}>{clients.length} BORROWERS</p>
            </div>
            <button
              onClick={() => setShowNewClient(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ fontFamily: mono, background: "var(--primary)", color: "var(--primary-foreground)" }}><UserPlus className="w-3.5 h-3.5" />
              NEW
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-3"
            style={{ background: t.bgInput, borderColor: t.borderMid }}>
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: t.textFaint }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, phone..."
              className="flex-1 bg-transparent text-xs outline-none min-w-0"
              style={{ color: t.text, fontFamily: mono }}
            />
            {search && (
              <button onClick={() => setSearch("")}><X className="w-3 h-3" style={{ color: t.textFaint }} /></button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
            {(["All", ...Object.keys(FLAG_META)] as (ClientFlag | "All")[]).map(f => (
              <button key={f} onClick={() => setFilterFlag(f)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border whitespace-nowrap text-xs font-bold transition-all shrink-0"
                style={{
                  fontFamily: mono, minHeight: "28px",
                  background:  filterFlag === f ? (f === "All" ? "#111214" : FLAG_META[f as ClientFlag].bg)     : t.bgCard,
                  borderColor: filterFlag === f ? (f === "All" ? "#111214" : FLAG_META[f as ClientFlag].border) : t.border,
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
            clients.map(c => {
              const flags      = c.latest.clientFlags || [];
              const isActive   = selectedKey === c.key;
              const hasOverdue = c.loans.some(l => l.status === "Overdue");
              return (
                <button key={c.key}
                  onClick={() => { setSelectedKey(c.key); setEditMode(false); setSelectedClient(c.latest); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-b text-left transition-colors cursor-pointer hover:bg-[var(--bg-active)]"
                  style={{
                    background:  isActive ? t.bgActive : "transparent",
                    borderColor: t.border,
                    borderLeft:  isActive ? "3px solid #111214" : "3px solid transparent",
                  }}>

                  {/* Avatar  show photo if available */}
                  <div className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0 overflow-hidden"
                    style={{
                      background:  hasOverdue ? "rgba(248,113,113,0.15)" : t.bgActive,
                      borderColor: hasOverdue ? "rgba(248,113,113,0.4)"  : t.borderMid,
                    }}>
                    {c.latest.borrowerPhoto ? (
                      <img src={c.latest.borrowerPhoto} alt={c.latest.borrowerName}
                        className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold" style={{ fontFamily: mono, color: hasOverdue ? "#A82F2F" : t.text }}>
                        {c.latest.borrowerName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-xs font-bold truncate" style={{ color: t.text }}>{c.latest.borrowerName}</p>
                      {flags.includes("VIP") && <Star className="w-3 h-3 shrink-0" style={{ color: "var(--warning-fg)" }} />}
                      {flags.includes("Risk") && <ShieldAlert className="w-3 h-3 shrink-0" style={{ color: "var(--risk-fg)" }} />}
                      {flags.includes("Blacklisted") && <UserX className="w-3 h-3 shrink-0" style={{ color: "var(--blacklisted-fg)" }} />}
                    </div>
                    <p className="text-xs truncate" style={{ color: t.textFaint, fontFamily: mono }}>
                      {c.latest.borrowerPhone}  {c.loans.length} LOAN{c.loans.length > 1 ? "S" : ""}
                    </p>
                    <p className="text-xs" style={{ color: "var(--foreground)", fontFamily: mono }}>
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

      {/* RIGHT  EMPTY STATE (no client selected) */}
      {!selected && (
        <div className="hidden lg:flex flex-1 items-center justify-center" style={{ background: t.bgCard }}>
          <p className="text-xs uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>
            Select a client to view their profile
          </p>
        </div>
      )}

      {/* RIGHT  CLIENT PROFILE (client selected) */}
      {selected && selectedLatest && (
        <div className="flex flex-col flex-1 w-full lg:overflow-hidden" style={{ background: t.bgCard }}>

          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 py-3 border-b shrink-0 gap-2" style={{ borderColor: t.border }}>
            <button onClick={() => { setSelectedKey(null); setEditMode(false); }}
              className="flex lg:hidden items-center justify-center w-8 h-8 rounded-xl border shrink-0"
              style={{ background: t.bgBtn, borderColor: t.border, color: t.textFaint }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <p className="text-[10px] uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>
              {editMode ? "Editing client" : "Profile"}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {!editMode ? (
                <button onClick={handleEdit}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold"
                  style={{ fontFamily: mono, background: t.bgBtn, borderColor: t.border, color: t.textMuted }}>
                  <Edit3 className="w-3.5 h-3.5" /><span className="hidden sm:inline">EDIT</span>
                </button>
              ) : (
                <>
                  <button onClick={() => setEditMode(false)}
                    className="px-3 py-2 rounded-xl border text-xs font-bold"
                    style={{ fontFamily: mono, background: t.bgBtn, borderColor: t.border, color: t.textMuted }}>
                    CANCEL
                  </button>
                  <button onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                    style={{ fontFamily: mono, background: "#111214", color: "#fff" }}>
                    <Save className="w-3.5 h-3.5" />SAVE
                  </button>
                </>
              )}
              <button onClick={() => { setSelectedKey(null); setEditMode(false); setSelectedClient(null); }}
                className="flex items-center justify-center p-2 rounded-xl border"
                style={{ background: t.bgBtn, borderColor: t.border, color: t.textFaint }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 px-3 py-3 sm:px-5 sm:py-5 lg:overflow-y-auto">
            {editMode ? (
              <ClientInfoCard
                client={selectedLatest}
                editMode={editMode}
                editData={editData}
                onChange={(k, v) => setEditData((p) => ({ ...p, [k]: v } as Partial<Loan>))}
                onToggleFlag={toggleFlag}
                onEdit={handleEdit}
                onCancel={() => setEditMode(false)}
                onSave={handleSave}
                flagMeta={FLAG_META}
              />
            ) : (
              <ClientProfilePanel
                client={selectedLatest}
                allLoans={loans}
                theme={t}
                onRecordPayment={onRecordPayment}
                onNewAgreement={onNewAgreement}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};











