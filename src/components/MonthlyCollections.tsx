import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Loan } from "../types";

interface Props {
  loans: Loan[];
  compact?: boolean;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm text-xs space-y-1">
        <p className="font-semibold text-black mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill }}>
            {p.name}: <span className="font-semibold text-black">KES {p.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const MonthlyCollections: React.FC<Props> = ({ loans, compact = false }) => {
  const monthlyData: Record<string, { expected: number; collected: number }> = {};

  loans.forEach((loan) => {
    const origin = new Date(loan.originationDate);
    for (let m = 0; m < loan.term; m++) {
      const d = new Date(origin.getFullYear(), origin.getMonth() + m + 1, 1);
      const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      if (!monthlyData[key]) monthlyData[key] = { expected: 0, collected: 0 };
      monthlyData[key].expected += loan.monthlyPayment;
    }
    loan.transactions.forEach((tx) => {
      if (tx.status !== "Completed") return;
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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Monthly Collections</p>
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="30%" barGap={4}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
            <Bar dataKey="expected" name="Expected" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="collected" name="Collected" fill="#000000" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-200" />
          <span className="text-[11px] text-gray-500">Expected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-black" />
          <span className="text-[11px] text-gray-500">Collected</span>
        </div>
      </div>
    </div>
  );
};
