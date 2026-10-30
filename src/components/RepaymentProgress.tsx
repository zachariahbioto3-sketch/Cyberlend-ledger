import React from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Loan } from "../types"
import { ChartCard, Legend } from "./ChartCard"
import { INK, INACTIVE, MUTED, FONT, STATUS_COLORS, axisTick, tooltipBox } from "./chartTheme"

const fillFor = (status: string) => (status === "Active" ? INK : STATUS_COLORS[status] || INK)

interface Props { loans: Loan[]; compact?: boolean }

export const RepaymentProgress: React.FC<Props> = ({ loans, compact = false }) => {
  const display = compact ? loans.slice(0, 5) : loans
  const data = display.map((l) => ({
    name: l.borrowerName.split(" ")[0],
    fullName: l.borrowerName,
    completed: l.monthsCompleted,
    remaining: l.monthsRemaining,
    term: l.term,
    status: l.status,
  }))

  const chartHeight = Math.max(compact ? 160 : 200, data.length * (compact ? 36 : 44))

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload
    const pct = Math.round((d.completed / d.term) * 100)
    return (
      <div style={tooltipBox}>
        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{d.fullName}</p>
        {[["Months done", `${d.completed} / ${d.term}`], ["Progress", `${pct}%`], ["Status", d.status]].map(([label, val]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
            <span style={{ fontSize: 12, opacity: 0.75 }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{val}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ChartCard
      title="Repayment progress"
      right={compact && loans.length > 5 ? <span style={{ fontFamily: FONT, fontSize: 12, color: MUTED }}>{loans.length - 5} more</span> : undefined}
    >
      <div style={{ height: chartHeight, width: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart layout="vertical" data={data} barCategoryGap="25%">
            <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}mo`} />
            <YAxis type="category" dataKey="name" tick={{ ...axisTick, fill: INK, fontWeight: 600 }} axisLine={false} tickLine={false} width={64} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(17,18,20,0.04)" }} />
            <Bar dataKey="completed" stackId="a" radius={[6, 0, 0, 6]}>
              {data.map((entry, i) => <Cell key={i} fill={fillFor(entry.status)} />)}
            </Bar>
            <Bar dataKey="remaining" stackId="a" fill={INACTIVE} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend items={[
        { label: "Active", color: INK },
        { label: "Overdue", color: STATUS_COLORS.Overdue },
        { label: "Completed", color: STATUS_COLORS.Completed },
        { label: "Defaulted", color: STATUS_COLORS.Defaulted },
        { label: "Remaining", color: INACTIVE },
      ]} />
    </ChartCard>
  )
}
