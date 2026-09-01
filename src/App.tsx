import React, { useState, useEffect } from "react";
import { useLoanStore } from "./store/loanStore";
import { sampleLoans } from "./data/sampleLoans";
import { Loan } from "./types";
import { LoanLedgerTable, NewLoanModal, RecordPaymentModal, LoanDetailModal, PdfExportModal } from "./components";
import { PortfolioDonut } from "./components/PortfolioDonut";
import { MonthlyCollections } from "./components/MonthlyCollections";
import { RepaymentProgress } from "./components/RepaymentProgress";
import { ClientsPage } from "./components/ClientsPage";
import { FinancialStackedBar } from "./components/FinancialStackedBar";
import { LayoutDashboard, Users, TrendingUp, Download, RotateCcw, PlusCircle, Bell, Sun, Moon, FileText } from "lucide-react";
import { formatCompactCurrency } from "./utils/loanCalculations";

export type Theme = "dark" | "light";

function App() {
  const { loans, setLoans, addLoan, recordPayment, deleteLoan, metrics } = useLoanStore();
  const [newLoanOpen, setNewLoanOpen]   = useState(false);
  const [paymentLoan, setPaymentLoan]   = useState<Loan | null>(null);
  const [detailLoan,  setDetailLoan]    = useState<Loan | null>(null);
  const [mobileTab,   setMobileTab]     = useState<"loans" | "analytics" | "clients">("loans");
  const [pdfOpen,     setPdfOpen]       = useState(false);
  const handleUpdateLoan = (id: string, updates: Partial<any>) => {
    const updated = loans.map((l) => l.id === id ? { ...l, ...updates } : l);
    setLoans(updated);
  };
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("cyberlend_theme") as Theme) || "dark");

  const isDark = theme === "dark";
  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("cyberlend_theme", next);
  };

  useEffect(() => { if (loans.length === 0) setLoans(sampleLoans); }, []);

  const handleSavePayment = (loanId: string, transaction: any) => { recordPayment(loanId, transaction); setPaymentLoan(null); };

  const handleExportCSV = () => {
    if (loans.length === 0) { alert("No loans to export"); return; }
    const headers = ["Loan #","Borrower","Phone","Principal","Total Due","Monthly","Paid","Remaining","Status"];
    const rows = loans.map((l) => [l.loanNumber,l.borrowerName,l.borrowerPhone,l.loanAmount,l.totalRepayable,l.monthlyPayment,l.amountPaid,l.remainingBalance,l.status]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `cyberlend-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleResetData = () => { if (confirm("Reset to sample data?")) setLoans(sampleLoans); };

  // Claude-style dark mode — deep gray surfaces, not pure black
  const t = isDark ? {
    bg:           "#0f1117",
    bgCard:       "#1a1d27",
    bgCardHover:  "#1f2235",
    bgSidebar:    "#13151f",
    bgNav:        "rgba(19,21,31,0.95)",
    bgInput:      "#12141e",
    bgModal:      "#1a1d27",
    bgBtn:        "#22253a",
    bgActive:     "#2a2d42",
    border:       "rgba(255,255,255,0.08)",
    borderMid:    "rgba(255,255,255,0.14)",
    borderStrong: "rgba(255,255,255,0.25)",
    text:         "#e8eaf0",
    textMuted:    "rgba(232,234,240,0.55)",
    textFaint:    "rgba(232,234,240,0.30)",
    btnPrimary:   "#5b7cfa",
    btnPrimaryTx: "#ffffff",
    rowAlt:       "rgba(255,255,255,0.02)",
    rowHover:     "rgba(255,255,255,0.04)",
    progressBg:   "rgba(255,255,255,0.10)",
    progressFill: "#5b7cfa",
  } : {
    bg:           "#f0f2f8",
    bgCard:       "#ffffff",
    bgCardHover:  "#f7f8fc",
    bgSidebar:    "#ffffff",
    bgNav:        "rgba(255,255,255,0.95)",
    bgInput:      "#f0f2f8",
    bgModal:      "#ffffff",
    bgBtn:        "#f0f2f8",
    bgActive:     "#e4e7f5",
    border:       "rgba(0,0,0,0.08)",
    borderMid:    "rgba(0,0,0,0.13)",
    borderStrong: "rgba(0,0,0,0.22)",
    text:         "#0f1117",
    textMuted:    "rgba(15,17,23,0.55)",
    textFaint:    "rgba(15,17,23,0.35)",
    btnPrimary:   "#5b7cfa",
    btnPrimaryTx: "#ffffff",
    rowAlt:       "rgba(0,0,0,0.02)",
    rowHover:     "rgba(0,0,0,0.04)",
    progressBg:   "rgba(0,0,0,0.08)",
    progressFill: "#5b7cfa",
  };

  const mono = "'Space Mono', monospace";

  const statusStyle = (status: string) => {
    const map: Record<string, { bg: string; color: string; border: string }> = {
      Active:    { bg: isDark ? "rgba(91,124,250,0.15)" : "rgba(91,124,250,0.10)", color: "#5b7cfa",  border: "rgba(91,124,250,0.25)" },
      Overdue:   { bg: "rgba(239,68,68,0.12)",  color: "#f87171",  border: "rgba(239,68,68,0.25)" },
      Completed: { bg: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: t.textMuted, border: t.border },
      Defaulted: { bg: "rgba(180,20,20,0.12)",  color: "#fca5a5",  border: "rgba(180,20,20,0.25)" },
    };
    return map[status] || map.Completed;
  };

  return (
    <div className="min-h-screen flex" style={{ background: t.bg, transition: "background 0.3s, color 0.3s" }}>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-16 items-center py-6 gap-4 fixed h-full z-40 border-r"
        style={{ background: t.bgSidebar, borderColor: t.border }}>
        <div className="w-10 h-10 rounded-xl overflow-hidden border mb-3" style={{ borderColor: t.borderMid }}>
          <img src="/logo.png" alt="Cyberlend" className="w-full h-full object-cover" />
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          {[
            { icon: <LayoutDashboard className="w-4 h-4" />, label: "Dashboard", active: true },
            { icon: <Users className="w-4 h-4" />, label: "Borrowers" },
            { icon: <TrendingUp className="w-4 h-4" />, label: "Analytics" },
            { icon: <Users className="w-4 h-4" />, label: "Clients", active: false },
          ].map((item) => (
            <button key={item.label} title={item.label}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: item.active ? t.bgActive : "transparent",
                color: item.active ? t.text : t.textFaint,
                border: `1px solid ${item.active ? t.borderMid : "transparent"}`,
              }}>
              {item.icon}
            </button>
          ))}
        </nav>
        <div className="flex flex-col gap-2">
          <button onClick={toggleTheme} title="Toggle theme"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ color: t.textMuted, border: `1px solid ${t.border}`, background: t.bgBtn }}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={handleExportCSV} title="Export"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ color: t.textFaint }}><Download className="w-4 h-4" /></button>
          <button onClick={handleResetData} title="Reset"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ color: t.textFaint }}><RotateCcw className="w-4 h-4" /></button>
        </div>
      </aside>

      <div className="flex-1 md:ml-16 flex flex-col">

        {/* DESKTOP NAVBAR */}
        <header className="hidden md:flex sticky top-0 z-30 h-14 items-center px-6 gap-4 border-b"
          style={{ background: t.bgNav, backdropFilter: "blur(20px)", borderColor: t.border }}>
          <div className="flex items-center gap-3 min-w-[220px]">
            <div className="w-8 h-8 rounded-lg overflow-hidden border" style={{ borderColor: t.borderMid }}>
              <img src="/logo.png" alt="Cyberlend" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-widest" style={{ fontFamily: mono, color: t.text }}>CYBERLEND</span>
              <p className="text-[8px] tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>BUILDING WEALTH TOGETHER</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-5 text-xs ml-4">
            {[
              { label: "LENT",        value: formatCompactCurrency(metrics.totalPrincipalLent) },
              { label: "OUTSTANDING", value: formatCompactCurrency(metrics.totalOutstanding) },
              { label: "COLLECTED",   value: formatCompactCurrency(metrics.totalCollected) },
              { label: "PROFIT",      value: formatCompactCurrency(metrics.totalProfit) },
            ].map((m, i) => (
              <React.Fragment key={m.label}>
                {i > 0 && <div className="w-px h-5" style={{ background: t.border }} />}
                <div>
                  <p className="text-[9px] uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>{m.label}</p>
                  <p className="font-bold text-xs" style={{ fontFamily: mono, color: t.text }}>{m.value}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{ background: t.bgBtn, borderColor: t.border, color: t.textMuted }}>
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span style={{ fontFamily: mono }}>{isDark ? "LIGHT" : "DARK"}</span>
            </button>
            <button onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{ background: t.bgBtn, borderColor: t.border, color: t.textMuted }}>
              <Download className="w-3 h-3" /> Export
            </button>
            <button onClick={() => setPdfOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{ background: t.bgBtn, borderColor: t.border, color: t.textMuted }}>
              <FileText className="w-3 h-3" /> PDF
            </button>
            <button onClick={handleResetData} className="p-1.5 rounded-lg" style={{ color: t.textFaint }}>
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setNewLoanOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg"
              style={{ fontFamily: mono, background: t.btnPrimary, color: t.btnPrimaryTx }}>
              <PlusCircle className="w-3.5 h-3.5" /> NEW LOAN
            </button>
          </div>
        </header>

        {/* MOBILE */}
        <div className="md:hidden min-h-screen" style={{ background: t.bg }}>
          <div className="px-5 pt-8 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border" style={{ borderColor: t.borderMid }}>
                <img src="/logo.png" alt="Cyberlend" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>Portfolio</p>
                <p className="text-sm font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>CYBERLEND</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme}
                className="w-8 h-8 rounded-full border flex items-center justify-center"
                style={{ borderColor: t.border, background: t.bgBtn, color: t.textMuted }}>
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button className="w-8 h-8 rounded-full border flex items-center justify-center"
                style={{ borderColor: t.border, background: t.bgBtn }}>
                <Bell className="w-4 h-4" style={{ color: t.textMuted }} />
              </button>
            </div>
          </div>

          {/* Hero card */}
          <div className="mx-4 rounded-3xl p-6 mb-5 border relative overflow-hidden"
            style={{ background: isDark ? "#1e2235" : "#1a1d27", borderColor: "rgba(91,124,250,0.25)" }}>
            <div className="absolute -bottom-6 -right-6 w-36 h-36 opacity-10">
              <img src="/logo.png" alt="" className="w-full h-full object-contain" />
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1" style={{ fontFamily: mono }}>TOTAL OUTSTANDING</p>
            <p className="text-4xl font-bold text-white mb-5" style={{ fontFamily: mono }}>{formatCompactCurrency(metrics.totalOutstanding)}</p>
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
              {[
                { label: "LENT",      value: formatCompactCurrency(metrics.totalPrincipalLent) },
                { label: "COLLECTED", value: formatCompactCurrency(metrics.totalCollected) },
                { label: "PROFIT",    value: formatCompactCurrency(metrics.totalProfit) },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5" style={{ fontFamily: mono }}>{s.label}</p>
                  <p className="text-sm font-bold text-white" style={{ fontFamily: mono }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="px-4 grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "NEW LOAN", icon: <PlusCircle className="w-5 h-5" />, action: () => setNewLoanOpen(true) },
              { label: "EXPORT",   icon: <Download className="w-5 h-5" />,   action: handleExportCSV },
              { label: "RESET",    icon: <RotateCcw className="w-5 h-5" />,  action: handleResetData },
            ].map((btn) => (
              <button key={btn.label} onClick={btn.action}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all active:scale-95"
                style={{ background: t.bgCard, borderColor: t.border }}>
                <div style={{ color: t.textMuted }}>{btn.icon}</div>
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>{btn.label}</span>
              </button>
            ))}
          </div>

          {/* LOANS TAB */}
          {mobileTab === "loans" && (
            <div className="px-4 pb-24">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>LOANS</h2>
                <span className="text-[10px]" style={{ fontFamily: mono, color: t.textFaint }}>{loans.length} RECORDS</span>
              </div>
              <div className="space-y-2">
                {loans.map((loan) => {
                  const ss = statusStyle(loan.status);
                  return (
                    <div key={loan.id} onClick={() => setDetailLoan(loan)}
                      className="rounded-2xl p-4 border flex items-center justify-between cursor-pointer transition-all active:scale-99"
                      style={{ background: t.bgCard, borderColor: t.border }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full border flex items-center justify-center shrink-0"
                          style={{ background: t.bgActive, borderColor: t.borderMid }}>
                          <span className="text-xs font-bold" style={{ fontFamily: mono, color: t.text }}>{loan.borrowerName.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold" style={{ color: t.text }}>{loan.borrowerName}</p>
                          <p className="text-[10px]" style={{ color: t.textFaint }}>{loan.category} · {loan.monthsRemaining} mo left</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold" style={{ fontFamily: mono, color: t.text }}>{formatCompactCurrency(loan.remainingBalance)}</p>
                        <span className="text-[9px] font-bold border rounded-full px-1.5 py-0.5"
                          style={{ fontFamily: mono, background: ss.bg, color: ss.color, borderColor: ss.border }}>
                          {loan.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CLIENTS TAB */}
          {mobileTab === "clients" && (
            <div className="pb-24">
              <ClientsPage loans={loans} theme={t} onUpdateLoan={handleUpdateLoan} />
            </div>
          )}

          {/* ANALYTICS TAB */}
          {mobileTab === "analytics" && (
            <div className="px-4 pb-24 space-y-3">
              <h2 className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ fontFamily: mono, color: t.textFaint }}>ANALYTICS</h2>
              <PortfolioDonut metrics={metrics} theme={t} compact />
              <MonthlyCollections loans={loans} theme={t} compact />
              <RepaymentProgress loans={loans} theme={t} compact />
              <FinancialStackedBar loans={loans} theme={t} compact />
            </div>
          )}
        </div>

        {/* DESKTOP MAIN */}
        <main className="hidden md:block flex-1 p-6 relative"
          style={{
            backgroundImage: "url(/logo.png)",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center center",
            backgroundSize: "420px",
          }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: isDark ? "rgba(15,17,23,0.92)" : "rgba(240,242,248,0.93)" }} />

          <div className="relative z-10 space-y-5">
            <div>
              <h1 className="text-lg font-bold tracking-widest" style={{ fontFamily: mono, color: t.text }}>PORTFOLIO OVERVIEW</h1>
              <p className="text-[11px] mt-0.5 tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>BUILDING WEALTH TOGETHER</p>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "TOTAL LENT",  value: formatCompactCurrency(metrics.totalPrincipalLent), sub: `${metrics.totalLoansOriginated} loans` },
                { label: "OUTSTANDING", value: formatCompactCurrency(metrics.totalOutstanding),   sub: `${metrics.activeLoansCount} active` },
                { label: "COLLECTED",   value: formatCompactCurrency(metrics.totalCollected),     sub: `${metrics.completedLoansCount} completed` },
                { label: "NET PROFIT",  value: formatCompactCurrency(metrics.totalProfit),        sub: "from interest" },
              ].map((card, i) => (
                <div key={card.label} className="rounded-2xl p-5 border transition-all"
                  style={{
                    background: i === 0 ? (isDark ? "#1e2235" : "#e8ebf8") : t.bgCard,
                    borderColor: i === 0 ? "rgba(91,124,250,0.30)" : t.border,
                  }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ fontFamily: mono, color: t.textFaint }}>{card.label}</p>
                  <p className="text-xl font-bold" style={{ fontFamily: mono, color: i === 0 ? "#5b7cfa" : t.text }}>{card.value}</p>
                  <p className="text-[10px] mt-1" style={{ color: t.textFaint }}>{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Overdue alert */}
            {loans.filter((l) => l.status === "Overdue").length > 0 && (
              <div className="rounded-2xl p-4 border flex items-start gap-3"
                style={{ background: "rgba(239,68,68,0.07)", borderColor: "rgba(239,68,68,0.20)" }}>
                <div className="p-2 rounded-xl shrink-0" style={{ background: "rgba(239,68,68,0.12)" }}>
                  <Bell className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold" style={{ fontFamily: mono, color: t.text }}>
                    {loans.filter((l) => l.status === "Overdue").length} OVERDUE — COLLECT NOW
                  </h4>
                  <div className="mt-1 flex flex-wrap gap-x-4 text-xs" style={{ color: t.textMuted }}>
                    {loans.filter((l) => l.status === "Overdue").map((l) => (
                      <span key={l.id}>
                        <span className="font-semibold" style={{ color: t.text }}>{l.borrowerName}</span>
                        {" · "}{formatCompactCurrency(l.monthlyPayment)} overdue
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ROW 1 — Donut + Collections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PortfolioDonut metrics={metrics} theme={t} />
              <MonthlyCollections loans={loans} theme={t} />
            </div>

            {/* ROW 2 — Repayment + Stacked Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RepaymentProgress loans={loans} theme={t} />
              <FinancialStackedBar loans={loans} theme={t} />
            </div>

            {/* LEDGER */}
            <div className="hidden">{/* clients desktop */}</div>
            <LoanLedgerTable
              loans={loans}
              onSelectLoan={setDetailLoan}
              onRecordPayment={setPaymentLoan}
              onDeleteLoan={deleteLoan}
              onOpenNewLoan={() => setNewLoanOpen(true)}
              theme={t}
            />
          </div>
        </main>

        {/* MOBILE BOTTOM NAV */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around px-4 py-4 z-30 border-t"
          style={{ background: t.bgNav, backdropFilter: "blur(20px)", borderColor: t.border }}>
          {[
            { tab: "loans",     icon: <LayoutDashboard className="w-4 h-4" />, label: "LOANS" },
            { tab: "analytics", icon: <TrendingUp className="w-4 h-4" />,      label: "ANALYTICS" },
            { tab: "clients",   icon: <Users className="w-4 h-4" />,            label: "CLIENTS" },
          ].map((item) => (
            <button key={item.tab} onClick={() => setMobileTab(item.tab as any)} className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: mobileTab === item.tab ? t.bgActive : "transparent" }}>
                <span style={{ color: mobileTab === item.tab ? t.btnPrimary : t.textFaint }}>{item.icon}</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest"
                style={{ fontFamily: mono, color: mobileTab === item.tab ? t.btnPrimary : t.textFaint }}>{item.label}</span>
            </button>
          ))}
          <button onClick={() => setNewLoanOpen(true)} className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: t.btnPrimary }}>
              <PlusCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: mono, color: t.textFaint }}>NEW</span>
          </button>
          
        </nav>

        <div className="md:hidden h-20" />
      </div>

      <PdfExportModal isOpen={pdfOpen} onClose={() => setPdfOpen(false)} loans={loans} metrics={metrics} theme={t} />
      <NewLoanModal isOpen={newLoanOpen} onClose={() => setNewLoanOpen(false)} onAddLoan={(data) => { addLoan(data); setNewLoanOpen(false); }} theme={t} />
      <RecordPaymentModal isOpen={!!paymentLoan} loan={paymentLoan} onClose={() => setPaymentLoan(null)} onSavePayment={handleSavePayment} theme={t} />
      <LoanDetailModal loan={detailLoan} onClose={() => setDetailLoan(null)} onRecordPayment={(loan) => { setDetailLoan(null); setPaymentLoan(loan); }} theme={t} />
    </div>
  );
}

export default App;






