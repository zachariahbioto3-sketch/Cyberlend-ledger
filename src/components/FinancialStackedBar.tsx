import React from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Loan } from "../types"
import { ChartCard, Legend } from "./ChartCard"
import { INK, INACTIVE, MUTED, FONT, axisTick, tooltipBox } from "./chartTheme"

const fmt = (v: number) => v >= 1000 ? `KES ${(v / 1000).toFixed(1)}k` : `KES ${v}`

const COLORS = {
  collected:   INK,
  outstanding: INACTIVE,
  profit:      "#1E9E5A",
}

interface Props { loans: Loan[]; compact?: boolean }

export const FinancialStackedBar: React.FC<Props> = ({ loans, compact = false }) => {
  const data = (compact ? loans.slice(0, 4) : loans).map((l) => ({
    name:        l.borrowerName.split(" ")[0],
    fullName:    l.borrowerName,
    collected:   l.amountPaid,
    outstanding: l.remainingBalance,
    profit:      l.totalRepayable - l.loanAmount,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload
    return (
      <div style={{ ...tooltipBox, minWidth: 170 }}>
        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{d.fullName}</p>
        {[["Collected", d.collected], ["Outstanding", d.outstanding], ["Profit", d.profit]].map(([label, val]: any) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
            <span style={{ fontSize: 12, opacity: 0.75 }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{fmt(val)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ChartCard
      title="Outstanding vs collected vs profit"
      right={compact && loans.length > 4 ? <span style={{ fontFamily: FONT, fontSize: 12, color: MUTED }}>{loans.length - 4} more</span> : undefined}
    >
      <div style={{ height: compact ? 180 : 220, width: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} barCategoryGap="30%" barSize={compact ? 18 : 24}>
            <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(17,18,20,0.04)" }} />
            <Bar dataKey="collected"   stackId="a" fill={COLORS.collected} />
            <Bar dataKey="outstanding" stackId="a" fill={COLORS.outstanding} />
            <Bar dataKey="profit"      stackId="a" fill={COLORS.profit} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend items={[
        { label: "Collected", color: COLORS.collected },
        { label: "Outstanding", color: COLORS.outstanding },
        { label: "Profit", color: COLORS.profit },
      ]} />
    </ChartCard>
  )
}
