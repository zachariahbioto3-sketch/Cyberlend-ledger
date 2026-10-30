import type { CSSProperties } from "react"

export const INK = "var(--chart-ink)"
export const INACTIVE = "var(--chart-inactive)"
export const MUTED = "var(--chart-muted)"
export const FONT = "'Manrope Variable', 'Manrope', system-ui, sans-serif"

export const STATUS_COLORS: Record<string, string> = {
  Active:    "#3B6FE0",
  Overdue:   "#D64545",
  Completed: "#1E9E5A",
  Defaulted: "#7A1F1F",
}

export const axisTick = { fontSize: 12, fill: MUTED, fontFamily: FONT }

export const tooltipBox: CSSProperties = {
  background: "#111214",
  color: "#FFFFFF",
  borderRadius: 12,
  padding: "10px 14px",
  fontFamily: FONT,
  boxShadow: "0 12px 32px rgba(40,50,90,0.18)",
}




