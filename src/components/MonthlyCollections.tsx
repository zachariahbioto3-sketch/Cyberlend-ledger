import React from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Loan } from "../types"
import { ChartCard, Legend } from "./ChartCard"
import { INK, INACTIVE, axisTick, tooltipBox } from "./chartTheme"

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

interface Props { loans: Loan[]; compact?: boolean }

export const MonthlyCollections: React.FC<Props> = ({ loans, compact = false }) => {
  const monthlyData: Record<string, { expected: number; collected: number }> = {}

  loans.forEach((loan) => {
    const origin = new Date(loan.originationDate)
    for (let m = 0; m < loan.term; m++) {
      const d = new Date(origin.getFullYear(), origin.getMonth() + m + 1, 1)
      const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
      if (!monthlyData[key]) monthlyData[key] = { expected: 0, collected: 0 }
      monthlyData[key].expected += loan.monthlyInterest || loan.monthlyPayment
    }
    loan.transactions.forEach((tx) => {
      if (tx.status !== "Completed" || tx.paymentType !== "Interest") return
      const d = new Date(tx.date)
      const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
      if (!monthlyData[key]) monthlyData[key] = { expected: 0, collected: 0 }
      monthlyData[key].collected += tx.amount
    })
  })

  const data = Object.entries(monthlyData)
    .sort(([a], [b]) => new Date("1 " + a).getTime() - new Date("1 " + b).getTime())
    .slice(-(compact ? 4 : 6))
    .map(([month, vals]) => ({ month, ...vals }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={tooltipBox}>
        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
            <span style={{ fontSize: 12, opacity: 0.75 }}>{p.name}</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>KES {p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ChartCard title="Monthly collections">
      <div style={{ height: compact ? 160 : 200, width: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} barCategoryGap="30%" barGap={4}>
            <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(17,18,20,0.04)" }} />
            <Bar dataKey="expected"  name="Expected"  fill={INACTIVE} radius={[6, 6, 0, 0]} />
            <Bar dataKey="collected" name="Collected" fill={INK}      radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend items={[{ label: "Expected", color: INACTIVE }, { label: "Collected", color: INK }]} />
    </ChartCard>
  )
}
