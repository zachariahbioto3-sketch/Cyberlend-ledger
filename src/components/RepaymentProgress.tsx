import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loan } from "../types";

interface ThemeTokens {
  bg: string; bgCard: string; bgModal: string; bgActive: string; bgBtn: string;
  border: string; borderMid: string; text: string; textMuted: string; textFaint: string;
  progressBg: string; progressFill: string;
}

interface Props {
  loans: Loan[];
  theme: ThemeTokens;
  compact?: boolean;
}

export const RepaymentProgress: React.FC<Props> = ({ loans, theme: t, compact = false }) => {
  const mono = "'Space Mono', monospace";
  const isDark = t.text !== "#0f1117" && t.text !== "#0A0A0A";

  const STATUS_COLORS: Record<string, string> = {
    Active:    isDark ? "#5b7cfa" : "#000000",
    Overdue:   "#ef4444",
    Completed: isDark ? "rgba(255,255,255,0.25)" : "#9ca3af",
    Defaulted: "#7f1d1d",
  };

  const displayLoans = compact ? loans.slice(0, 5) : loans;

  const data = displayLoans.map((l) => ({
    name:      l.borrowerName.split(" ")[0],
    fullName:  l.borrowerName,
    completed: l.monthsCompleted,
    remaining: l.monthsRemaining,
    term:      l.term,
    status:    l.status,
  }));

  const barHeight  = compact ? 36 : 44;
  const chartHeight = Math.max(compact ? 160 : 200, data.length * barHeight);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    const pct = Math.round((d.completed / d.term) * 100);
    const ss = STATUS_COLORS[d.status];
    return (
      <div style={{
        background: t.bgModal, border: `1px solid ${t.borderMid}`,
        borderRadius: 12, padding: "10px 14px", fontFamily: mono,
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: t.text, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{d.fullName}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ fontSize: 9, color: t.textFaint }}>MONTHS DONE</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: t.text }}>{d.completed} / {d.term}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ fontSize: 9, color: t.textFaint }}>PROGRESS</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: t.text }}>{pct}%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ fontSize: 9, color: t.textFaint }}>STATUS</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: ss }}>{d.status.toUpperCase()}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: t.bgCard,
      border: `1px solid ${t.border}`,
      borderRadius: 20,
      padding: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: 3, color: t.textFaint, textTransform: "uppercase" }}>
          REPAYMENT PROGRESS
        </p>
        {compact && loans.length > 5 && (
          <span style={{ fontFamily: mono, fontSize: 9, color: t.textFaint }}>{loans.length - 5} MORE</span>
        )}
      </div>

      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} barCategoryGap="25%">
            <XAxis
              type="number"
              tick={{ fontSize: 9, fill: t.textFaint, fontFamily: mono }}
              axisLine={false}
              tickLine={false}
              domain={[0, "dataMax"]}
              tickFormatter={(v) => `${v}mo`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: t.text, fontFamily: mono, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={58}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }} />
            <Bar dataKey="completed" stackId="a" radius={[0,0,0,0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={STATUS_COLORS[entry.status]} />
              ))}
            </Bar>
            <Bar dataKey="remaining" stackId="a" fill={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"} radius={[4,4,4,4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 14 }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontFamily: mono, fontSize: 9, color: t.textFaint, letterSpacing: 1 }}>{status.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
