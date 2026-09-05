import React, { useState } from "react";
import { Clock, UserPlus, CheckCircle, XCircle, Trash2, ChevronDown } from "lucide-react";
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
  const { waitlist, addToWaitlist, removeFromWaitlist, updateWaitlistStatus } = useLoanStore();
  const mono = "'Space Mono', monospace";

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", occupation: "",
    amountNeeded: 5000, purpose: "" as LoanPurpose | "",
    dateNeeded: "", notes: "",
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleAdd = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.purpose) {
      alert("Name, phone and purpose are required"); return;
    }
    addToWaitlist({
      name:         form.name.trim(),
      phone:        form.phone.trim(),
      email:        form.email.trim(),
      occupation:   form.occupation.trim(),
      amountNeeded: form.amountNeeded,
      purpose:      form.purpose as LoanPurpose,
      dateNeeded:   form.dateNeeded,
      notes:        form.notes.trim(),
    });
    setForm({ name:"", phone:"", email:"", occupation:"", amountNeeded:5000, purpose:"", dateNeeded:"", notes:"" });
    setShowForm(false);
  };

  const statusColor = (s: WishlistEntry["status"]) =>
    s === "Approved" ? "#4ade80" : s === "Rejected" ? "#f87171" : "#f59e0b";
  const statusBg    = (s: WishlistEntry["status"]) =>
    s === "Approved" ? "rgba(74,222,128,0.12)" : s === "Rejected" ? "rgba(248,113,113,0.12)" : "rgba(245,158,11,0.12)";

  const inputStyle = { background: t.bgInput, borderColor: t.border, color: t.text, fontFamily: mono };
  const labelStyle = { fontFamily: mono, color: t.textFaint };

  const pending  = waitlist.filter((e) => e.status === "Pending").length;
  const approved = waitlist.filter((e) => e.status === "Approved").length;

  return (
    <div className="flex flex-col h-full" style={{ background: t.bg }}>

      {/* Header */}
      <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: t.border }}>
        <div>
          <h2 className="text-sm font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>WAITLIST</h2>
          <p className="text-[10px] mt-0.5" style={{ color: t.textFaint, fontFamily: mono }}>
            {pending} PENDING · {approved} APPROVED
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
          style={{ fontFamily: mono, background: "#5b7cfa", color: "#fff" }}>
          <UserPlus className="w-3.5 h-3.5" />
          ADD TO WAITLIST
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="px-6 py-5 border-b" style={{ borderColor: t.border, background: t.bgCard }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4"
            style={{ fontFamily: mono, color: t.textFaint }}>NEW WAITLIST ENTRY</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {[
              { label:"Full Name *",   key:"name",       type:"text"   },
              { label:"Phone *",       key:"phone",      type:"tel"    },
              { label:"Email",         key:"email",      type:"email"  },
              { label:"Occupation",    key:"occupation", type:"text"   },
              { label:"Date Needed",   key:"dateNeeded", type:"date"   },
              { label:"Amount Needed", key:"amountNeeded",type:"number"},
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]}
                  onChange={(e) => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                  style={inputStyle} />
              </div>
            ))}
          </div>
          <div className="mb-3">
            <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>PURPOSE *</label>
            <div className="relative">
              <select value={form.purpose} onChange={(e) => set("purpose", e.target.value)}
                className="w-full px-3 py-2 pr-8 rounded-xl text-xs border focus:outline-none appearance-none"
                style={inputStyle}>
                <option value="">-- Select purpose --</option>
                {LOAN_PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textMuted }} />
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
              SAVE ENTRY
            </button>
          </div>
        </div>
      )}

      {/* Waitlist entries */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {waitlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Clock className="w-10 h-10" style={{ color: t.textFaint }} />
            <p className="text-xs font-bold" style={{ fontFamily: mono, color: t.textFaint }}>NO ENTRIES YET</p>
            <p className="text-[10px]" style={{ color: t.textFaint, fontFamily: mono }}>
              Clients who need a loan but are not yet approved appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {waitlist
              .slice()
              .sort((a, b) => b.dateRegistered.localeCompare(a.dateRegistered))
              .map((entry) => (
              <div key={entry.id} className="rounded-2xl border p-4"
                style={{ background: t.bgCard, borderColor: t.border }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0"
                      style={{ background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.3)" }}>
                      <span className="text-sm font-bold" style={{ fontFamily: mono, color: "#f59e0b" }}>
                        {entry.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ fontFamily: mono, color: t.text }}>{entry.name}</p>
                      <p className="text-[10px]" style={{ color: t.textFaint, fontFamily: mono }}>{entry.phone}</p>
                      {entry.occupation && (
                        <p className="text-[10px]" style={{ color: t.textFaint }}>{entry.occupation}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-bold px-2.5 py-1 rounded-full border"
                      style={{ fontFamily: mono, color: statusColor(entry.status), background: statusBg(entry.status), borderColor: statusBg(entry.status) }}>
                      {entry.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {[
                    { label:"AMOUNT NEEDED",  value: formatCompactCurrency(entry.amountNeeded) },
                    { label:"PURPOSE",         value: entry.purpose },
                    { label:"DATE NEEDED",     value: entry.dateNeeded || "—" },
                    { label:"REGISTERED",      value: entry.dateRegistered },
                  ].map((s) => (
                    <div key={s.label} className="p-2.5 rounded-xl border"
                      style={{ background: t.bgActive, borderColor: t.border }}>
                      <p className="text-[9px] uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>{s.label}</p>
                      <p className="text-[10px] font-bold mt-0.5" style={{ fontFamily: mono, color: t.text }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {entry.notes && (
                  <p className="text-[10px] mt-3 px-1" style={{ color: t.textFaint }}>{entry.notes}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t" style={{ borderColor: t.border }}>
                  {entry.status === "Pending" && (
                    <>
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
                    </>
                  )}
                  {entry.status === "Approved" && onPromoteToLoan && (
                    <button onClick={() => onPromoteToLoan(entry)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold"
                      style={{ fontFamily: mono, background: "rgba(91,124,250,0.12)", color: "#5b7cfa", border: "1px solid rgba(91,124,250,0.3)" }}>
                      ISSUE LOAN
                    </button>
                  )}
                  <button onClick={() => removeFromWaitlist(entry.id)}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold"
                    style={{ fontFamily: mono, background: t.bgBtn, color: t.textFaint, border: `1px solid ${t.border}` }}>
                    <Trash2 className="w-3 h-3" /> REMOVE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
