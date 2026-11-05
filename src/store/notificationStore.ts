import { create } from "zustand";
import { Loan, LoanNotification, NotificationSeverity } from "../types";
import { toLocalISO, formatDate, formatCompactCurrency } from "../utils/loanCalculations";

const STORAGE_KEY = "cyberlend_notification_state";

const UPCOMING_WINDOW_DAYS = 3;
const OVERDUE_REPEAT_DAYS  = 7;
const DEFAULTER_THRESHOLD  = 30;

interface StoredState {
  read: string[];
  deleted: string[];
}

function loadState(): StoredState {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : { read: [], deleted: [] };
  } catch {
    return { read: [], deleted: [] };
  }
}
function saveState(s: StoredState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function buildMessages(loan: Loan, severity: NotificationSeverity, daysLeft: number, daysOverdue: number) {
  const amount = formatCompactCurrency(loan.monthlyPayment);
  const balance = formatCompactCurrency(loan.remainingBalance);
  const due = formatDate(loan.nextDueDate);

  switch (severity) {
    case "upcoming":
      return {
        message: `${loan.borrowerName}'s payment is due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
        detail: `Reminder: ${loan.borrowerName}'s payment of ${amount} is due on ${due} (${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining). Outstanding balance: ${balance}. Loan #${loan.loanNumber}.`,
      };
    case "dueToday":
      return {
        message: `${loan.borrowerName}'s payment is due today`,
        detail: `${loan.borrowerName}'s payment of ${amount} is due today (${due}). Outstanding balance: ${balance}. Loan #${loan.loanNumber}. Follow up to collect.`,
      };
    case "overdue":
      return {
        message: `${loan.borrowerName} is ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`,
        detail: `${loan.borrowerName} has missed their payment of ${amount}, originally due ${due} — now ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue. Outstanding balance: ${balance}. Loan #${loan.loanNumber}. Please follow up with the borrower.`,
      };
    case "defaulter":
      return {
        message: `${loan.borrowerName} is ${daysOverdue} days overdue — DEFAULTER`,
        detail: `DEFAULTER ALERT — ${loan.borrowerName}'s payment of ${amount} has been overdue for ${daysOverdue} days (originally due ${due}), past the ${DEFAULTER_THRESHOLD}-day default threshold. Outstanding balance: ${balance}. Loan #${loan.loanNumber}. Immediate action recommended.`,
      };
  }
}

function buildNotifications(loans: Loan[]): LoanNotification[] {
  const today = new Date();
  const out: LoanNotification[] = [];

  for (const loan of loans) {
    if (loan.status === "Completed" || !loan.nextDueDate) continue;

    const due = parseLocalDate(loan.nextDueDate);
    const diff = daysBetween(new Date(today), new Date(due));

    let severity: NotificationSeverity | null = null;
    let daysLeft = 0;
    let daysOverdue = 0;
    let bucketId = "";

    if (diff > 0 && diff <= UPCOMING_WINDOW_DAYS) {
      severity = "upcoming";
      daysLeft = diff;
      bucketId = `upcoming:${loan.id}:${loan.nextDueDate}`;
    } else if (diff === 0) {
      severity = "dueToday";
      bucketId = `dueToday:${loan.id}:${loan.nextDueDate}`;
    } else if (diff < 0) {
      daysOverdue = Math.abs(diff);
      severity = daysOverdue >= DEFAULTER_THRESHOLD ? "defaulter" : "overdue";
      const bucket = daysOverdue === 1 ? 1 : Math.floor((daysOverdue - 1) / OVERDUE_REPEAT_DAYS) * OVERDUE_REPEAT_DAYS + 1;
      bucketId = `${severity}:${loan.id}:${loan.nextDueDate}:${bucket}`;
    }

    if (!severity) continue;

    const { message, detail } = buildMessages(loan, severity, daysLeft, daysOverdue)!;

    out.push({
      id: bucketId,
      loanId: loan.id,
      loanNumber: loan.loanNumber,
      borrowerName: loan.borrowerName,
      type: severity === "upcoming" || severity === "dueToday" ? "upcoming" : "overdue",
      severity,
      dueDate: loan.nextDueDate,
      daysOverdue: daysOverdue || undefined,
      daysLeft: daysLeft || undefined,
      amountDue: loan.monthlyPayment,
      remainingBalance: loan.remainingBalance,
      message,
      detail,
      read: false,
      createdAt: toLocalISO(today),
    });
  }

  const rank: Record<NotificationSeverity, number> = { defaulter: 0, overdue: 1, dueToday: 2, upcoming: 3 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

interface NotificationState {
  notifications: LoanNotification[];
  unreadCount: number;
  generate: (loans: Loan[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  generate: (loans: Loan[]) => {
    const persisted = loadState();
    const built = buildNotifications(loans).filter((n) => !persisted.deleted.includes(n.id));
    const withReadState = built.map((n) => ({ ...n, read: persisted.read.includes(n.id) }));
    set({
      notifications: withReadState,
      unreadCount: withReadState.filter((n) => !n.read).length,
    });
  },

  markAsRead: (id: string) => {
    const s = loadState();
    if (!s.read.includes(id)) s.read.push(id);
    saveState(s);
    set((state) => {
      const notifications = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      return { notifications, unreadCount: notifications.filter((n) => !n.read).length };
    });
  },

  markAllAsRead: () => {
    const s = loadState();
    const ids = get().notifications.map((n) => n.id);
    s.read = Array.from(new Set([...s.read, ...ids]));
    saveState(s);
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  dismiss: (id: string) => {
    const s = loadState();
    if (!s.deleted.includes(id)) s.deleted.push(id);
    saveState(s);
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== id);
      return { notifications, unreadCount: notifications.filter((n) => !n.read).length };
    });
  },
}));
