import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PortfolioMetrics } from "../types";

interface Props {
  metrics: PortfolioMetrics;
  compact?: boolean;
}

const COLORS = {
  Active: "#000000",
  Overdue: "#ef4444",
  Completed: "#9ca3af",
  Defaulted: "#7f1d1d",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm text-xs">
        <p className="font-semibold text-black">{name}</p>
        <p className="text-gray-500">{value} loan{value !== 1 ? "s" : ""}</p>
      </div>
    );
  }
  return null;
};

export const PortfolioDonut: React.FC<Props> = ({ metrics, compact = false }) => {
  const data = [
    { name: "Active", value: metrics.activeLoansCount },
    { name: "Overdue", value: metrics.overdueCount },
    { name: "Completed", value: metrics.completedLoansCount },
    { name: "Defaulted", value: metrics.defaultedCount },
  ].filter((d) => d.value > 0);

  const total = metrics.totalLoansOriginated;
  const chartHeight = compact ? 160 : 200;
  const innerRadius = compact ? 45 : 60;
  const outerRadius = compact ? 65 : 85;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Portfolio Health</p>
      <div className="relative" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className={`font-bold text-black ${compact ? "text-xl" : "text-2xl"}`}>{total}</p>
          <p className="text-[10px] text-gray-400">total loans</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: COLORS[d.name as keyof typeof COLORS] }} />
            <span className="text-[11px] text-gray-500">{d.name} <span className="font-semibold text-black">{d.value}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
};
