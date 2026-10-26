import React, { useState, useMemo } from "react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { ToastProvider, useToast } from "./components/Toast";
import { useLoanStore } from "./store/loanStore";
import { Loan } from "./types";
import { LoanLedgerTable, NewLoanModal, RecordPaymentModal, LoanDetailModal, PdfExportModal, WaitlistPage } from "./components";
import { PortfolioDonut }      from "./components/PortfolioDonut";
import { MonthlyCollections }  from "./components/MonthlyCollections";
import { RepaymentProgress }   from "./components/RepaymentProgress";
import { FinancialStackedBar } from "./components/FinancialStackedBar";
import { ClientsPage }         from "./components/ClientsPage";
import { GrowthCharts }        from "./components/GrowthCharts";
import { GoalsModal }          from "./components/GoalsModal";
import { ClientEditModal }     from "./components/ClientEditModal";
import { GoalTracker }         from "./components/GoalTracker";
import { GoalDrawer }          from "./components/GoalDrawer";
import { TrackerBar }          from "./components/TrackerBar";
import { ClientProfilePanel }  from "./components/ClientProfilePanel";
import { AgreementsPage }      from "./components/AgreementsPage";
import { ExportMenu } from "./components/ExportMenu";
import { FaqGrid }             from "./components/FaqGrid";
import { Sidebar }             from "./components/Sidebar";
import { BottomTabBar }        from "./components/BottomTabBar";
import { Header }              from "./components/Header";
import { StatTile }            from "./components/StatTile";
import { AnimatedAmount }      from "./components/AnimatedAmount";
import { ConfirmDialog }       from "./components/ConfirmDialog";
import { Button }              from "./components/ui/button";
import { Download, PlusCircle, Bell, FileText, Trash2, Sun, Moon } from "lucide-react";
import { formatCompactCurrency } from "./utils/loanCalculations";

export type Theme = "dark" | "light";

// CSS-variable shim — keeps old child components working without modifying them
const t = {
  bg:           "var(--background)",
  bgCard:       "var(--card)",
  bgCardHover:  "var(--bg-raised)",
  bgSidebar:    "var(--card)",
  bgNav:        "var(--card)",
  bgInput:      "var(--input)",
  bgModal:      "var(--card)",
  bgBtn:        "var(--bg-raised)",
  bgActive:     "var(--bg-raised)",
  border:       "var(--border)",
  borderMid:    "var(--border-mid)",
  borderStrong: "var(--border-strong)",
  text:         "var(--foreground)",
  textMuted:    "var(--muted-foreground)",
  textFaint:    "var(--text-faint)",
  btnPrimary:   "var(--primary)",
  btnPrimaryTx: "var(--primary-foreground)",
  rowAlt:       "var(--row-alt)",
  rowHover:     "var(--row-hover)",
  progressBg:   "var(--progress-bg)",
  progressFill: "var(--primary)",
};

