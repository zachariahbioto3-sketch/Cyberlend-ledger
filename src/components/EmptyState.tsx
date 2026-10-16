import { cn } from "@/lib/utils"

interface EmptyStateProps {
  message?: string
  className?: string
}

export function EmptyState({ message = "Nothing here yet", className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-center", className)}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity="0.35">
        <circle cx="24" cy="24" r="20" stroke="var(--gold-500)" strokeWidth="1.5" />
        <path d="M16 32 Q20 24 24 28 Q28 32 32 22" stroke="var(--gold-500)" strokeWidth="1.5"
          strokeLinecap="round" fill="none" />
        <circle cx="24" cy="18" r="2" fill="var(--gold-500)" />
      </svg>
      <p className="text-sm text-[var(--text-muted)]">{message}</p>
    </div>
  )
}
