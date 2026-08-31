import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const MonthlyCollections: React.FC<Props> = ({ loans, theme: t, compact = false }) => {
  const mono = "'Space Mono', monospace";
  const isDark = t.text === "#FFFFFF";

  const monthlyData: Record<string, { expected: number; collected: number }> = {};

  loans.forEach((loan) => {
    // Expected: one interest payment per month for each month of the term
    const origin = new Date(loan.originationDate);
    for (let m = 0; m < loan.term; m++) {
      const d = new Date(origin.getFullYear(), origin.getMonth() + m + 1, 1);
      const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      if (!monthlyData[key]) monthlyData[key] = { expected: 0, collected: 0 };
      monthlyData[key].expected += loan.monthlyInterest || loan.monthlyPayment;
    }
    // Collected: only interest transactions
    loan.transactions.forEach((tx) => {
      if (tx.status !== "Completed" || tx.paymentType !== "Interest") return;
      const d = new Date(tx.date);
      const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      if (!monthlyData[key]) monthlyData[key] = { expected: 0, collected: 0 };
      monthlyData[key].collected += tx.amount;
    });
  });

  const sliceCount = compact ? 4 : 6;
  const data = Object.entries(monthlyData)
    .sort(([a], [b]) => new Date("1 " + a).getTime() - new Date("1 " + b).getTime())
    .slice(-sliceCount)
    .map(([month, vals]) => ({ month, ...vals }));

  const chartHeight = compact ? 160 : 200;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: t.bgModal, border: `1px solid ${t.borderMid}`, borderRadius: 12, padding: "10px 14px", fontFamily: mono }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: t.text, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: t.textFaint, letterSpacing: 1 }}>{p.name.toUpperCase()}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: t.text }}>KES {p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  const expectedColor  = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";
  const collectedColor = isDark ? "#FFFFFF"                : "#000000";

  return (
    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 20, padding: 20 }}>
      <p style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: 3, color: t.textFaint, textTransform: "uppercase", marginBottom: 16 }}>
        MONTHLY COLLECTIONS
      </p>
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="30%" barGap={4}>
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: t.textFaint, fontFamily: mono }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: t.textFaint, fontFamily: mono }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }} />
            <Bar dataKey="expected"  name="Expected"  fill={expectedColor}  radius={[4,4,0,0]} />
            <Bar dataKey="collected" name="Collected" fill={collectedColor} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", gap: "8px 20px", flexWrap: "wrap", marginTop: 14 }}>
        {[
          { label: "EXPECTED",  color: expectedColor },
          { label: "COLLECTED", color: collectedColor },
        ].map((leg) => (
          <div key={leg.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: leg.color, border: `1px solid ${t.borderMid}`, flexShrink: 0 }} />
            <span style={{ fontFamily: mono, fontSize: 9, color: t.textFaint, letterSpacing: 1 }}>{leg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
