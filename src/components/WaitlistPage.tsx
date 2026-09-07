import React, { useState } from "react";
import { Clock, UserPlus, CheckCircle, XCircle, Trash2, ChevronDown, DollarSign, ArrowRight } from "lucide-react";
import { useLoanStore } from "../store/loanStore";
import { WishlistEntry, LoanPurpose } from "../types";
import { formatCompactCurrency } from "../utils/loanCalculations";

const LOAN_PURPOSES: LoanPurpose[] = [
  "Business Capital","School Fees","Medical Emergency","Land/Property",
  "Agriculture","Home Improvement","Debt Consolidation","Electronics/Assets",
  "Personal Use","Other",
];

interface WaitlistPageProps { theme: any; onPromoteToLoan?: (entry: WishlistEntry) => void; }

export const WaitlistPage: React.FC<WaitlistPageProps> = ({ theme: t, onPromoteToLoan }) => {
  const { waitlist, addToWaitlist, removeFromWaitlist, updateWaitlistStatus, updateWaitlistAmount } = useLoanStore();
  const mono = "'Space Mono', monospace";

  const [showForm, setShowForm]         = useState(false);
  const [amountEntry, setAmountEntry]   = useState<{ id: string; value: string } | null>(null);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", occupation: "",
    purpose: "" as LoanPurpose | "",
    dateNeeded: "", notes: "",
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleAdd = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      alert("Name and phone are required"); return;
    }
    addToWaitlist({
      name:         form.name.trim(),
      phone:        form.phone.trim(),
      email:        form.email.trim(),
      occupation:   form.occupation.trim(),
      amountNeeded: 0,
      purpose:      (form.purpose || "Personal Use") as LoanPurpose,
      dateNeeded:   form.dateNeeded,
      notes:        form.notes.trim(),
    });
    setForm({ name:"", phone:"", email:"", occupation:"", purpose:"", dateNeeded:"", notes:"" });
    setShowForm(false);
  };

  const handleRecordAmount = (id: string) => {
    const val = parseFloat(amountEntry?.value || "0");
    if (!val || val <= 0) { alert("Enter a valid amount"); return; }
    updateWaitlistAmount(id, val);
    setAmountEntry(null);
  };

  const stageMeta = {
    Enquiry:  { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.30)", label: "ENQUIRY"  },
    Pending:  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.30)",  label: "PENDING"  },
    Approved: { color: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.30)",  label: "APPROVED" },
    Rejected: { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.30)", label: "REJECTED" },
  };

  const enquiries = waitlist.filter((e) => e.status === "Enquiry");
  const pending   = waitlist.filter((e) => e.status === "Pending");
  const approved  = waitlist.filter((e) => e.status === "Approved");

  const inputStyle = { background: t.bgInput, borderColor: t.border, color: t.text, fontFamily: mono };
  const labelStyle = { fontFamily: mono, color: t.textFaint };

  const renderEntry = (entry: WishlistEntry) => {
    const meta = stageMeta[entry.status];
    const isRecordingAmount = amountEntry?.id === entry.id;

    return (
      <div key={entry.id} className="rounded-2xl border p-4"
        style={{ background: t.bgCard, borderColor: t.border }}>

        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0"
              style={{ background: meta.bg, borderColor: meta.border }}>
              <span className="text-sm font-bold" style={{ fontFamily: mono, color: meta.color }}>
                {entry.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate" style={{ fontFamily: mono, color: t.text }}>{entry.name}</p>
              <p className="text-[10px]" style={{ color: t.textFaint, fontFamily: mono }}>{entry.phone}</p>
              {entry.occupation && <p className="text-[10px]" style={{ color: t.textFaint }}>{entry.occupation}</p>}
            </div>
          </div>
          <span className="text-[9px] font-bold px-2.5 py-1 rounded-full border shrink-0"
            style={{ fontFamily: mono, color: meta.color, background: meta.bg, borderColor: meta.border }}>
            {meta.label}
          </span>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {[
            { label: "AMOUNT",     value: entry.amountNeeded > 0 ? formatCompactCurrency(entry.amountNeeded) : "NOT SET" },
            { label: "PURPOSE",    value: entry.purpose || "—" },
            { label: "DATE NEEDED",value: entry.dateNeeded || "—" },
            { label: "REGISTERED", value: entry.dateRegistered },
          ].map((s) => (
            <div key={s.label} className="p-2.5 rounded-xl border"
              style={{ background: t.bgActive, borderColor: t.border }}>
              <p className="text-[9px] uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>{s.label}</p>
              <p className="text-[10px] font-bold mt-0.5 truncate"
                style={{ fontFamily: mono, color: s.label === "AMOUNT" && entry.amountNeeded === 0 ? "#f87171" : t.text }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {entry.notes && (
          <p className="text-[10px] mt-3 px-1" style={{ color: t.textFaint }}>{entry.notes}</p>
        )}

        {/* Stage 1 — Enquiry: record amount to move to Pending */}
        {entry.status === "Enquiry" && (
          <div className="mt-4 pt-3 border-t" style={{ borderColor: t.border }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-2"
              style={{ fontFamily: mono, color: "#a78bfa" }}>
              WAITING FOR CLIENT TO STATE AMOUNT
            </p>
            {isRecordingAmount ? (
              <div className="flex items-center gap-2">
                <input
                  type="number" min="500" step="500"
                  placeholder="Enter amount (KES)"
                  value={amountEntry.value}
                  onChange={(e) => setAmountEntry({ id: entry.id, value: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none"
                  style={inputStyle}
                  autoFocus
                />
                <button onClick={() => handleRecordAmount(entry.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold"
                  style={{ fontFamily: mono, background: "#a78bfa", color: "#fff" }}>
                  <ArrowRight className="w-3 h-3" /> CONFIRM
                </button>
                <button onClick={() => setAmountEntry(null)}
                  className="px-3 py-2 rounded-xl text-[10px] font-bold"
                  style={{ fontFamily: mono, background: t.bgBtn, color: t.textMuted, border: `1px solid ${t.border}` }}>
                  CANCEL
                </button>
              </div>
            ) : (
              <button onClick={() => setAmountEntry({ id: entry.id, value: "" })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold"
                style={{ fontFamily: mono, background: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
                <DollarSign className="w-3 h-3" /> RECORD AMOUNT
              </button>
            )}
          </div>
        )}

        {/* Stage 2 — Pending: approve or reject */}
        {entry.status === "Pending" && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t" style={{ borderColor: t.border }}>
            <button onClick={() => updateWaitlistStatus(entry.id, "Approved")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold"
              style={{ fontFamily: mono, background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" }}>
              <CheckCircle className="w-3 h-3" /> APPROVE
            </button>
            <button onClick={() => updateWaitlistStatus(entry.id, "Rejected")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold"
              style={{ fontFamily: mono, background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>
              <XCircle className="w-3 h-3" /> REJECT
            </button>
            <button onClick={() => removeFromWaitlist(entry.id)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold"
              style={{ fontFamily: mono, background: t.bgBtn, color: t.textFaint, border: `1px solid ${t.border}` }}>
              <Trash2 className="w-3 h-3" /> REMOVE
            </button>
          </div>
        )}

        {/* Stage 3 — Approved: issue loan */}
        {entry.status === "Approved" && onPromoteToLoan && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t" style={{ borderColor: t.border }}>
            <button onClick={() => { onPromoteToLoan(entry); removeFromWaitlist(entry.id); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold"
              style={{ fontFamily: mono, background: "#5b7cfa", color: "#fff" }}>
              <ArrowRight className="w-3 h-3" /> ISSUE LOAN — MOVE TO BORROWERS
            </button>
            <button onClick={() => removeFromWaitlist(entry.id)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold"
              style={{ fontFamily: mono, background: t.bgBtn, color: t.textFaint, border: `1px solid ${t.border}` }}>
              <Trash2 className="w-3 h-3" /> REMOVE
            </button>
          </div>
        )}

        {entry.status === "Rejected" && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t" style={{ borderColor: t.border }}>
            <button onClick={() => removeFromWaitlist(entry.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold"
              style={{ fontFamily: mono, background: t.bgBtn, color: t.textFaint, border: `1px solid ${t.border}` }}>
              <Trash2 className="w-3 h-3" /> REMOVE
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ background: t.bg }}>

      {/* Header */}
      <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: t.border }}>
        <div>
          <h2 className="text-sm font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>WAITLIST</h2>
          <p className="text-[10px] mt-0.5" style={{ color: t.textFaint, fontFamily: mono }}>
            {enquiries.length} ENQUIRY · {pending.length} PENDING · {approved.length} APPROVED
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
          style={{ fontFamily: mono, background: "#5b7cfa", color: "#fff" }}>
          <UserPlus className="w-3.5 h-3.5" /> ADD CLIENT
        </button>
      </div>

      {/* Add form — no amount field, client hasn't said yet */}
      {showForm && (
        <div className="px-6 py-5 border-b" style={{ borderColor: t.border, background: t.bgCard }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
            style={{ fontFamily: mono, color: t.textFaint }}>NEW ENQUIRY</p>
          <p className="text-[10px] mb-4" style={{ fontFamily: mono, color: "#a78bfa" }}>
            Register the client first. Amount will be recorded once they confirm what they need.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {[
              { label:"Full Name *", key:"name",       type:"text"  },
              { label:"Phone *",     key:"phone",      type:"tel"   },
              { label:"Email",       key:"email",      type:"email" },
              { label:"Occupation",  key:"occupation", type:"text"  },
              { label:"Date Needed", key:"dateNeeded", type:"date"  },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                  style={inputStyle} />
              </div>
            ))}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>PURPOSE (OPTIONAL)</label>
              <div className="relative">
                <select value={form.purpose} onChange={(e) => set("purpose", e.target.value)}
                  className="w-full px-3 py-2 pr-8 rounded-xl text-xs border focus:outline-none appearance-none"
                  style={inputStyle}>
                  <option value="">-- Select if known --</option>
                  {LOAN_PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textMuted }} />
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>NOTES</label>
            <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none resize-none"
              style={inputStyle} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{ fontFamily: mono, background: t.bgBtn, color: t.textMuted, border: `1px solid ${t.border}` }}>
              CANCEL
            </button>
            <button onClick={handleAdd}
              className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{ fontFamily: mono, background: "#5b7cfa", color: "#fff" }}>
              REGISTER CLIENT
            </button>
          </div>
        </div>
      )}

      {/* Pipeline stages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* Stage 1 */}
        {enquiries.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: "#a78bfa" }} />
              <p className="text-[10px] font-bold uppercase tracking-widest"
                style={{ fontFamily: mono, color: "#a78bfa" }}>
                STAGE 1 — ENQUIRY ({enquiries.length}) · AWAITING AMOUNT
              </p>
            </div>
            <div className="space-y-3">{enquiries.map(renderEntry)}</div>
          </div>
        )}

        {/* Stage 2 */}
        {pending.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} />
              <p className="text-[10px] font-bold uppercase tracking-widest"
                style={{ fontFamily: mono, color: "#f59e0b" }}>
                STAGE 2 — PENDING APPROVAL ({pending.length})
              </p>
            </div>
            <div className="space-y-3">{pending.map(renderEntry)}</div>
          </div>
        )}

        {/* Stage 3 */}
        {approved.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: "#4ade80" }} />
              <p className="text-[10px] font-bold uppercase tracking-widest"
                style={{ fontFamily: mono, color: "#4ade80" }}>
                STAGE 3 — APPROVED · READY TO ISSUE ({approved.length})
              </p>
            </div>
            <div className="space-y-3">{approved.map(renderEntry)}</div>
          </div>
        )}

        {waitlist.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Clock className="w-10 h-10" style={{ color: t.textFaint }} />
            <p className="text-xs font-bold" style={{ fontFamily: mono, color: t.textFaint }}>NO CLIENTS IN PIPELINE</p>
            <p className="text-[10px] text-center" style={{ color: t.textFaint, fontFamily: mono }}>
              Add a client above. They start as an Enquiry until they confirm their loan amount.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
