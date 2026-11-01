import React from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { PortfolioMetrics } from "../types"
import { ChartCard, Legend } from "./ChartCard"
import { FONT, INK, MUTED, STATUS_COLORS, tooltipBox } from "./chartTheme"

interface Props { metrics: PortfolioMetrics; compact?: boolean }

export const PortfolioDonut: React.FC<Props> = ({ metrics, compact = false }) => {
  const data = [
    { name: "Active",    value: metrics.activeLoansCount },
    { name: "Overdue",   value: metrics.overdueCount },
    { name: "Completed", value: metrics.completedLoansCount },
    { name: "Defaulted", value: metrics.defaultedCount },
  ].filter((d) => d.value > 0)

  const innerR = compact ? 48 : 62
  const outerR = compact ? 68 : 88
  const chartH = compact ? 160 : 200

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const { name, value } = payload[0]
    return (
      <div style={tooltipBox}>
        <p style={{ fontSize: 12, fontWeight: 700 }}>{name}</p>
        <p style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{value} loan{value !== 1 ? "s" : ""}</p>
      </div>
    )
  }

  return (
    <ChartCard title="Portfolio health">
      <div style={{ position: "relative", height: chartH, width: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={innerR} outerRadius={outerR} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {data.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <p style={{ fontFamily: FONT, fontSize: compact ? 24 : 32, fontWeight: 700, color: INK, lineHeight: 1 }}>{metrics.totalLoansOriginated}</p>
          <p style={{ fontFamily: FONT, fontSize: 12, color: MUTED, marginTop: 4 }}>Total</p>
        </div>
      </div>
      <Legend items={data.map((d) => ({ label: `${d.name} ${d.value}`, color: STATUS_COLORS[d.name] }))} />
    </ChartCard>
  )
}
