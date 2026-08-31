import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loan } from "../types";

interface ThemeTokens {
  bg: string; bgCard: string; bgModal: string; bgActive: string; bgBtn: string;
  border: string; borderMid: string; text: string; textMuted: string; textFaint: string;
}

interface Props {
  loans: Loan[];
  theme: ThemeTokens;
  compact?: boolean;
}

const fmt = (v: number) =>
  v >= 1000 ? `KES ${(v / 1000).toFixed(1)}k` : `KES ${v}`;

export const FinancialStackedBar: React.FC<Props> = ({ loans, theme: t, compact = false }) => {
  const mono = "'Space Mono', monospace";
  const isDark = t.text === "#FFFFFF";

  const displayLoans = compact ? loans.slice(0, 4) : loans;

  const data = displayLoans.map((l) => ({
    name: l.borrowerName.split(" ")[0],
    fullName: l.borrowerName,
    collected: l.amountPaid,
    outstanding: l.remainingBalance,
    profit: l.totalRepayable - l.loanAmount,
  }));

  const chartHeight = compact ? 180 : 220;

  const COLORS = {
    collected:   isDark ? "#FFFFFF"                : "#000000",
    outstanding: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.20)",
    profit:      isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{
        background: t.bgModal, border: `1px solid ${t.borderMid}`,
        borderRadius: 12, padding: "10px 14px", fontFamily: mono, minWidth: 160,
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: t.text, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          {d.fullName}
        </p>
        {[
          { label: "COLLECTED",   value: d.collected,   color: COLORS.collected },
          { label: "OUTSTANDING", value: d.outstanding, color: COLORS.outstanding },
          { label: "PROFIT",      value: d.profit,      color: t.textMuted },
        ].map((row) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: t.textFaint, letterSpacing: 1 }}>{row.label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: t.text }}>{fmt(row.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 20, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: 3, color: t.textFaint, textTransform: "uppercase" }}>
          OUTSTANDING vs COLLECTED vs PROFIT
        </p>
        {compact && loans.length > 4 && (
          <span style={{ fontFamily: mono, fontSize: 9, color: t.textFaint }}>{loans.length - 4} MORE</span>
        )}
      </div>

      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="30%" barSize={compact ? 18 : 24}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: t.textFaint, fontFamily: mono }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: t.textFaint, fontFamily: mono }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }} />
            <Bar dataKey="collected"   stackId="a" fill={COLORS.collected}   radius={[0,0,0,0]} />
            <Bar dataKey="outstanding" stackId="a" fill={COLORS.outstanding} radius={[0,0,0,0]} />
            <Bar dataKey="profit"      stackId="a" fill={COLORS.profit}      radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "8px 20px", flexWrap: "wrap", marginTop: 14 }}>
        {[
          { label: "COLLECTED",   color: COLORS.collected },
          { label: "OUTSTANDING", color: COLORS.outstanding },
          { label: "PROFIT",      color: t.textMuted },
        ].map((leg) => (
          <div key={leg.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: leg.color, flexShrink: 0, border: `1px solid ${t.borderMid}` }} />
            <span style={{ fontFamily: mono, fontSize: 9, color: t.textFaint, letterSpacing: 1 }}>{leg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
