import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[6px] px-2.5 py-0.5 text-xs font-medium font-body transition-colors duration-150 select-none",
  {
    variants: {
      variant: {
        pending:   "bg-[var(--warning)] text-[var(--warning-fg)] border border-[var(--warning-fg)] border-opacity-30",
        active:    "bg-[var(--success)] text-[var(--success-fg)] border border-[var(--success-fg)] border-opacity-30",
        overdue:   "bg-[var(--danger)]  text-[var(--danger-fg)]  border border-[var(--danger-fg)]  border-opacity-30",
        completed: "bg-[var(--bg-raised)] text-[var(--text-muted)] border border-[rgba(243,234,216,0.12)]",
        risk:      "bg-[var(--danger)] text-[var(--danger-fg)] border border-[var(--danger-fg)] font-semibold tracking-wide",
        gold:      "bg-[var(--gold-500)] text-[var(--bg-base)]",
      },
    },
    defaultVariants: { variant: "active" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
