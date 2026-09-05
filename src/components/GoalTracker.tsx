import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Target } from "lucide-react";
import { Goals, Loan, PortfolioMetrics } from "../types";
import { formatCompactCurrency } from "../utils/loanCalculations";

interface GoalTrackerProps {
  goals:   Goals;
  metrics: PortfolioMetrics;
  loans:   Loan[];
  theme:   any;
  onEdit:  () => void;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({ goals, metrics, loans, theme: t, onEdit }) => {
  const mono = "'Space Mono', monospace";
  const isDark = t.text !== "#0f1117";

  const activeLoans     = loans.filter((l) => l.status === "Active" || l.status === "Overdue");
  const uniqueClients   = new Set(activeLoans.map((l) => l.borrowerPhone)).size;
  const monthlyInterest = activeLoans.reduce((s, l) => s + l.monthlyInterest, 0);
  const returnRate      = metrics.totalPrincipalLent > 0
    ? (metrics.totalProfit / metrics.totalPrincipalLent) * 100
    : 0;

  const trackers = [
    {
      label:   "PORTFOLIO SIZE",
      current: metrics.totalOutstanding,
      target:  goals.targetPortfolioSize,
      display: formatCompactCurrency(metrics.totalOutstanding),
      goal:    formatCompactCurrency(goals.targetPortfolioSize),
    },
    {
      label:   "CLIENT COUNT",
      current: uniqueClients,
      target:  goals.targetClientCount,
      display: String(uniqueClients),
      goal:    String(goals.targetClientCount),
    },
    {
      label:   "MONTHLY RETURN",
      current: monthlyInterest,
      target:  goals.targetMonthlyReturn,
      display: formatCompactCurrency(monthlyInterest),
      goal:    formatCompactCurrency(goals.targetMonthlyReturn),
    },
    {
      label:   "RETURN RATE",
      current: returnRate,
      target:  goals.targetReturnRate,
      display: returnRate.toFixed(1) + "%",
      goal:    goals.targetReturnRate + "%",
    },
  ];

  const pct      = (c: number, tgt: number) => Math.min(100, tgt > 0 ? (c / tgt) * 100 : 0);
  const fillColor = (p: number) => p >= 90 ? "#4ade80" : p >= 60 ? "#f59e0b" : "#f87171";
  const label     = (p: number) => p >= 90 ? "ON TRACK" : p >= 60 ? "CLOSE" : "BEHIND";
  const rimColor  = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  const noGoalsSet = goals.targetPortfolioSize === 0 && goals.targetClientCount === 0;

  return (
    <div className="rounded-2xl border p-5" style={{ background: t.bgCard, borderColor: t.border }}>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" style={{ color: "#5b7cfa" }} />
          <p className="text-[10px] font-bold uppercase tracking-widest"
            style={{ fontFamily: mono, color: t.textFaint }}>GOAL TRACKER</p>
        </div>
        <button onClick={onEdit}
          className="text-[9px] font-bold px-3 py-1 rounded-lg border"
          style={{ fontFamily: mono, borderColor: "rgba(91,124,250,0.30)", color: "#5b7cfa", background: "rgba(91,124,250,0.10)" }}>
          EDIT GOALS
        </button>
      </div>

      {noGoalsSet ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Target className="w-8 h-8" style={{ color: t.textFaint }} />
          <p className="text-xs font-bold" style={{ fontFamily: mono, color: t.textFaint }}>NO GOALS SET</p>
          <p className="text-[10px]" style={{ color: t.textFaint, fontFamily: mono }}>
            Click EDIT GOALS to define targets
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {trackers.map((tr) => {
            const p    = pct(tr.current, tr.target);
            const fill = fillColor(p);
            const rim  = rimColor;
            const data = [
              { value: p },
              { value: Math.max(0, 100 - p) },
            ];

            return (
              <div key={tr.label} className="rounded-2xl border p-4 flex flex-col items-center"
                style={{ background: t.bgCard, borderColor: t.border }}>

                <p className="text-[9px] font-bold uppercase tracking-widest mb-3 text-center"
                  style={{ fontFamily: mono, color: t.textFaint }}>{tr.label}</p>

                <div className="relative w-full" style={{ height: 130 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={52}
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        <Cell fill={fill} />
                        <Cell fill={rim} />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    pointerEvents: "none",
                  }}>
                    <p style={{ fontFamily: mono, fontSize: 18, fontWeight: 700, color: fill, lineHeight: 1 }}>
                      {p.toFixed(0)}%
                    </p>
                    <p style={{ fontFamily: mono, fontSize: 8, color: t.textFaint, letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase" }}>
                      {label(p)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <p className="text-sm font-bold" style={{ fontFamily: mono, color: fill }}>{tr.display}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: t.textFaint, fontFamily: mono }}>
                    / {tr.goal}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
