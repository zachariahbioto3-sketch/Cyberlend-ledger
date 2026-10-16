import React from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { PortfolioMetrics } from "../types"

const MONO = "'JetBrains Mono', monospace"
const COLORS: Record<string, string> = {
  Active:    "#c49a2f",
  Overdue:   "#e07070",
  Completed: "#7fc98f",
  Defaulted: "#7d2a2a",
}

interface Props { metrics: PortfolioMetrics; compact?: boolean }

export const PortfolioDonut: React.FC<Props> = ({ metrics, compact = false }) => {
  const data = [
    { name: "Active",    value: metrics.activeLoansCount },
    { name: "Overdue",   value: metrics.overdueCount },
    { name: "Completed", value: metrics.completedLoansCount },
    { name: "Defaulted", value: metrics.defaultedCount },
  ].filter((d) => d.value > 0)

  const innerR  = compact ? 48 : 62
  const outerR  = compact ? 68 : 88
  const chartH  = compact ? 160 : 200

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const { name, value } = payload[0]
    return (
      <div style={{
        background: "#141414", border: "1px solid rgba(243,234,216,0.12)",
        borderRadius: 8, padding: "8px 12px", fontFamily: MONO,
      }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: "#f3ead8", letterSpacing: 2, textTransform: "uppercase" }}>{name}</p>
        <p style={{ fontSize: 11, color: "rgba(243,234,216,0.6)", marginTop: 2 }}>{value} loan{value !== 1 ? "s" : ""}</p>
      </div>
    )
  }

  return (
    <div style={{ background: "#141414", border: "1px solid rgba(243,234,216,0.08)", borderRadius: 12, padding: 20 }}>
      <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: 3, color: "rgba(243,234,216,0.4)", textTransform: "uppercase", marginBottom: 16 }}>
        PORTFOLIO HEALTH
      </p>
      <div style={{ position: "relative", height: chartH, width: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={innerR} outerRadius={outerR} paddingAngle={3} dataKey="value">
              {data.map((entry) => <Cell key={entry.name} fill={COLORS[entry.name]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <p style={{ fontFamily: MONO, fontSize: compact ? 22 : 28, fontWeight: 700, color: "#f3ead8", lineHeight: 1 }}>{metrics.totalLoansOriginated}</p>
          <p style={{ fontFamily: MONO, fontSize: 8, color: "rgba(243,234,216,0.4)", letterSpacing: 2, marginTop: 4, textTransform: "uppercase" }}>TOTAL</p>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 14 }}>
        {data.map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS[d.name], flexShrink: 0 }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: "rgba(243,234,216,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>
              {d.name} <strong style={{ color: "#f3ead8" }}>{d.value}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
