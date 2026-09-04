import React, { useState, useEffect } from "react";
import { X, Edit3, Camera } from "lucide-react";
import { Loan, ClientFlag } from "../types";

interface ClientEditModalProps {
  isOpen:  boolean;
  onClose: () => void;
  loan:    Loan | null;
  onSave:  (updates: Partial<Loan>) => void;
  theme:   any;
}

const FLAG_OPTIONS: ClientFlag[] = ["VIP", "Blacklisted", "Defaulter", "New", "Regular"];

export const ClientEditModal: React.FC<ClientEditModalProps> = ({ isOpen, onClose, loan, onSave, theme: t }) => {
  const mono = "'Space Mono', monospace";
  const [form, setForm] = useState<Partial<Loan>>({});

  useEffect(() => {
    if (isOpen && loan) {
      setForm({
        borrowerName:     loan.borrowerName     || "",
        borrowerPhone:    loan.borrowerPhone    || "",
        borrowerEmail:    loan.borrowerEmail    || "",
        borrowerAddress:  loan.borrowerAddress  || "",
        borrowerIdNumber: loan.borrowerIdNumber || "",
        kraPin:           loan.kraPin           || "",
        occupation:       loan.occupation       || "",
        referralSource:   loan.referralSource   || "",
        clientNotes:      loan.clientNotes      || "",
        clientFlags:      loan.clientFlags      || [],
        borrowerPhoto:    loan.borrowerPhoto    || "",
        borrowerIdPhoto:  loan.borrowerIdPhoto  || "",
      });
    }
  }, [isOpen, loan]);

  
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen || !loan) return null;

  const set = (k: keyof Loan, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const toggleFlag = (f: ClientFlag) => {
    const current = (form.clientFlags || []) as ClientFlag[];
    set("clientFlags", current.includes(f) ? current.filter((x) => x !== f) : [...current, f]);
  };

  const handlePhoto = (key: "borrowerPhoto" | "borrowerIdPhoto", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set(key, reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.borrowerName?.trim()) { alert("Name is required"); return; }
    if (!form.borrowerPhone?.trim()) { alert("Phone is required"); return; }
    onSave(form);
    onClose();
  };

  const inputStyle = { background: t.bgInput, borderColor: t.border, color: t.text, fontFamily: mono };
  const labelStyle = { fontFamily: mono, color: t.textFaint };

  const FLAG_COLORS: Record<ClientFlag, string> = {
    VIP: "#f59e0b", Blacklisted: "#f87171", Defaulter: "#ef4444", New: "#5b7cfa", Regular: "#4ade80",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.70)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-3xl border overflow-hidden flex flex-col"
        style={{ background: t.bgModal, borderColor: t.border, maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-3">
            <Edit3 className="w-4 h-4" style={{ color: "#5b7cfa" }} />
            <div>
              <p className="text-xs font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>EDIT CLIENT</p>
              <p className="text-[10px]" style={{ color: t.textFaint, fontFamily: mono }}>{loan.borrowerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl" style={{ background: t.bgBtn }}>
            <X className="w-4 h-4" style={{ color: t.textMuted }} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-4">

          {/* Photos */}
          <div className="grid grid-cols-2 gap-3">
            {(["borrowerPhoto", "borrowerIdPhoto"] as const).map((key) => (
              <div key={key}>
                <label className="block text-[9px] font-bold uppercase tracking-widest mb-2" style={labelStyle}>
                  {key === "borrowerPhoto" ? "PROFILE PHOTO" : "ID PHOTO"}
                </label>
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border cursor-pointer"
                  style={{ height: 80, borderColor: t.border, background: t.bgActive, borderStyle: "dashed" }}>
                  {form[key] ? (
                    <img src={form[key] as string} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5" style={{ color: t.textFaint }} />
                      <span className="text-[9px]" style={{ fontFamily: mono, color: t.textFaint }}>UPLOAD</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(key, e)} />
                </label>
              </div>
            ))}
          </div>

          {/* Text fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "FULL NAME *",      key: "borrowerName",     type: "text"  },
              { label: "PHONE *",          key: "borrowerPhone",    type: "tel"   },
              { label: "EMAIL",            key: "borrowerEmail",    type: "email" },
              { label: "ADDRESS",          key: "borrowerAddress",  type: "text"  },
              { label: "ID NUMBER",        key: "borrowerIdNumber", type: "text"  },
              { label: "KRA PIN",          key: "kraPin",           type: "text"  },
              { label: "OCCUPATION",       key: "occupation",       type: "text"  },
              { label: "REFERRAL SOURCE",  key: "referralSource",   type: "text"  },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>{f.label}</label>
                <input type={f.type} value={(form as any)[f.key] || ""}
                  onChange={(e) => set(f.key as keyof Loan, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                  style={inputStyle} />
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>NOTES</label>
            <textarea rows={3} value={(form.clientNotes as string) || ""}
              onChange={(e) => set("clientNotes", e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none resize-none"
              style={inputStyle} />
          </div>

          {/* Flags */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest mb-2" style={labelStyle}>CLIENT FLAGS</label>
            <div className="flex flex-wrap gap-2">
              {FLAG_OPTIONS.map((f) => {
                const active = (form.clientFlags || []).includes(f);
                return (
                  <button key={f} onClick={() => toggleFlag(f)}
                    className="px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all"
                    style={{
                      fontFamily: mono,
                      background:  active ? `${FLAG_COLORS[f]}22` : t.bgBtn,
                      borderColor: active ? FLAG_COLORS[f]        : t.border,
                      color:       active ? FLAG_COLORS[f]        : t.textFaint,
                    }}>
                    {f}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end px-6 py-4 border-t shrink-0" style={{ borderColor: t.border }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{ fontFamily: mono, background: t.bgBtn, color: t.textMuted, border: `1px solid ${t.border}` }}>
            CANCEL
          </button>
          <button onClick={handleSave} className="px-5 py-2 rounded-xl text-xs font-bold"
            style={{ fontFamily: mono, background: "#5b7cfa", color: "#fff" }}>
            SAVE CHANGES
          </button>
        </div>
      </div>
    </div>
  );
};
