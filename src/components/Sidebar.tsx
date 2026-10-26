import { useState } from "react"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, TrendingUp, ScrollText, Clock, ChevronLeft, ChevronRight } from "lucide-react"

type Tab = "dashboard" | "clients" | "waitlist" | "agreements"

interface SidebarProps {
  active: Tab
  onChange: (tab: Tab) => void
}

const nav: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard",  label: "Dashboard",  icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: "clients",    label: "Clients",    icon: <Users className="h-5 w-5" /> },
  { id: "waitlist",   label: "Waitlist",   icon: <Clock className="h-5 w-5" /> },
  { id: "agreements", label: "Agreements", icon: <ScrollText className="h-5 w-5" /> },
]

export function Sidebar({ active, onChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      "hidden md:flex flex-col",
      "bg-[var(--bg-surface)] border-r border-[var(--border)]",
      "transition-all duration-200 ease-out",
      "h-screen sticky top-0 z-40",
      collapsed ? "w-[64px]" : "w-[220px]"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 min-h-[64px]">
        <span className="font-brand text-[var(--primary)] text-xl shrink-0">CL</span>
        {!collapsed && (
          <span className="font-brand text-[var(--foreground)] text-base leading-tight">
            Cyberlend
          </span>
        )}
      </div>


      {/* Nav */}
      <nav className="flex flex-col gap-1 px-2 pt-4 flex-1">
        {nav.map((item) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[8px] w-full text-left",
                "text-sm font-medium transition-colors duration-150 min-h-[44px]",
                isActive
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[8px]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--bg-raised)] hover:text-[var(--foreground)]"
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-11 w-full border-t border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-150"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  )
}






