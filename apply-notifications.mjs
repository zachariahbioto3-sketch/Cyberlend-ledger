import { readFileSync, writeFileSync, existsSync } from "fs";

function patch(path, edits) {
  if (!existsSync(path)) throw new Error(`Missing file: ${path}`);
  let src = readFileSync(path, "utf8");
  for (const [find, replace, label] of edits) {
    if (src.includes(replace)) { console.log(`  [skip] ${path} :: ${label} (already applied)`); continue; }
    if (!src.includes(find)) throw new Error(`Anchor not found in ${path} for "${label}".`);
    src = src.replace(find, replace);
    console.log(`  [ok]   ${path} :: ${label}`);
  }
  writeFileSync(path, src, "utf8");
}

console.log("Patching src/types/index.ts");
{
  const p = "src/types/index.ts";
  let src = readFileSync(p, "utf8");
  if (src.includes("LoanNotification")) { console.log("  [skip] already has LoanNotification type"); }
  else {
    src += `
export type NotificationType = "upcoming" | "overdue";

export interface LoanNotification {
  id: string;
  loanId: string;
  borrowerName: string;
  type: NotificationType;
  dueDate: string;
  daysOverdue?: number;
  message: string;
  read: boolean;
  createdAt: string;
}
`;
    writeFileSync(p, src, "utf8");
    console.log("  [ok]   appended LoanNotification type");
  }
}

console.log("Patching src/components/index.ts");
patch("src/components/index.ts", [
  [`export { GoalDrawer } from "./GoalDrawer";`,
   `export { GoalDrawer } from "./GoalDrawer";\nexport { NotificationBell } from "./NotificationBell";\nexport { NotificationPanel } from "./NotificationPanel";`,
   "export notification components"],
]);

console.log("Patching src/components/Header.tsx");
patch("src/components/Header.tsx", [
  [`import { Search, Bell, User } from "lucide-react"`,
   `import { Search, User } from "lucide-react"\nimport { NotificationBell } from "./NotificationBell"`,
   "swap Bell import for NotificationBell"],
  [`interface HeaderProps {\n  onSearch?: (q: string) => void\n  onOpenSettings?: () => void\n  className?: string\n}`,
   `interface HeaderProps {\n  onSearch?: (q: string) => void\n  onOpenSettings?: () => void\n  onOpenNotifications?: () => void\n  className?: string\n}`,
   "add onOpenNotifications prop type"],
  [`export function Header({ onSearch, onOpenSettings, className }: HeaderProps) {`,
   `export function Header({ onSearch, onOpenSettings, onOpenNotifications, className }: HeaderProps) {`,
   "destructure onOpenNotifications"],
  [`        <button aria-label="Notifications" className="h-11 w-11 flex items-center justify-center rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--bg-raised)] transition-colors duration-150">\n          <Bell className="h-5 w-5" />\n        </button>`,
   `        <NotificationBell onClick={() => onOpenNotifications?.()} />`,
   "replace static bell button with NotificationBell"],
]);

console.log("Patching src/App.tsx");
patch("src/App.tsx", [
  [`import { useLoanStore } from "./store/loanStore";`,
   `import { useLoanStore } from "./store/loanStore";\nimport { useNotificationStore } from "./store/notificationStore";`,
   "import notification store"],
  [`import { LoanLedgerTable, NewLoanModal, RecordPaymentModal, PdfExportModal, WaitlistPage } from "./components";`,
   `import { LoanLedgerTable, NewLoanModal, RecordPaymentModal, PdfExportModal, WaitlistPage, NotificationBell, NotificationPanel } from "./components";`,
   "import NotificationBell/Panel"],
  [`  const [settingsOpen,     setSettingsOpen]     = useState(false);`,
   `  const [settingsOpen,     setSettingsOpen]     = useState(false);\n  const [notificationsOpen, setNotificationsOpen] = useState(false);\n  const generateNotifications = useNotificationStore((s) => s.generate);\n  useEffect(() => { generateNotifications(loans); }, [loans]);`,
   "add notificationsOpen state + generate effect"],
  [`<Header onSearch={() => {}} onOpenSettings={() => setSettingsOpen(true)} />`,
   `<Header onSearch={() => {}} onOpenSettings={() => setSettingsOpen(true)} onOpenNotifications={() => setNotificationsOpen(true)} />`,
   "wire bell click on desktop Header"],
  [`            <button className="w-9 h-9 rounded-full border flex items-center justify-center" style={{ borderColor:"var(--border)", background:"var(--bg-raised)" }}>\n              <Bell className="w-4 h-4" style={{ color:"var(--muted-foreground)" }} />\n            </button>`,
   `            <NotificationBell variant="mobile" onClick={() => setNotificationsOpen(true)} />`,
   "replace mobile bell button"],
  [`          </div>\n        </div>\n      )}\n    </>`,
   `          </div>\n        </div>\n      )}\n\n      <NotificationPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />\n    </>`,
   "render NotificationPanel at end of App"],
]);

console.log("\nAll patches applied successfully.");
