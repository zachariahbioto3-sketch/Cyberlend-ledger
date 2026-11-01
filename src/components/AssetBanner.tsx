import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Loan, PortfolioMetrics } from "../types";
import { formatCurrency } from "../utils/loanCalculations";

interface AssetBannerProps {
  loans: Loan[];
  metrics: PortfolioMetrics;
  onClick?: () => void;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const monthKey = (d: string) => (d ? d.slice(0, 7) : "");
const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  return MONTHS[parseInt(m, 10) - 1] + " " + y.slice(2);
};

export const AssetBanner: React.FC<AssetBannerProps> = ({ loans, metrics, onClick }) => {
  const months = [...new Set(loans.map((l) => monthKey(l.originationDate)))].filter(Boolean).sort();

  let running = 0;
  const actual = months.map((m) => {
    running += loans.filter((l) => monthKey(l.originationDate) === m).reduce((s, l) => s + l.loanAmount, 0);
    return { month: monthLabel(m), assets: running };
  });

  const lastThree = actual.slice(-3);
  const avg = lastThree.length > 1
    ? (lastThree[lastThree.length - 1].assets - lastThree[0].assets) / (lastThree.length - 1)
    : 0;
  const base = actual.length ? actual[actual.length - 1].assets : 0;
  const last = months.length ? months[months.length - 1] : new Date().toISOString().slice(0, 7);
  const [ly, lm] = last.split("-").map((n) => parseInt(n, 10));

  const projection = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(ly, lm - 1 + i + 1, 1);
    return {
      month: MONTHS[d.getMonth()] + " " + String(d.getFullYear()).slice(2),
      projected: Math.round(base + avg * (i + 1)),
    };
  });

  const data = [
    ...actual.map((d, i) => ({
      month: d.month,
      assets: d.assets as number | null,
      projected: (i === actual.length - 1 ? d.assets : null) as number | null,
    })),
    ...projection.map((d) => ({
      month: d.month,
      assets: null as number | null,
      projected: d.projected as number | null,
    })),
  ];

  const tick = { fontSize: 11, fill: "rgba(255,255,255,0.75)" };

  return (
    <div
      onClick={onClick}
      className="px-5 pt-4 pb-6 rounded-b-[28px] text-white"
      style={{ background: "var(--banner-bg)", cursor: onClick ? "pointer" : "default" }}
    >
      <p className="cl-mono text-[11px] font-bold uppercase tracking-widest opacity-80">Asset Growth</p>
      <p className="cl-mono text-3xl font-bold mt-1">{formatCurrency(metrics.totalPrincipalLent)}</p>
      <p className="text-xs opacity-80 mb-3">Principal lent, with 6-month projection</p>
      <ResponsiveContainer width="100%" height={200} minWidth={0}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
          <XAxis dataKey="month" tick={tick} axisLine={false} tickLine={false} />
          <YAxis
            tick={tick}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v: number) => (v >= 1000 ? (v / 1000).toFixed(0) + "k" : String(v))}
          />
          <Tooltip
            formatter={(v: any) => "KES " + Number(v).toLocaleString()}
            contentStyle={{ background: "#111214", border: "none", borderRadius: 12, color: "#fff", fontSize: 12 }}
          />
          <Line type="monotone" dataKey="assets" stroke="#FFFFFF" strokeWidth={2.5} dot={false} connectNulls={false} name="Actual" />
          <Line type="monotone" dataKey="projected" stroke="rgba(255,255,255,0.7)" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls={false} name="Projected" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};