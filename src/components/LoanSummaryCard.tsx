import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { StampBadge } from "@/components/StampBadge"
import { Calendar, TrendingUp } from "lucide-react"

interface LoanSummaryCardProps {
  borrowerName: string
  loanNumber: string
  principal: string
  monthlyInterest: string
  nextDueDate: string
  status: "active" | "overdue" | "completed" | "pending"
  isRisk?: boolean
  className?: string
  onClick?: () => void
}

const statusMap: Record<string, "active" | "overdue" | "completed" | "pending"> = {
  active:    "active",
  overdue:   "overdue",
  completed: "completed",
  pending:   "pending",
}

export function LoanSummaryCard({
  borrowerName, loanNumber, principal, monthlyInterest,
  nextDueDate, status, isRisk, className, onClick
}: LoanSummaryCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "card-surface p-4 flex flex-col gap-3 cursor-pointer",
        "hover:border-[rgba(243,234,216,0.18)] transition-colors duration-150",
        isRisk && "border-[var(--danger-fg)] border-opacity-40",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-base font-semibold text-[var(--text-primary)]">{borrowerName}</p>
          <p className="text-xs text-[var(--text-muted)] font-mono">{loanNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          {isRisk && <Badge variant="risk">? Risk</Badge>}
          <Badge variant={statusMap[status]}>{status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Principal</p>
          <p className="font-mono text-sm text-[var(--text-primary)] tabular-nums">{principal}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Monthly Interest</p>
          <p className="font-mono text-sm text-[var(--gold-500)] tabular-nums flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />{monthlyInterest}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[rgba(243,234,216,0.06)]">
        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <Calendar className="h-3 w-3" /> Next due
        </span>
        <span className="font-mono text-xs text-[var(--text-primary)]">{nextDueDate}</span>
      </div>
    </div>
  )
}
