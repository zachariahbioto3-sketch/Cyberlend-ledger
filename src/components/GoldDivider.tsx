import { cn } from "@/lib/utils"

export function GoldDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 w-full", className)}>
      <div className="flex-1 h-px bg-[var(--gold-600)] opacity-40" />
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <rect x="4" y="0" width="5.66" height="5.66" transform="rotate(45 4 4)"
          fill="var(--gold-500)" opacity="0.7" />
      </svg>
      <div className="flex-1 h-px bg-[var(--gold-600)] opacity-40" />
    </div>
  )
}
