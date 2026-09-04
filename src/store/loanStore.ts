import { create } from "zustand";
import { Loan, RepaymentTransaction, PortfolioMetrics, WishlistEntry, Goals } from "../types";
import {
  calculateCyberlendLoan,
  calculatePortfolioMetrics,
  updateLoanAfterInterest,
  closeLoanWithPrincipal,
} from "../utils/loanCalculations";

const STORAGE_KEY  = "cyberlend_loans";
const WAITLIST_KEY = "cyberlend_waitlist";
const GOALS_KEY    = "cyberlend_goals";

const DEFAULT_GOALS: Goals = { targetPortfolioSize: 500000, targetClientCount: 20, targetMonthlyReturn: 50000, targetReturnRate: 10 };
function loadGoals(): Goals { try { const r = localStorage.getItem(GOALS_KEY); return r ? { ...DEFAULT_GOALS, ...JSON.parse(r) } : DEFAULT_GOALS; } catch { return DEFAULT_GOALS; } }
function saveGoals(g: Goals) { localStorage.setItem(GOALS_KEY, JSON.stringify(g)); }

function loadLoans(): Loan[] {
  try { const r = localStorage.getItem(STORAGE_KEY);  return r ? JSON.parse(r) : []; } catch { return []; }
}
function loadWaitlist(): WishlistEntry[] {
  try { const r = localStorage.getItem(WAITLIST_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveLoans(loans: Loan[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(loans)); }
function saveWaitlist(w: WishlistEntry[]) { localStorage.setItem(WAITLIST_KEY, JSON.stringify(w)); }

interface LoanState {
  loans:    Loan[];
  metrics:  PortfolioMetrics;
  waitlist: WishlistEntry[];
  selectedClient: Loan | null;
  totalCapital: number;
  goals: Goals;
  setGoals: (goals: Goals) => void;
  setSelectedClient:    (c: Loan | null) => void;
  setLoans:             (loans: Loan[]) => void;
  addLoan:              (data: any) => void;
  deleteLoan:           (id: string) => void;
  recordPayment:        (loanId: string, tx: Omit<RepaymentTransaction, "id">) => void;
  closeLoan:            (loanId: string, tx: Omit<RepaymentTransaction, "id">) => void;
  updateLoan:           (id: string, updates: Partial<Loan>) => void;
  addToWaitlist:        (entry: Omit<WishlistEntry, "id" | "dateRegistered" | "status">) => void;
  removeFromWaitlist:   (id: string) => void;
  updateWaitlistStatus: (id: string, status: WishlistEntry["status"]) => void;
  setTotalCapital:      (amount: number) => void;
}

const initialLoans    = loadLoans();
const initialWaitlist = loadWaitlist();

function loadCapital(): number {
  try { const v = localStorage.getItem("cyberlend_capital"); return v ? parseFloat(v) : 0; }
  catch { return 0; }
}

export const useLoanStore = create<LoanState>((set) => ({
  loans:          initialLoans,
  metrics:        calculatePortfolioMetrics(initialLoans),
  waitlist:       initialWaitlist,
  selectedClient: null,
  totalCapital:   loadCapital(),
  goals:          loadGoals(),

  setGoals: (goals) => set(() => { saveGoals(goals); return { goals }; }),

  setSelectedClient: (client) => set(() => ({ selectedClient: client })),

  setLoans: (loans) => set(() => {
    saveLoans(loans);
    return { loans, metrics: calculatePortfolioMetrics(loans) };
  }),

  updateLoan: (id, updates) => set((state) => {
    const updated = state.loans.map((l) => l.id === id ? { ...l, ...updates } : l);
    saveLoans(updated);
    return { loans: updated, metrics: calculatePortfolioMetrics(updated) };
  }),

  addLoan: (loanData) => set((state) => {
    const loanNumber = `CL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const outstandingBalance = loanData.outstandingBalance || 0;
    const effectivePrincipal = loanData.loanAmount + outstandingBalance;
    const { monthlyInterest, totalRepayable, monthlyPayment } = calculateCyberlendLoan(effectivePrincipal, loanData.term);
    const [year, month, day] = loanData.originationDate.split("-").map(Number);
    const maturityDate = new Date(year, month - 1 + loanData.term, day).toISOString().split("T")[0];
    const nextDueDate  = new Date(year, month, day).toISOString().split("T")[0];
    const newLoan: Loan = {
      id:               `loan-${Date.now()}`,
      loanNumber,
      borrowerName:     loanData.borrowerName,
      borrowerPhone:    loanData.borrowerPhone,
      borrowerEmail:    loanData.borrowerEmail    || "",
      borrowerAddress:  loanData.borrowerAddress  || "",
      borrowerIdNumber: loanData.borrowerIdNumber || "",
      borrowerPhoto:    loanData.borrowerPhoto    || "",
      borrowerIdPhoto:  loanData.borrowerIdPhoto  || "",
      borrowerUsername: loanData.borrowerUsername || "",
      loanPurpose:      loanData.loanPurpose      || undefined,
      kraPin:           loanData.kraPin           || "",
      occupation:       loanData.occupation       || "",
      clientFlags:      loanData.clientFlags      || ["New"],
      clientNotes:      loanData.clientNotes      || "",
      referralSource:   loanData.referralSource   || "",
      dateJoined:       loanData.dateJoined       || new Date().toISOString().slice(0, 10),
      loanAmount:       effectivePrincipal,
      monthlyInterest,
      totalRepayable,
      monthlyPayment,
      term:             loanData.term,
      category:         loanData.category,
      status:           "Active",
      originationDate:  loanData.originationDate,
      maturityDate,
      nextDueDate,
      interestCollected: 0,
      amountPaid:        0,
      remainingBalance:  effectivePrincipal,
      monthsCompleted:   0,
      monthsRemaining:   loanData.term,
      transactions:      [],
      notes:             loanData.notes || "",
    };
    const updated = [...state.loans, newLoan];
    saveLoans(updated);
    return { loans: updated, metrics: calculatePortfolioMetrics(updated) };
  }),

  deleteLoan: (id) => set((state) => {
    const updated = state.loans.filter((l) => l.id !== id);
    saveLoans(updated);
    return { loans: updated, metrics: calculatePortfolioMetrics(updated) };
  }),

  recordPayment: (loanId, txData) => set((state) => {
    const idx = state.loans.findIndex((l) => l.id === loanId);
    if (idx === -1) return state;
    const loan = state.loans[idx];
    const updatedLoan = updateLoanAfterInterest(loan);
    const tx: RepaymentTransaction = { id: `TX-${Date.now()}`, ...txData, paymentType: "Interest", amount: loan.monthlyInterest };
    updatedLoan.transactions = [...updatedLoan.transactions, tx];
    const updated = [...state.loans];
    updated[idx] = updatedLoan;
    saveLoans(updated);
    return { loans: updated, metrics: calculatePortfolioMetrics(updated) };
  }),

  closeLoan: (loanId, txData) => set((state) => {
    const idx = state.loans.findIndex((l) => l.id === loanId);
    if (idx === -1) return state;
    const loan = state.loans[idx];
    const updatedLoan = closeLoanWithPrincipal(loan);
    const tx: RepaymentTransaction = { id: `TX-${Date.now()}`, ...txData, paymentType: "Principal", amount: loan.loanAmount };
    updatedLoan.transactions = [...updatedLoan.transactions, tx];
    const updated = [...state.loans];
    updated[idx] = updatedLoan;
    saveLoans(updated);
    return { loans: updated, metrics: calculatePortfolioMetrics(updated) };
  }),

  addToWaitlist: (entry) => set((state) => {
    const newEntry: WishlistEntry = {
      ...entry,
      id:             `WL-${Date.now()}`,
      dateRegistered: new Date().toISOString().slice(0, 10),
      status:         "Pending",
    };
    const updated = [...state.waitlist, newEntry];
    saveWaitlist(updated);
    return { waitlist: updated };
  }),

  removeFromWaitlist: (id) => set((state) => {
    const updated = state.waitlist.filter((e) => e.id !== id);
    saveWaitlist(updated);
    return { waitlist: updated };
  }),

  updateWaitlistStatus: (id, status) => set((state) => {
    const updated = state.waitlist.map((e) => e.id === id ? { ...e, status } : e);
    saveWaitlist(updated);
    return { waitlist: updated };
  }),

  setTotalCapital: (amount) => set((state) => {
    localStorage.setItem("cyberlend_capital", String(amount));
    return { totalCapital: amount, metrics: calculatePortfolioMetrics(state.loans) };
  }),
}));
