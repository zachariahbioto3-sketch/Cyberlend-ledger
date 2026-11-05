import { useState } from "react";
import { Bell, X, ArrowLeft, Clock, AlertTriangle, ShieldAlert, ChevronDown } from "lucide-react";
import { useNotificationStore } from "../store/notificationStore";
import { formatDate } from "../utils/loanCalculations";
import { LoanNotification, NotificationSeverity } from "../types";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

const SEVERITY_STYLE: Record<NotificationSeverity, { bg: string; fg: string; icon: typeof Clock; dot: string }> = {
  upcoming:  { bg: "rgba(245,158,11,0.12)", fg: "text-amber-400",  icon: Clock,         dot: "bg-amber-500" },
  dueToday:  { bg: "rgba(245,158,11,0.18)", fg: "text-amber-400",  icon: Clock,         dot: "bg-amber-500" },
  overdue:   { bg: "rgba(239,68,68,0.12)",  fg: "text-red-400",    icon: AlertTriangle, dot: "bg-red-500" },
  defaulter: { bg: "rgba(127,29,29,0.22)",  fg: "text-red-500",    icon: ShieldAlert,   dot: "bg-red-700" },
};

function NotificationRow({
  n, expanded, onToggle, onDismiss,
}: { n: LoanNotification; expanded: boolean; onToggle: (id: string) => void; onDismiss: (id: string) => void }) {
  const style = SEVERITY_STYLE[n.severity];
  const Icon = style.icon;

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <div
        onClick={() => onToggle(n.id)}
        className="flex items-start gap-3 px-4 py-3 cursor-pointer"
        style={{ background: n.read ? "transparent" : "var(--bg-raised)" }}
      >
        <div className="p-2 rounded-xl shrink-0 mt-0.5" style={{ background: style.bg }}>
          <Icon className={`w-4 h-4 ${style.fg}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{n.message}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Due {formatDate(n.dueDate)}</p>
        </div>
        {!n.read && <span className={`w-2 h-2 rounded-full ${style.dot} shrink-0 mt-2`} />}
        <ChevronDown className={`w-4 h-4 shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`} style={{ color: "var(--muted-foreground)" }} />
        <button
          aria-label="Dismiss notification"
          onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--bg-raised)] transition-colors"
          style={{ color: "var(--muted-foreground)" }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-3 pl-[52px]">
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{n.detail}</p>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 gap-2">
      <Bell className="w-8 h-8" style={{ color: "var(--muted-foreground)" }} />
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No notifications</p>
    </div>
  );
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const { notifications, dismiss, markAsRead } = useNotificationStore();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!open) return null;

  const filtered = tab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const toggle = (id: string) => {
    setExpandedId((cur) => (cur === id ? null : id));
    markAsRead(id);
  };

  const list = (
    <>
      <div className="flex items-center gap-2 px-4 pt-3">
        <button
          onClick={() => setTab("all")}
          className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
          style={{
            background: tab === "all" ? "var(--primary)" : "var(--bg-raised)",
            color: tab === "all" ? "var(--primary-foreground)" : "var(--muted-foreground)",
          }}
        >
          All
        </button>
        <button
          onClick={() => setTab("unread")}
          className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
          style={{
            background: tab === "unread" ? "var(--primary)" : "var(--bg-raised)",
            color: tab === "unread" ? "var(--primary-foreground)" : "var(--muted-foreground)",
          }}
        >
          Unread
        </button>
      </div>
      <div className="flex-1 overflow-y-auto mt-2">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered.map((n) => (
            <NotificationRow key={n.id} n={n} expanded={expandedId === n.id} onToggle={toggle} onDismiss={dismiss} />
          ))
        )}
      </div>
    </>
  );

  return (
    <>
      <div className="hidden lg:block fixed inset-0 z-50" onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 right-6 w-[380px] max-h-[520px] rounded-[16px] border shadow-xl flex flex-col"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-1">
            <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Notifications</h3>
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--bg-raised)]" style={{ color: "var(--muted-foreground)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
          {list}
        </div>
      </div>

      <div className="lg:hidden fixed inset-0 z-50 flex flex-col" style={{ background: "var(--background)" }}>
        <div
          className="flex items-center gap-3 px-4 pb-3 border-b"
          style={{ borderColor: "var(--border)", paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          <button onClick={onClose} aria-label="Back" className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-base font-bold" style={{ color: "var(--foreground)" }}>Notifications</h3>
        </div>
        {list}
      </div>
    </>
  );
}
