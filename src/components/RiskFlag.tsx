import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

interface RiskFlagProps {
  reason?: string
  className?: string
}

export function RiskFlag({ reason = "High risk borrower", className }: RiskFlagProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-[6px]",
      "bg-[var(--danger)] border border-[var(--danger-fg)] border-opacity-30",
      className
    )}>
      <AlertTriangle className="h-3.5 w-3.5 text-[var(--danger-fg)] shrink-0" />
      <span className="text-xs font-medium text-[var(--danger-fg)]">{reason}</span>
    </div>
  )
}
