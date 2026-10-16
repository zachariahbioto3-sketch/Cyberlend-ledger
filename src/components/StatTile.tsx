import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatTileProps {
  label: string
  value: string
  delta?: string
  deltaUp?: boolean
  className?: string
}

export function StatTile({ label, value, delta, deltaUp, className }: StatTileProps) {
  return (
    <div className={cn("card-surface p-4 flex flex-col gap-1", className)}>
      <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest">{label}</p>
      <p className="font-mono text-2xl font-medium text-[var(--text-primary)] tabular-nums">{value}</p>
      {delta && (
        <span className={cn(
          "inline-flex items-center gap-1 text-xs font-medium mt-0.5",
          deltaUp ? "text-[var(--success-fg)]" : "text-[var(--danger-fg)]"
        )}>
          {deltaUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {delta}
        </span>
      )}
    </div>
  )
}
