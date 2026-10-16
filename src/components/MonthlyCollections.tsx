import React from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Loan } from "../types"

const MONO = "'JetBrains Mono', monospace"
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
      <div style={{ background: "#141414", border: "1px solid rgba(243,234,216,0.12)", borderRadius: 8, padding: "10px 14px", fontFamily: MONO }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: "#f3ead8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: "rgba(243,234,216,0.4)", letterSpacing: 1 }}>{p.name.toUpperCase()}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#f3ead8" }}>KES {p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ background: "#141414", border: "1px solid rgba(243,234,216,0.08)", borderRadius: 12, padding: 20 }}>
      <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: 3, color: "rgba(243,234,216,0.4)", textTransform: "uppercase", marginBottom: 16 }}>
        MONTHLY COLLECTIONS
      </p>
      <div style={{ height: compact ? 160 : 200, width: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} barCategoryGap="30%" barGap={4}>
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: "rgba(243,234,216,0.4)", fontFamily: MONO }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "rgba(243,234,216,0.4)", fontFamily: MONO }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(243,234,216,0.03)" }} />
            <Bar dataKey="expected"  name="Expected"  fill="rgba(196,154,47,0.25)" radius={[4,4,0,0]} />
            <Bar dataKey="collected" name="Collected" fill="#c49a2f"               radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", gap: "8px 20px", flexWrap: "wrap", marginTop: 14 }}>
        {[{ label: "EXPECTED", color: "rgba(196,154,47,0.25)" }, { label: "COLLECTED", color: "#c49a2f" }].map((leg) => (
          <div key={leg.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: leg.color, flexShrink: 0 }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: "rgba(243,234,216,0.4)", letterSpacing: 1 }}>{leg.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
