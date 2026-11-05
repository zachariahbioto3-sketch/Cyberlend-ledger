import { Bell } from "lucide-react";
import { useNotificationStore } from "../store/notificationStore";

interface NotificationBellProps {
  onClick: () => void;
  variant?: "desktop" | "mobile";
}

export function NotificationBell({ onClick, variant = "desktop" }: NotificationBellProps) {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const display = unreadCount > 9 ? "9+" : String(unreadCount);

  const className =
    variant === "mobile"
      ? "relative w-9 h-9 rounded-full border flex items-center justify-center"
      : "relative h-11 w-11 flex items-center justify-center rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--bg-raised)] transition-colors duration-150";

  const style = variant === "mobile" ? { borderColor: "var(--border)", background: "var(--bg-raised)" } : undefined;

  return (
    <button aria-label="Notifications" onClick={onClick} className={className} style={style}>
      <Bell className={variant === "mobile" ? "w-4 h-4" : "h-5 w-5"} style={variant === "mobile" ? { color: "var(--muted-foreground)" } : undefined} />
      {unreadCount > 0 && (
        <span
          className="absolute top-1 right-1 min-w-[16px] h-[16px] px-[3px] rounded-full bg-red-500 text-white text-[10px] font-bold leading-[16px] text-center"
          style={{ transform: "translate(25%,-25%)" }}
        >
          {display}
        </span>
      )}
    </button>
  );
}
