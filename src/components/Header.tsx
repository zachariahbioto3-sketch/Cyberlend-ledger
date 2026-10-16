import { cn } from "@/lib/utils"
import { Search, Bell, User } from "lucide-react"

interface HeaderProps {
  onSearch?: (q: string) => void
  className?: string
}

export function Header({ onSearch, className }: HeaderProps) {
  return (
    <header className={cn(
      "flex items-center justify-between gap-4",
      "px-4 md:px-6 py-3 min-h-[64px]",
      "bg-[var(--bg-base)] border-b border-[rgba(243,234,216,0.08)]",
      "sticky top-0 z-30",
      "pt-[calc(env(safe-area-inset-top,0px)+12px)]",
      className
    )}>
      {/* Logo — mobile only */}
      <span className="font-brand text-[var(--gold-500)] text-xl md:hidden">Cyberlend</span>

      {/* Search */}
      <div className="flex-1 max-w-sm hidden md:flex items-center gap-2 bg-[var(--bg-raised)] border border-[rgba(243,234,216,0.1)] rounded-[6px] px-3 h-10">
        <Search className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
        <input
          type="text"
          placeholder="Search loans, clients…"
          onChange={(e) => onSearch?.(e.target.value)}
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button className="h-10 w-10 flex items-center justify-center rounded-[6px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors duration-150">
          <Bell className="h-5 w-5" />
        </button>
        <button className="h-10 w-10 flex items-center justify-center rounded-full bg-[var(--bg-raised)] border border-[rgba(243,234,216,0.1)] text-[var(--text-muted)] hover:text-[var(--gold-500)] transition-colors duration-150">
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
