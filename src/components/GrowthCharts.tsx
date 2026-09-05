import React from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { Loan } from "../types";

interface GrowthChartsProps {
  loans: Loan[];
  theme: any;
}

function getMonthKey(date: string) {
  if (!date) return "";
  return date.slice(0, 7);
}

function formatMonthLabel(key: string) {
  const parts = key.split("-");
  if (parts.length < 2) return key;
  const y = parts[0];
  const m = parseInt(parts[1], 10);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months[m - 1] + " " + y.slice(2);
}

export const GrowthCharts: React.FC<GrowthChartsProps> = ({ loans, theme: t }) => {
  const mono = "\x27Space Mono\x27, monospace";

  const allMonths = [...new Set(loans.map(l => getMonthKey(l.originationDate)))].filter(Boolean).sort();

  let cumulative = 0;
  const assetData = allMonths.map(month => {
    const monthLoans = loans.filter(l => getMonthKey(l.originationDate) === month);
    cumulative += monthLoans.reduce((s, l) => s + l.loanAmount, 0);
    return { month: formatMonthLabel(month), assets: cumulative };
  });

  const lastThree = assetData.slice(-3);
  const avgGrowth = lastThree.length > 1
    ? (lastThree[lastThree.length - 1].assets - lastThree[0].assets) / (lastThree.length - 1)
    : 0;

  const lastMonthKey = allMonths.length > 0 ? allMonths[allMonths.length - 1] : getMonthKey(new Date().toISOString());
  const lastDateParts = lastMonthKey.split("-");
  const lastDate = new Date(parseInt(lastDateParts[0], 10), parseInt(lastDateParts[1], 10) - 1, 1);
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const baseAssets = assetData.length > 0 ? assetData[assetData.length - 1].assets : 0;

  const projectionData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(lastDate.getFullYear(), lastDate.getMonth() + i + 1, 1);
    return {
      month: monthNames[d.getMonth()] + " " + String(d.getFullYear()).slice(2),
      projected: Math.round(baseAssets + avgGrowth * (i + 1)),
    };
  });

  const combinedAsset = [
    ...assetData.map((d, idx) => ({
      month: d.month,
      assets: d.assets,
      projected: idx === assetData.length - 1 ? d.assets : (null as number | null),
    })),
    ...projectionData.map(d => ({
      month: d.month,
      assets: null as number | null,
      projected: d.projected,
    })),
  ];

  const clientsByMonth: Record<string, Set<string>> = {};
  loans.forEach(l => {
    const mk = getMonthKey(l.originationDate);
    if (!mk) return;
    if (!clientsByMonth[mk]) clientsByMonth[mk] = new Set();
    clientsByMonth[mk].add(l.borrowerPhone || l.borrowerName);
  });

  const clientData = allMonths.map(month => ({
    month: formatMonthLabel(month),
    newClients: clientsByMonth[month] ? clientsByMonth[month].size : 0,
  }));

  const returnData = allMonths.map(month => {
    const monthLoans = loans.filter(l => getMonthKey(l.originationDate) === month);
    const principal = monthLoans.reduce((s, l) => s + l.loanAmount, 0);
    const interest  = monthLoans.reduce((s, l) => s + l.interestCollected, 0);
    const rate = principal > 0 ? parseFloat(((interest / principal) * 100).toFixed(1)) : 0;
    return { month: formatMonthLabel(month), returnRate: rate };
  });

  const cardStyle = { background: t.bgCard, borderColor: t.border };
  const axisStyle = { fontFamily: mono, fontSize: 9, fill: t.textFaint };
  const tooltipStyle = { background: t.bgModal, border: "1px solid " + t.border, borderRadius: 8, fontFamily: mono, fontSize: 11 };

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>GROWTH AND PROJECTIONS</p>

      <div className="rounded-2xl p-5 border" style={cardStyle}>
        <p className="text-[9px] uppercase tracking-widest font-bold mb-4" style={{ fontFamily: mono, color: t.textFaint }}>ASSET GROWTH + 6-MONTH TRAJECTORY</p>
        <ResponsiveContainer width="100%" height={200} minWidth={0}>
          <LineChart data={combinedAsset} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
            <XAxis dataKey="month" tick={axisStyle} />
            <YAxis tick={axisStyle} tickFormatter={(v) => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => ["KES " + Number(v).toLocaleString(), ""]} />
            <Line type="monotone" dataKey="assets" stroke="#5b7cfa" strokeWidth={2} dot={false} name="Actual" connectNulls={false} />
            <Line type="monotone" dataKey="projected" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 4" dot={false} name="Projected" connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-[9px]" style={{ fontFamily: mono, color: t.textFaint }}>
            <span style={{ display: "inline-block", width: 16, height: 2, background: "#5b7cfa" }} />ACTUAL
          </span>
          <span className="flex items-center gap-1.5 text-[9px]" style={{ fontFamily: mono, color: t.textFaint }}>
            <span style={{ display: "inline-block", width: 16, height: 2, background: "#a78bfa" }} />PROJECTED
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 border" style={cardStyle}>
          <p className="text-[9px] uppercase tracking-widest font-bold mb-4" style={{ fontFamily: mono, color: t.textFaint }}>NEW CLIENT FORMATION</p>
          <ResponsiveContainer width="100%" height={160} minWidth={0}>
            <BarChart data={clientData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis dataKey="month" tick={axisStyle} />
              <YAxis tick={axisStyle} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [v, "New Clients"]} />
              <Bar dataKey="newClients" fill="#4ade80" radius={[4, 4, 0, 0]} name="New Clients" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-5 border" style={cardStyle}>
          <p className="text-[9px] uppercase tracking-widest font-bold mb-4" style={{ fontFamily: mono, color: t.textFaint }}>RATE OF RETURN (%)</p>
          <ResponsiveContainer width="100%" height={160} minWidth={0}>
            <LineChart data={returnData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis dataKey="month" tick={axisStyle} />
              <YAxis tick={axisStyle} tickFormatter={(v) => v + "%"} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [v + "%", "Return Rate"]} />
              <ReferenceLine y={20} stroke="#f59e0b" strokeDasharray="4 3" label={{ value: "Target 20%", position: "insideTopRight", fontSize: 8, fill: "#f59e0b", fontFamily: mono }} />
              <Line type="monotone" dataKey="returnRate" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b" }} name="Return %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
