import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, TrendingUp, ScrollText, Clock } from "lucide-react"

type Tab = "loans" | "analytics" | "clients" | "waitlist" | "agreements"

interface BottomTabBarProps {
  active: Tab
  onChange: (tab: Tab) => void
}

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "loans",      label: "Loans",     icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: "analytics",  label: "Analytics", icon: <TrendingUp className="h-5 w-5" /> },
  { id: "clients",    label: "Clients",   icon: <Users className="h-5 w-5" /> },
  { id: "waitlist",   label: "Waitlist",  icon: <Clock className="h-5 w-5" /> },
  { id: "agreements", label: "Docs",      icon: <ScrollText className="h-5 w-5" /> },
]

export function BottomTabBar({ active, onChange }: BottomTabBarProps) {
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-white/80 border-t border-[var(--border)] backdrop-blur-md",
      "flex items-stretch",
      "pb-[env(safe-area-inset-bottom,0px)]",
      "md:hidden"
    )}>
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px]",
              "text-[10px] font-medium transition-colors duration-150",
              "focus:outline-none",
              isActive
                ? "text-[var(--primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            <span className={cn(
              "transition-colors duration-150 relative",
              isActive && "text-[var(--primary)]"
            )}>
              {tab.icon}
            </span>
            {tab.label}
            {isActive && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--primary)]" />
            )}
          </button>
        )
      })}
    </nav>
  )
}




