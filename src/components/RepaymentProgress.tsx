import React from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Loan } from "../types"

const MONO = "'JetBrains Mono', monospace"
const STATUS_COLORS: Record<string, string> = {
  Active:    "#c49a2f",
  Overdue:   "#e07070",
  Completed: "#7fc98f",
  Defaulted: "#7d2a2a",
}

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
      <div style={{ background: "#141414", border: "1px solid rgba(243,234,216,0.12)", borderRadius: 8, padding: "10px 14px", fontFamily: MONO }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: "#f3ead8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{d.fullName}</p>
        {[["MONTHS DONE", `${d.completed} / ${d.term}`], ["PROGRESS", `${pct}%`], ["STATUS", d.status.toUpperCase()]].map(([label, val]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: "rgba(243,234,216,0.4)" }}>{label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: label === "STATUS" ? STATUS_COLORS[d.status] : "#f3ead8" }}>{val}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ background: "#141414", border: "1px solid rgba(243,234,216,0.08)", borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: 3, color: "rgba(243,234,216,0.4)", textTransform: "uppercase" }}>REPAYMENT PROGRESS</p>
        {compact && loans.length > 5 && <span style={{ fontFamily: MONO, fontSize: 9, color: "rgba(243,234,216,0.4)" }}>{loans.length - 5} MORE</span>}
      </div>
      <div style={{ height: chartHeight, width: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart layout="vertical" data={data} barCategoryGap="25%">
            <XAxis type="number" tick={{ fontSize: 9, fill: "rgba(243,234,216,0.4)", fontFamily: MONO }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}mo`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#f3ead8", fontFamily: MONO, fontWeight: 600 }} axisLine={false} tickLine={false} width={58} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(243,234,216,0.03)" }} />
            <Bar dataKey="completed" stackId="a" radius={[0,0,0,0]}>
              {data.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.status]} />)}
            </Bar>
            <Bar dataKey="remaining" stackId="a" fill="rgba(243,234,216,0.08)" radius={[4,4,4,4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 14 }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: "rgba(243,234,216,0.4)", letterSpacing: 1 }}>{status.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
