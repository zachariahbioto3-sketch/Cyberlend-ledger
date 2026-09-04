import React, { useState, useEffect } from "react";
import { X, Target } from "lucide-react";
import { Goals } from "../types";

interface GoalsModalProps {
  isOpen:  boolean;
  onClose: () => void;
  goals:   Goals;
  onSave:  (g: Goals) => void;
  theme:   any;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({ isOpen, onClose, goals, onSave, theme: t }) => {
  const mono = "'Space Mono', monospace";
  const [form, setForm] = useState<Goals>(goals);

  useEffect(() => { if (isOpen) setForm(goals); }, [isOpen, goals]);

  if (!isOpen) return null;

  const set = (k: keyof Goals, v: number) => setForm((p) => ({ ...p, [k]: v }));
  const handleSave = () => { onSave(form); onClose(); };

  const fields: { label: string; key: keyof Goals; prefix?: string; suffix?: string; hint: string }[] = [
    { label: "TARGET PORTFOLIO SIZE",  key: "targetPortfolioSize", prefix: "KES", hint: "Total outstanding principal target"   },
    { label: "TARGET CLIENT COUNT",    key: "targetClientCount",                   hint: "Number of active borrowers goal"      },
    { label: "TARGET MONTHLY RETURN",  key: "targetMonthlyReturn", prefix: "KES", hint: "Monthly interest income target"       },
    { label: "TARGET RETURN RATE",     key: "targetReturnRate",    suffix: "%",   hint: "Annual return rate on portfolio"      },
  ];

  const inputStyle = { background: t.bgInput, borderColor: t.border, color: t.text, fontFamily: mono };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-3xl border overflow-hidden"
        style={{ background: t.bgModal, borderColor: t.border }}>

        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(91,124,250,0.15)" }}>
              <Target className="w-4 h-4" style={{ color: "#5b7cfa" }} />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>EDIT GOALS</h2>
              <p className="text-[10px]" style={{ color: t.textFaint, fontFamily: mono }}>Set portfolio targets</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl" style={{ background: t.bgBtn }}>
            <X className="w-4 h-4" style={{ color: t.textMuted }} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-[9px] font-bold uppercase tracking-widest mb-1"
                style={{ fontFamily: mono, color: t.textFaint }}>{f.label}</label>
              <div className="relative flex items-center">
                {f.prefix && (
                  <span className="absolute left-3 text-[10px] font-bold pointer-events-none"
                    style={{ fontFamily: mono, color: t.textMuted }}>{f.prefix}</span>
                )}
                <input type="number" min={0} value={form[f.key]}
                  onChange={(e) => set(f.key, Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none"
                  style={{ ...inputStyle, paddingLeft: f.prefix ? "3rem" : "0.75rem", paddingRight: f.suffix ? "2.5rem" : "0.75rem" }} />
                {f.suffix && (
                  <span className="absolute right-3 text-[10px] font-bold pointer-events-none"
                    style={{ fontFamily: mono, color: t.textMuted }}>{f.suffix}</span>
                )}
              </div>
              <p className="text-[9px] mt-1" style={{ color: t.textFaint, fontFamily: mono }}>{f.hint}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end px-6 py-4 border-t" style={{ borderColor: t.border }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{ fontFamily: mono, background: t.bgBtn, color: t.textMuted, border: `1px solid ${t.border}` }}>
            CANCEL
          </button>
          <button onClick={handleSave} className="px-5 py-2 rounded-xl text-xs font-bold"
            style={{ fontFamily: mono, background: "#5b7cfa", color: "#fff" }}>
            SAVE GOALS
          </button>
        </div>
      </div>
    </div>
  );
};
