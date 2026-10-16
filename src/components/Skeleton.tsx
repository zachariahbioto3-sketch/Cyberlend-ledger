import { cn } from "@/lib/utils"

interface SkeletonProps { className?: string; rows?: number }

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "rounded-[6px] bg-[var(--bg-raised)] relative overflow-hidden",
      "after:absolute after:inset-0",
      "after:bg-gradient-to-r after:from-transparent after:via-[rgba(243,234,216,0.04)] after:to-transparent",
      "after:animate-[shimmer_1.4s_infinite]",
      className
    )} />
  )
}

export function CardSkeleton() {
  return (
    <div className="card-surface p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 card-surface">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="card-surface p-4 flex flex-col gap-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}
