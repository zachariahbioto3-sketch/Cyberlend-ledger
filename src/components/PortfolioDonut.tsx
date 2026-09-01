import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PortfolioMetrics } from "../types";

interface ThemeTokens {
  bg: string; bgCard: string; bgModal: string; bgActive: string; bgBtn: string;
  border: string; borderMid: string; text: string; textMuted: string; textFaint: string;
}

interface Props {
  metrics: PortfolioMetrics;
  theme: ThemeTokens;
  compact?: boolean;
}

export const PortfolioDonut: React.FC<Props> = ({ metrics, theme: t, compact = false }) => {
  const mono = "'Space Mono', monospace";
  const isDark = t.text !== "#0f1117" && t.text !== "#0A0A0A";

  const COLORS: Record<string, string> = {
    Active:    "#5b7cfa",
    Overdue:   "#ef4444",
    Completed: isDark ? "rgba(255,255,255,0.25)" : "#9ca3af",
    Defaulted: "#7f1d1d",
  };

  const data = [
    { name: "Active",    value: metrics.activeLoansCount },
    { name: "Overdue",   value: metrics.overdueCount },
    { name: "Completed", value: metrics.completedLoansCount },
    { name: "Defaulted", value: metrics.defaultedCount },
  ].filter((d) => d.value > 0);

  const chartH   = compact ? 160 : 200;
  const innerR   = compact ? 48  : 62;
  const outerR   = compact ? 68  : 88;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0];
    return (
      <div style={{
        background: t.bgModal, border: `1px solid ${t.borderMid}`,
        borderRadius: 12, padding: "8px 12px", fontFamily: mono,
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: t.text, textTransform: "uppercase", letterSpacing: 2 }}>{name}</p>
        <p style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{value} loan{value !== 1 ? "s" : ""}</p>
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
      <p style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: 3, color: t.textFaint, textTransform: "uppercase", marginBottom: 16 }}>
        PORTFOLIO HEALTH
      </p>

      <div style={{ position: "relative", height: chartH, minHeight: chartH, width: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={innerR} outerRadius={outerR} paddingAngle={3} dataKey="value">
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <p style={{ fontFamily: mono, fontSize: compact ? 22 : 28, fontWeight: 700, color: t.text, lineHeight: 1 }}>
            {metrics.totalLoansOriginated}
          </p>
          <p style={{ fontFamily: mono, fontSize: 8, color: t.textFaint, letterSpacing: 2, marginTop: 4, textTransform: "uppercase" }}>
            TOTAL
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 14 }}>
        {data.map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS[d.name], flexShrink: 0 }} />
            <span style={{ fontFamily: mono, fontSize: 9, color: t.textFaint, textTransform: "uppercase", letterSpacing: 1 }}>
              {d.name} <strong style={{ color: t.text }}>{d.value}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

