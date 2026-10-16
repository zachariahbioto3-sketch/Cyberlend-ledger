import React from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Loan } from "../types"

const MONO = "'JetBrains Mono', monospace"
const fmt = (v: number) => v >= 1000 ? `KES ${(v/1000).toFixed(1)}k` : `KES ${v}`

const COLORS = {
  collected:   "#c49a2f",
  outstanding: "rgba(196,154,47,0.25)",
  profit:      "#7fc98f",
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
      <div style={{ background: "#141414", border: "1px solid rgba(243,234,216,0.12)", borderRadius: 8, padding: "10px 14px", fontFamily: MONO, minWidth: 160 }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: "#f3ead8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{d.fullName}</p>
        {[["COLLECTED", d.collected, COLORS.collected], ["OUTSTANDING", d.outstanding, COLORS.outstanding], ["PROFIT", d.profit, COLORS.profit]].map(([label, val, color]: any) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: "rgba(243,234,216,0.4)", letterSpacing: 1 }}>{label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color }}>{fmt(val)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ background: "#141414", border: "1px solid rgba(243,234,216,0.08)", borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: 3, color: "rgba(243,234,216,0.4)", textTransform: "uppercase" }}>OUTSTANDING vs COLLECTED vs PROFIT</p>
        {compact && loans.length > 4 && <span style={{ fontFamily: MONO, fontSize: 9, color: "rgba(243,234,216,0.4)" }}>{loans.length - 4} MORE</span>}
      </div>
      <div style={{ height: compact ? 180 : 220, width: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} barCategoryGap="30%" barSize={compact ? 18 : 24}>
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "rgba(243,234,216,0.4)", fontFamily: MONO }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "rgba(243,234,216,0.4)", fontFamily: MONO }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(243,234,216,0.03)" }} />
            <Bar dataKey="collected"   stackId="a" fill={COLORS.collected}   radius={[0,0,0,0]} />
            <Bar dataKey="outstanding" stackId="a" fill={COLORS.outstanding} radius={[0,0,0,0]} />
            <Bar dataKey="profit"      stackId="a" fill={COLORS.profit}      radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", gap: "8px 20px", flexWrap: "wrap", marginTop: 14 }}>
        {Object.entries(COLORS).map(([key, color]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: "rgba(243,234,216,0.4)", letterSpacing: 1 }}>{key.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
