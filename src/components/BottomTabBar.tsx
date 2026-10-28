import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, TrendingUp, ScrollText, Clock } from "lucide-react"
import { motion } from "framer-motion"

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
      "bg-[var(--bg-surface)] border-t border-[var(--border)]",
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
            aria-label={tab.label}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px]",
              "text-[10px] font-medium transition-colors duration-150",
              "focus:outline-none"
            )}
          >
            <span className="relative flex items-center justify-center w-9 h-9">
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: "var(--primary)", willChange: "transform", transform: "translateZ(0)" }}
                />
              )}
              <span
                className="relative z-10 transition-colors duration-150"
                style={{ color: isActive ? "var(--primary-foreground)" : "var(--text-muted)" }}
              >
                {tab.icon}
              </span>
            </span>
            <span
              className="transition-colors duration-150"
              style={{ color: isActive ? "var(--primary)" : "var(--text-muted)" }}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}


