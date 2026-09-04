import React, { useState } from "react";
import { Target, X, ChevronUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Goals, Loan, PortfolioMetrics } from "../types";
import { formatCompactCurrency } from "../utils/loanCalculations";

interface GoalDrawerProps {
  goals:   Goals;
  metrics: PortfolioMetrics;
  loans:   Loan[];
  theme:   any;
  onEdit:  () => void;
}

export const GoalDrawer: React.FC<GoalDrawerProps> = ({ goals, metrics, loans, theme: t, onEdit }) => {
  const [open, setOpen] = useState(false);
  const mono = "'Space Mono', monospace";
  const isDark = t.text !== "#0f1117";

  const activeLoans     = loans.filter((l) => l.status === "Active" || l.status === "Overdue");
  const uniqueClients   = new Set(activeLoans.map((l) => l.borrowerPhone)).size;
  const monthlyInterest = activeLoans.reduce((s, l) => s + l.monthlyInterest, 0);
  const returnRate      = metrics.totalPrincipalLent > 0
    ? (metrics.totalProfit / metrics.totalPrincipalLent) * 100 : 0;

  const trackers = [
    { label: "PORTFOLIO",  current: metrics.totalOutstanding, target: goals.targetPortfolioSize, display: formatCompactCurrency(metrics.totalOutstanding), goal: formatCompactCurrency(goals.targetPortfolioSize) },
    { label: "CLIENTS",    current: uniqueClients,            target: goals.targetClientCount,   display: String(uniqueClients),                           goal: String(goals.targetClientCount) },
    { label: "MTH RETURN", current: monthlyInterest,          target: goals.targetMonthlyReturn, display: formatCompactCurrency(monthlyInterest),           goal: formatCompactCurrency(goals.targetMonthlyReturn) },
    { label: "RETURN RATE",current: returnRate,               target: goals.targetReturnRate,    display: returnRate.toFixed(1) + "%",                     goal: goals.targetReturnRate + "%" },
  ];

  const pct       = (c: number, tgt: number) => Math.min(100, tgt > 0 ? (c / tgt) * 100 : 0);
  const fillColor = (p: number) => p >= 90 ? "#4ade80" : p >= 60 ? "#f59e0b" : "#f87171";
  const rimColor  = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const noGoals   = goals.targetPortfolioSize === 0 && goals.targetClientCount === 0;

  // Best single metric for the pin badge
  const bestPct = noGoals ? null : Math.round(
    trackers.reduce((s, tr) => s + pct(tr.current, tr.target), 0) / trackers.length
  );
  const badgeColor = bestPct === null ? "#5b7cfa" : fillColor(bestPct);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div
        className="md:hidden fixed left-0 right-0 z-50 rounded-t-3xl border-t border-x"
        style={{
          bottom: 0,
          background: t.bgModal,
          borderColor: t.borderMid,
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)",
          maxHeight: "82vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Drag handle + header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0" style={{ borderBottom: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" style={{ color: "#5b7cfa" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>GOAL TRACKER</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit}
              className="text-[9px] font-bold px-3 py-1 rounded-lg border"
              style={{ fontFamily: mono, borderColor: "rgba(91,124,250,0.30)", color: "#5b7cfa", background: "rgba(91,124,250,0.10)" }}>
              EDIT GOALS
            </button>
            <button onClick={() => setOpen(false)} style={{ color: t.textFaint }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 py-4">
          {noGoals ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Target className="w-8 h-8" style={{ color: t.textFaint }} />
              <p className="text-xs font-bold" style={{ fontFamily: mono, color: t.textFaint }}>NO GOALS SET YET</p>
              <p className="text-[10px]" style={{ color: t.textFaint, fontFamily: mono }}>Tap EDIT GOALS to define your targets</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {trackers.map((tr) => {
                const p    = pct(tr.current, tr.target);
                const fill = fillColor(p);
                const data = [{ value: p }, { value: Math.max(0, 100 - p) }];
                return (
                  <div key={tr.label} className="rounded-2xl border p-3 flex flex-col items-center"
                    style={{ background: t.bgCard, borderColor: t.border }}>
                    <p className="text-[8px] font-bold uppercase tracking-widest mb-2 text-center"
                      style={{ fontFamily: mono, color: t.textFaint }}>{tr.label}</p>
                    <div className="relative w-full" style={{ height: 100 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={40}
                            startAngle={90} endAngle={-270} paddingAngle={2} dataKey="value" strokeWidth={0}>
                            <Cell fill={fill} />
                            <Cell fill={rimColor} />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                        <p style={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: fill, lineHeight: 1 }}>{p.toFixed(0)}%</p>
                        <p style={{ fontFamily: mono, fontSize: 7, color: t.textFaint, letterSpacing: 1.5, marginTop: 3, textTransform: "uppercase" }}>
                          {p >= 90 ? "ON TRACK" : p >= 60 ? "CLOSE" : "BEHIND"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs font-bold mt-2" style={{ fontFamily: mono, color: fill }}>{tr.display}</p>
                    <p className="text-[9px]" style={{ color: t.textFaint, fontFamily: mono }}>/ {tr.goal}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating pin button ? always visible on mobile, sits above bottom nav */}
      <button
        className="md:hidden fixed z-40 flex items-center gap-1.5 px-3 py-2 rounded-full shadow-lg border"
        style={{
          bottom: "80px",
          right: "16px",
          background: t.bgCard,
          borderColor: badgeColor + "55",
          color: badgeColor,
          fontFamily: mono,
          fontSize: 10,
          fontWeight: 700,
          boxShadow: `0 4px 20px ${badgeColor}33`,
        }}
        onClick={() => setOpen(true)}
      >
        <Target className="w-3.5 h-3.5" />
        {bestPct !== null ? `${bestPct}%` : "GOALS"}
        <ChevronUp className="w-3 h-3" />
      </button>
    </>
  );
};