function AppInner() {
  const {
    loans, setLoans, addLoan, recordPayment, closeLoan, deleteLoan,
    deleteTransaction, metrics, selectedClient, setSelectedClient,
    totalCapital, setTotalCapital, goals, setGoals,
    removeFromWaitlist,
  } = useLoanStore();
  const { showToast } = useToast();

  const [capitalModalOpen, setCapitalModalOpen] = useState(false);
  const [goalsModalOpen,   setGoalsModalOpen]   = useState(false);
  const [clientEditTarget, setClientEditTarget] = useState<Loan | null>(null);
  const [capitalInput,     setCapitalInput]     = useState("");
  const [newLoanOpen,      setNewLoanOpen]      = useState(false);
  const [promotedEntry,    setPromotedEntry]    = useState<any>(null);
  const [paymentLoan,      setPaymentLoan]      = useState<Loan | null>(null);
  const [detailLoan,       setDetailLoan]       = useState<Loan | null>(null);
  const [mobileBorrowerLoans, setMobileBorrowerLoans] = useState<Loan[] | null>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const toggleTheme = () => { const d = !isDark; setIsDark(d); document.documentElement.classList.toggle("dark", d); localStorage.setItem("cyberlend-theme", d ? "dark" : "light"); };
  const [confirmReset,     setConfirmReset]     = useState(false);
  const [pdfOpen,          setPdfOpen]          = useState(false);
  const [mSearch,          setMSearch]          = useState("");
  const [mStatus,          setMStatus]          = useState("ALL");
  const [mobileTab,  setMobileTab]  = useState<"loans"|"analytics"|"clients"|"waitlist"|"agreements">("loans");
  const [desktopTab, setDesktopTab] = useState<"dashboard"|"clients"|"waitlist"|"agreements">("dashboard");

  const handleUpdateLoan    = (id: string, updates: Partial<any>) => useLoanStore.getState().updateLoan(id, updates);
  const handleSaveClientEdit = (id: string, updates: Partial<Loan>) => {
    setLoans(loans.map((l) => l.id === id ? { ...l, ...updates } : l));
    setClientEditTarget(null);
  };
  const handleSavePayment = (loanId: string, txs: any[]) => {
    txs.forEach((tx) => tx.paymentType === "Principal" ? closeLoan(loanId, tx) : recordPayment(loanId, tx));
    setPaymentLoan(null);
    showToast(txs.some((x) => x.paymentType === "Principal") ? "Loan settled and closed" : "Interest recorded – loan rolled over", "success");
  };
  const handleExportCSV = async () => {
    if (!loans.length) { showToast("No loans to export", "error"); return; }
    const headers = ["Loan #","Borrower","Phone","Principal","Total Due","Monthly","Paid","Remaining","Status"];
    const rows    = loans.map((l) => [l.loanNumber,l.borrowerName,l.borrowerPhone,l.loanAmount,l.totalRepayable,l.monthlyPayment,l.amountPaid,l.remainingBalance,l.status]);
    const csv     = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const filename = `cyberlend-${new Date().toISOString().split("T")[0]}.csv`;
    if (Capacitor.isNativePlatform()) {
      try { await Filesystem.writeFile({ path: filename, data: csv, directory: Directory.Documents, encoding: "utf8" as any, recursive: true }); showToast(`Saved: ${filename}`, "success"); }
      catch { showToast("Failed to save CSV", "error"); }
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = filename; a.click();
    }
  };
  const handleResetData = () => { setLoans([]); setConfirmReset(false); showToast("All data cleared", "info"); };

  const overdueLoans = loans.filter((l) => l.status === "Overdue");
  const mobileLoanGroups = useMemo(() => {
    const q = mSearch.trim().toLowerCase();
    const matches = loans.filter((l) => (!q || l.borrowerName.toLowerCase().includes(q) || l.borrowerPhone.includes(q) || l.loanNumber.toLowerCase().includes(q)) && (mStatus === "ALL" || l.status === mStatus));
    const groups = new Map<string, Loan[]>();
    matches.forEach((loan) => { const key = loan.borrowerPhone || loan.borrowerName; groups.set(key, [...(groups.get(key) || []), loan]); });
    return [...groups.values()].map((group) => group.sort((a, b) => new Date(b.originationDate).getTime() - new Date(a.originationDate).getTime()));
  }, [loans, mSearch, mStatus]);

  const statusStyle = (status: string) => ({
    Active:    { bg: "#DCE7FB", color: "#2552B0", border: "transparent" },
    Overdue:   { bg: "#F9DADA", color: "#A82F2F", border: "transparent" },
    Completed: { bg: "rgba(255,255,255,0.06)", color: "var(--muted-foreground)", border: "var(--border)" },
    Defaulted: { bg: "rgba(180,20,20,0.12)",  color: "#fca5a5",                border: "rgba(180,20,20,0.25)" },
  } as Record<string,{bg:string;color:string;border:string}>)[status] ?? { bg:"rgba(255,255,255,0.06)", color:"var(--muted-foreground)", border:"var(--border)" };

  return (
    <>
      {/* -- DESKTOP -- */}
      <div className="hidden lg:flex min-h-screen" style={{ background:"var(--background)" }}>
        <Sidebar active={desktopTab} onChange={setDesktopTab} />
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <Header onSearch={() => {}} />

          <div className="flex items-center justify-end gap-2 px-6 py-2 border-b" style={{ borderColor:"var(--border)" }}>
            <ExportMenu loans={loans} />
            <Button variant="ghost" size="sm" onClick={() => setPdfOpen(true)}><FileText className="w-3 h-3 mr-1"/>PDF</Button>
            
            <Button size="sm" onClick={() => setNewLoanOpen(true)}><PlusCircle className="w-3.5 h-3.5 mr-1"/>NEW LOAN</Button>
          </div>

          {/* Dashboard */}
          {desktopTab === "dashboard" && (
            <main className="flex-1 p-6 space-y-5 max-w-[1600px] mx-auto w-full">
              <div>
                <h1 className="cl-mono text-lg font-bold tracking-widest" style={{ color:"var(--foreground)" }}>PORTFOLIO OVERVIEW</h1>
              <p className="cl-mono text-[11px] tracking-widest mt-0.5" style={{ color:"var(--text-faint)" }}>BUILDING WEALTH TOGETHER</p>
              </div>

              {selectedClient && <TrackerBar metrics={metrics} theme={t} selectedClient={selectedClient} onClose={() => setSelectedClient(null)} />}
              {selectedClient && (
                <div className="px-6 py-4 overflow-y-auto">
                  <ClientProfilePanel client={selectedClient} metrics={metrics} theme={t} allLoans={loans} />
                </div>
              )}

              <GoalTracker goals={goals} metrics={metrics} loans={loans} theme={t} onEdit={() => setGoalsModalOpen(true)} />

              {/* Capital cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label:"AVAILABLE CAPITAL", value: metrics.availableCapital, sub: totalCapital > 0 ? `Total pool: ${formatCompactCurrency(totalCapital)}` : "Set total capital", color:"#14703F", border:"rgba(20,112,63,0.30)", action:true },
                  { label:"LENDABLE NOW",       value: metrics.lendableAmount,   sub:"80% of available capital", color:"#111214", border:"rgba(17,18,20,0.14)", action:false },
                  { label:"RETURNS PREV LOANS", value: metrics.returnsFromPreviousLoans, sub:`${metrics.completedLoansCount} completed loans`, color:"#111214", border:"rgba(17,18,20,0.14)", action:false },
                ].map((card) => (
                  <div key={card.label} className="rounded-[12px] p-5 border" style={{ background:"var(--card)", borderColor:card.border, borderLeftWidth:"3px" }}>
                    <div className="flex items-start justify-between">
                      <p className="cl-mono text-xs font-bold uppercase tracking-widest mb-3" style={{ color:"var(--text-faint)" }}>{card.label}</p>
                      {card.action && (
                        <button onClick={() => { setCapitalInput(String(totalCapital)); setCapitalModalOpen(true); }}
                          className="cl-mono text-[9px] font-bold px-2 py-0.5 rounded-lg border"
                          style={{ borderColor:card.border, color:card.color }}>SET</button>
                      )}
                    </div>
                    <AnimatedAmount value={card.value} className="cl-mono text-xl font-bold block mb-1" style={{ color:card.color }} />
                      <p className="cl-mono text-xs" style={{ color:"var(--text-faint)" }}>{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* KPI stat tiles */}
              <div className={`grid grid-cols-4 gap-3 transition-all duration-300 ${selectedClient ? "opacity-0 max-h-0 overflow-hidden pointer-events-none" : "opacity-100"}`}>
                <StatTile label="TOTAL LENT"  value={formatCompactCurrency(metrics.totalPrincipalLent)} />
                <StatTile label="OUTSTANDING" value={formatCompactCurrency(metrics.totalOutstanding)} />
                <StatTile label="COLLECTED"   value={formatCompactCurrency(metrics.totalCollected)} />
                <StatTile label="NET PROFIT"  value={formatCompactCurrency(metrics.totalProfit)} />
              </div>

              {/* Overdue alert */}
              {overdueLoans.length > 0 && (
                <div className="rounded-[12px] p-4 border flex items-start gap-3" style={{ background:"rgba(239,68,68,0.07)", borderColor:"rgba(239,68,68,0.20)" }}>
                  <div className="p-2 rounded-xl shrink-0" style={{ background:"rgba(239,68,68,0.12)" }}>
                    <Bell className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h4 className="cl-mono text-sm font-bold" style={{ color:"var(--foreground)" }}>{overdueLoans.length} OVERDUE — COLLECT NOW</h4>
                    <div className="mt-1 flex flex-wrap gap-x-4 text-xs" style={{ color:"var(--muted-foreground)" }}>
                      {overdueLoans.map((l) => (
                        <span key={l.id}><span className="font-semibold" style={{ color:"var(--foreground)" }}>{l.borrowerName}</span> — {formatCompactCurrency(l.monthlyPayment)} overdue</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Charts */}
              <div className={`transition-all duration-300 ${selectedClient ? "opacity-0 max-h-0 overflow-hidden" : "opacity-100"}`}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <PortfolioDonut metrics={metrics} />
                  <MonthlyCollections loans={loans} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <RepaymentProgress loans={loans} />
                  <FinancialStackedBar loans={loans} />
                </div>
              </div>
              <GrowthCharts loans={loans} theme={t} />
              <LoanLedgerTable loans={loans} onSelectLoan={setDetailLoan} onRecordPayment={setPaymentLoan} onDeleteLoan={deleteLoan} onOpenNewLoan={() => setNewLoanOpen(true)} theme={t} />
              <FaqGrid />
            </main>
          )}

          {desktopTab === "clients"    && <div className="flex-1 overflow-hidden"><ClientsPage loans={loans} theme={t} onUpdateLoan={handleUpdateLoan} onEditClient={(l) => setClientEditTarget(l)} onRegisterSuccess={() => showToast("Client registered & added to waitlist","success")} /></div>}
          {desktopTab === "waitlist"   && <div className="flex-1 overflow-hidden"><WaitlistPage theme={t} onPromoteToLoan={(e) => { setPromotedEntry(e); setNewLoanOpen(true); }} /></div>}
          {desktopTab === "agreements" && <div className="flex-1 overflow-auto"><AgreementsPage theme={t} /></div>}
        </div>
      </div>

      {/* -- MOBILE -- */}
      <div className="lg:hidden min-h-screen" style={{ background:"var(--background)" }}>
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b" style={{ borderColor:"var(--border)", paddingTop:"max(1rem, env(safe-area-inset-top))" }}>
          <span className="font-brand text-xl" style={{ color:"var(--foreground)" }}>Cyberlend</span>
          <div className="flex gap-2">
            <ExportMenu loans={loans} />
            <button onClick={toggleTheme} className="w-9 h-9 rounded-full border flex items-center justify-center" style={{ borderColor:"var(--border)", background:"var(--bg-raised)" }}>
              {isDark ? <Sun className="w-4 h-4" style={{ color:"var(--muted-foreground)" }} /> : <Moon className="w-4 h-4" style={{ color:"var(--muted-foreground)" }} />}
            </button>
            <button className="w-9 h-9 rounded-full border flex items-center justify-center" style={{ borderColor:"var(--border)", background:"var(--bg-raised)" }}>
              <Bell className="w-4 h-4" style={{ color:"var(--muted-foreground)" }} />
            </button>
            <button onClick={() => setNewLoanOpen(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background:"var(--primary)" }}>
              <PlusCircle className="w-4 h-4" style={{ color:"var(--primary-foreground)" }} />
            </button>
          </div>
        </div>

        {mobileTab === "loans" && (
          <>
            {/* Hero KPI */}
            <div className="mx-4 mt-4 rounded-[12px] p-5 border relative overflow-hidden" style={{ background:"var(--bg-raised)", borderColor:"var(--border)" }}>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 opacity-5"><img src="/logo.png" alt="" className="w-full h-full object-contain" /></div>
              <p className="cl-mono text-[10px] uppercase tracking-widest mb-1" style={{ color:"var(--muted-foreground)" }}>Total outstanding</p>
              <AnimatedAmount value={metrics.totalOutstanding} className="cl-mono text-4xl font-bold block mb-4" style={{ color:"var(--foreground)" }} />
              <div className="grid grid-cols-2 gap-2 pt-4 border-t" style={{ borderColor:"var(--border)" }}>
                {[
                  { label:"LENT",      value: metrics.totalPrincipalLent, raw:false },
                  { label:"COLLECTED", value: metrics.totalCollected,     raw:false },
                  { label:"PROFIT",    value: metrics.totalProfit,        raw:false },
                  { label:"ACTIVE",    value: metrics.activeLoansCount,   raw:true  },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="cl-mono text-[8px] uppercase tracking-widest mb-0.5" style={{ color:"#5F6472" }}>{s.label}</p>
                    {s.raw
                      ? <p className="cl-mono text-xs font-bold" style={{ color:"var(--foreground)" }}>{s.value}</p>
                      : <AnimatedAmount value={s.value as number} className="cl-mono text-xs font-bold" style={{ color:"var(--foreground)" }} />
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* Capital mini-cards */}
            <div className="px-4 mt-3 grid grid-cols-3 gap-2">
              {[
                { label:"AVAILABLE", value: metrics.availableCapital, color:"#14703F", border:"rgba(20,112,63,0.30)", action:true },
                { label:"LENDABLE",  value: metrics.lendableAmount,   color:"#111214", border:"rgba(17,18,20,0.14)", action:false },
                { label:"RETURNS",   value: metrics.returnsFromPreviousLoans, color:"#111214", border:"rgba(17,18,20,0.14)", action:false },
              ].map((c) => (
                <div key={c.label} onClick={() => { if (c.action) { setCapitalInput(String(totalCapital)); setCapitalModalOpen(true); } }}
                  className={`rounded-[10px] p-3 border ${c.action ? "cursor-pointer" : ""}`}
                  style={{ background:"var(--card)", borderColor:c.border, borderLeftWidth:"3px" }}>
                  <div className="flex items-start justify-between gap-1">
                    <p className="cl-mono text-[8px] font-bold uppercase tracking-widest mb-1" style={{ color:"#5F6472" }}>{c.label}</p>
                    {c.action && <span className="cl-mono text-[8px] font-bold px-1 py-0.5 rounded border" style={{ borderColor:c.border, color:c.color }}>SET</span>}
                  </div>
                  <AnimatedAmount value={c.value} className="cl-mono text-xs font-bold" style={{ color:c.color }} />
                </div>
              ))}
            </div>

            {/* Overdue alert */}
            {overdueLoans.length > 0 && (
              <div className="mx-4 mt-3 rounded-[10px] p-3 border flex items-start gap-2" style={{ background:"rgba(239,68,68,0.07)", borderColor:"rgba(239,68,68,0.20)" }}>
                <Bell className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="cl-mono text-xs font-bold" style={{ color:"#f87171" }}>{overdueLoans.length} OVERDUE — COLLECT NOW</p>
                  {overdueLoans.map((l) => (
                    <p key={l.id} className="cl-mono text-[10px] mt-0.5" style={{ color:"var(--muted-foreground)" }}>
                      <span style={{ color:"var(--foreground)", fontWeight:700 }}>{l.borrowerName}</span> — {formatCompactCurrency(l.monthlyInterest)} due
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="px-4 mt-3 grid grid-cols-1 gap-2 mb-4">
              {[
                { label:"NEW",    icon:<PlusCircle className="w-5 h-5"/>, action:() => setNewLoanOpen(true), gold:true },
              ].map((btn) => (
                <button key={btn.label} onClick={btn.action}
                  className="flex flex-col items-center gap-2 py-3 rounded-[10px] border transition-all active:scale-95"
                  style={{ background:"var(--card)", borderColor:"var(--border)" }}>
                  <div style={{ color:"var(--foreground)" }}>{btn.icon}</div>
                  <span className="cl-mono text-[8px] font-bold uppercase tracking-widest" style={{ color:"#5F6472" }}>{btn.label}</span>
                </button>
              ))}
            </div>

            {/* Loan list */}
            <div className="px-4 pb-28">
              <div className="flex items-center justify-between mb-3">
                <h2 className="cl-mono text-[10px] font-bold uppercase tracking-widest" style={{ color:"#5F6472" }}>LOANS</h2>
                <span className="cl-mono text-[10px]" style={{ color:"#5F6472" }}>{loans.length} RECORDS</span>
              </div>
              <div className="mb-3 space-y-2">
                <input type="text" value={mSearch} onChange={(e) => setMSearch(e.target.value)} placeholder="Search name, phone, loan no..."
                  className="w-full px-3 py-2 cl-mono text-xs rounded-[8px] border focus:outline-none"
                  style={{ background:"var(--input)", borderColor:"var(--border)", color:"var(--foreground)" }} />
                <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth:"none" }}>
                  {["ALL","Active","Overdue","Completed","Defaulted"].map((s) => (
                    <button key={s} onClick={() => setMStatus(s)}
                      className="px-3 py-1.5 rounded-full border whitespace-nowrap cl-mono text-[10px] font-bold shrink-0 transition-colors"
                      style={{ background:mStatus===s ? "var(--primary)" : "var(--card)", color:mStatus===s ? "var(--primary-foreground)" : "var(--muted-foreground)", borderColor:mStatus===s ? "var(--primary)" : "var(--border)" }}>
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {mobileLoanGroups.map((group) => {
                    const loan = group[0];
                    const ss = statusStyle(group.some((item) => item.status === "Overdue") ? "Overdue" : loan.status);
                    const remaining = group.reduce((sum, item) => sum + item.remainingBalance, 0);
                    return (
                      <div key={loan.borrowerPhone || loan.borrowerName}
                        className="rounded-[10px] p-4 border flex items-center justify-between cursor-pointer transition-all active:scale-99"
                        style={{ background:"var(--card)", borderColor:"var(--border)" }}>
                        <div className="flex items-center gap-3 flex-1" onClick={() => setMobileBorrowerLoans(group)}>
                          <div className="w-9 h-9 rounded-full border flex items-center justify-center shrink-0" style={{ background:"var(--bg-raised)", borderColor:"var(--border)" }}>
                            {loan.borrowerPhoto ? (
                              <img src={loan.borrowerPhoto} alt={loan.borrowerName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="cl-mono text-xs font-bold" style={{ color:"var(--foreground)" }}>{loan.borrowerName.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold" style={{ color:"var(--foreground)" }}>{loan.borrowerName}</p>
                            <p className="cl-mono text-[10px]" style={{ color:"var(--text-faint)" }}>{group.length} LOAN{group.length === 1 ? "" : "S"} · {loan.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right" onClick={() => setMobileBorrowerLoans(group)}>
                            <p className="cl-mono text-xs font-bold" style={{ color:"var(--foreground)" }}>{formatCompactCurrency(remaining)}</p>
                            <span className="cl-mono text-[9px] font-bold border rounded-full px-1.5 py-0.5" style={{ background:ss.bg, color:ss.color, borderColor:ss.border }}>{loan.status.toUpperCase()}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setMobileBorrowerLoans(group); }}
                            className="p-2 rounded-[8px] border" style={{ background:"var(--bg-raised)", borderColor:"var(--border)" }}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </>
        )}

        {mobileTab === "analytics"  && <div className="px-4 pb-28 pt-4 space-y-3"><PortfolioDonut metrics={metrics} compact /><MonthlyCollections loans={loans} compact /><RepaymentProgress loans={loans} compact /><FinancialStackedBar loans={loans} compact /><GrowthCharts loans={loans} theme={t} /></div>}
        {mobileTab === "clients"    && <div className="pb-28"><ClientsPage loans={loans} theme={t} onUpdateLoan={handleUpdateLoan} onEditClient={(l) => setClientEditTarget(l)} onRegisterSuccess={() => showToast("Client registered & added to waitlist","success")} /></div>}
        {mobileTab === "waitlist"   && <div className="pb-28"><WaitlistPage theme={t} onPromoteToLoan={(e) => { setPromotedEntry(e); setNewLoanOpen(true); }} /></div>}
        {mobileTab === "agreements" && <div className="pb-28"><AgreementsPage theme={t} /></div>}

        {mobileBorrowerLoans && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMobileBorrowerLoans(null)}>
            <div className="w-full max-w-sm rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }} onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between"><div><p className="cl-mono text-sm font-bold" style={{ color: "var(--foreground)" }}>{mobileBorrowerLoans[0].borrowerName}</p><p className="cl-mono text-[10px]" style={{ color: "var(--text-faint)" }}>{mobileBorrowerLoans.length} LOANS</p></div><button onClick={() => setMobileBorrowerLoans(null)} style={{ color: "var(--text-faint)" }}>CLOSE</button></div>
              <div className="space-y-2">{mobileBorrowerLoans.map((loan) => <button key={loan.id} onClick={() => { setMobileBorrowerLoans(null); setDetailLoan(loan); }} className="flex w-full items-center justify-between rounded-xl border p-3 text-left" style={{ borderColor: "var(--border)" }}><span><span className="block cl-mono text-xs font-bold" style={{ color: "var(--foreground)" }}>{loan.loanNumber}</span><span className="block cl-mono text-[10px]" style={{ color: "var(--text-faint)" }}>{loan.category}</span></span><span className="text-right"><span className="block cl-mono text-xs font-bold" style={{ color: "var(--foreground)" }}>{formatCompactCurrency(loan.remainingBalance)}</span><span className="block cl-mono text-[9px]" style={{ color: "var(--muted-foreground)" }}>{loan.status}</span></span></button>)}</div>
            </div>
          </div>
        )}

        <BottomTabBar active={mobileTab} onChange={setMobileTab} />
      </div>

      {/* -- MODALS -- */}
      {capitalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)" }}>
          <div className="rounded-[12px] p-6 border w-full max-w-sm" style={{ background:"var(--card)", borderColor:"var(--border)" }}>
            <p className="cl-mono text-sm font-bold tracking-widest mb-1" style={{ color:"var(--foreground)" }}>SET TOTAL CAPITAL</p>
            <p className="cl-mono text-[10px] mb-4" style={{ color:"#5F6472" }}>Total pool of money available to the lending business.</p>
            <input type="number" value={capitalInput} onChange={(e) => setCapitalInput(e.target.value)} placeholder="e.g. 500000"
              className="w-full px-4 py-3 rounded-[8px] border cl-mono text-sm mb-4 outline-none focus:border-[var(--primary)]"
              style={{ background:"var(--input)", borderColor:"var(--border)", color:"var(--foreground)" }} />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setCapitalModalOpen(false)}>CANCEL</Button>
              <Button className="flex-1" onClick={() => { const v=parseFloat(capitalInput); if(!isNaN(v)&&v>0){setTotalCapital(v);setCapitalModalOpen(false);} }}>SAVE</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmReset} title="Clear all data?" description="This permanently deletes all loans, clients and transactions. Cannot be undone." confirmLabel="Clear everything" destructive onConfirm={handleResetData} onCancel={() => setConfirmReset(false)} />
      <ClientEditModal isOpen={clientEditTarget !== null} onClose={() => setClientEditTarget(null)} loan={clientEditTarget} onSave={handleSaveClientEdit} theme={t} />
      <GoalDrawer goals={goals} metrics={metrics} loans={loans} theme={t} onEdit={() => setGoalsModalOpen(true)} />
      <GoalsModal isOpen={goalsModalOpen} onClose={() => setGoalsModalOpen(false)} goals={goals} onSave={setGoals} theme={t} />
      <PdfExportModal isOpen={pdfOpen} onClose={() => setPdfOpen(false)} loans={loans} metrics={metrics} theme={t} />
      <NewLoanModal isOpen={newLoanOpen} onClose={() => { setNewLoanOpen(false); setPromotedEntry(null); }} onAddLoan={(data) => { addLoan(data); if(promotedEntry?.id){removeFromWaitlist(promotedEntry.id);showToast("Client promoted to active borrower","success");}else{showToast("Loan created successfully","success");} setNewLoanOpen(false); setPromotedEntry(null); }} theme={t} prefillClient={promotedEntry ? { borrowerName:promotedEntry.name, borrowerPhone:promotedEntry.phone, borrowerEmail:promotedEntry.email||"", borrowerPhoto:promotedEntry.borrowerPhoto||"", occupation:promotedEntry.occupation, loanPurpose:promotedEntry.purpose, borrowerIdNumber:promotedEntry.idNumber||"", borrowerAddress:promotedEntry.address||"", kraPin:promotedEntry.kraPin||"", referralSource:promotedEntry.referralSource||"", clientNotes:promotedEntry.notes||"", clientFlags:["New"] } as any : null} />
      <RecordPaymentModal isOpen={!!paymentLoan} loan={paymentLoan} onClose={() => setPaymentLoan(null)} onSavePayment={handleSavePayment} theme={t} />
      <LoanDetailModal loan={detailLoan} onClose={() => setDetailLoan(null)} onRecordPayment={(loan) => { setDetailLoan(null); setPaymentLoan(loan); }} onDeleteLoan={deleteLoan} onDeleteTransaction={deleteTransaction} theme={t} />
    </>
  );
}

export default function App() { return <ToastProvider><AppInner /></ToastProvider>; }



























