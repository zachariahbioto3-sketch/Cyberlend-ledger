import { cn } from "@/lib/utils"
import { Search, User } from "lucide-react"
import { NotificationBell } from "./NotificationBell"

interface HeaderProps {
  onSearch?: (q: string) => void
  onOpenSettings?: () => void
  onOpenNotifications?: () => void
  className?: string
}

export function Header({ onSearch, onOpenSettings, onOpenNotifications, className }: HeaderProps) {
  return (
    <header className={cn(
      "flex items-center justify-between gap-4",
      "px-4 md:px-6 py-3 min-h-[64px]",
      "bg-[var(--bg-surface)]/80 border-b border-[var(--border)] backdrop-blur-md",
      "sticky top-0 z-30",
      "pt-[calc(env(safe-area-inset-top,0px)+12px)]",
      className
    )}>
      {/* Logo â€” mobile only */}
      <span className="font-brand text-[var(--foreground)] text-xl md:hidden">Cyberlend</span>

      {/* Search */}
      <div className="flex-1 max-w-sm hidden md:flex items-center gap-2 bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius-pill)] px-4 h-10">
        <Search className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
        <input
          type="text"
          placeholder="Search loans, clientsâ€¦"
          onChange={(e) => onSearch?.(e.target.value)}
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <NotificationBell onClick={() => onOpenNotifications?.()} />
        <button aria-label="Profile" onClick={onOpenSettings} className="h-11 w-11 flex items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] transition-colors duration-150">
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}









