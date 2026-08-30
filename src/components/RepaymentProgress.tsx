import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loan } from "../types";

interface Props {
  loans: Loan[];
  compact?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  Active: "#000000",
  Overdue: "#ef4444",
  Completed: "#9ca3af",
  Defaulted: "#7f1d1d",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const pct = Math.round((d.completed / d.term) * 100);
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm text-xs space-y-1">
        <p className="font-semibold text-black">{d.fullName}</p>
        <p className="text-gray-500">{d.completed} of {d.term} months done</p>
        <p className="text-gray-500">{pct}% complete</p>
        <span
          className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white"
          style={{ background: STATUS_COLORS[d.status] }}
        >
          {d.status}
        </span>
      </div>
    );
  }
  return null;
};

export const RepaymentProgress: React.FC<Props> = ({ loans, compact = false }) => {
  const displayLoans = compact ? loans.slice(0, 4) : loans;

  const data = displayLoans.map((l) => ({
    name: l.borrowerName.split(" ")[0],
    fullName: l.borrowerName,
    completed: l.monthsCompleted,
    remaining: l.monthsRemaining,
    term: l.term,
    status: l.status,
  }));

  const barHeight = compact ? 36 : 48;
  const chartHeight = Math.max(compact ? 140 : 180, data.length * barHeight);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Repayment Progress</p>
        {compact && loans.length > 4 && (
          <span className="text-[10px] text-gray-400">{loans.length - 4} more</span>
        )}
      </div>
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} barCategoryGap="25%">
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              domain={[0, "dataMax"]}
              tickFormatter={(v) => `${v}mo`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#111827", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
            <Bar dataKey="completed" stackId="a" radius={[0, 0, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={STATUS_COLORS[entry.status]} />
              ))}
            </Bar>
            <Bar dataKey="remaining" stackId="a" fill="#f3f4f6" radius={[4, 4, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[11px] text-gray-500">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
