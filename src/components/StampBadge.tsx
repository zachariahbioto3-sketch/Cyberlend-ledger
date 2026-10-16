import { cn } from "@/lib/utils"

interface StampBadgeProps {
  status: "PAID" | "OVERDUE" | "ACTIVE" | "PENDING"
  className?: string
}

const colors: Record<StampBadgeProps["status"], string> = {
  PAID:    "border-[var(--success-fg)] text-[var(--success-fg)]",
  OVERDUE: "border-[var(--danger-fg)]  text-[var(--danger-fg)]",
  ACTIVE:  "border-[var(--gold-500)]   text-[var(--gold-500)]",
  PENDING: "border-[var(--warning-fg)] text-[var(--warning-fg)]",
}

export function StampBadge({ status, className }: StampBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "border-2 rounded-[4px] px-2 py-0.5",
        "text-xs font-mono font-semibold tracking-widest uppercase",
        "rotate-[-4deg] select-none opacity-90",
        colors[status],
        className
      )}
    >
      {status}
    </span>
  )
}
