import type { ReactNode } from "react"
import { FONT, MUTED } from "./chartTheme"

export function ChartCard({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="card-surface p-5 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: MUTED, textTransform: "uppercase" }}>{title}</p>
        {right}
      </div>
      {children}
    </div>
  )
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 14 }}>
      {items.map((it) => (
        <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: it.color, flexShrink: 0 }} />
          <span style={{ fontFamily: FONT, fontSize: 12, color: MUTED }}>{it.label}</span>
        </div>
      ))}
    </div>
  )
}

