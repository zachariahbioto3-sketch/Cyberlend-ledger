import { create } from 'zustand';
import { Loan, RepaymentTransaction, PortfolioMetrics } from '../types';
import { calculateCyberlendLoan, calculatePortfolioMetrics, updateLoanAfterPayment } from '../utils/loanCalculations';

const STORAGE_KEY = 'cyberlend_loans';

function loadLoans(): Loan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLoans(loans: Loan[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
}

interface LoanState {
  loans: Loan[];
  metrics: PortfolioMetrics;
  addLoan: (data: any) => void;
  deleteLoan: (id: string) => void;
  recordPayment: (loanId: string, transaction: Omit<RepaymentTransaction, 'id'>) => void;
  setLoans: (loans: Loan[]) => void;
}

const initialLoans = loadLoans();

export const useLoanStore = create<LoanState>((set) => ({
  loans: initialLoans,
  metrics: calculatePortfolioMetrics(initialLoans),

  addLoan: (loanData) =>
    set((state) => {
      const loanNumber = `CL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { totalRepayable, monthlyPayment } = calculateCyberlendLoan(loanData.loanAmount, loanData.term);

      const [year, month, day] = loanData.originationDate.split('-').map(Number);
      const maturityDate = new Date(year, month - 1 + loanData.term, day).toISOString().split('T')[0];
      const nextDueDate = new Date(year, month, day).toISOString().split('T')[0];

      const newLoan: Loan = {
        id: `loan-${Date.now()}`,
        loanNumber,
        borrowerName: loanData.borrowerName,
        borrowerPhone: loanData.borrowerPhone,
        borrowerEmail: loanData.borrowerEmail || '',
        loanAmount: loanData.loanAmount,
        totalRepayable,
        monthlyPayment,
        term: loanData.term,
        category: loanData.category,
        status: 'Active',
        originationDate: loanData.originationDate,
        maturityDate,
        nextDueDate,
        amountPaid: 0,
        remainingBalance: totalRepayable,
        monthsCompleted: 0,
        monthsRemaining: loanData.term,
        transactions: [],
        notes: loanData.notes || '',
      };

      const updated = [...state.loans, newLoan];
      saveLoans(updated);
      return { loans: updated, metrics: calculatePortfolioMetrics(updated) };
    }),

  deleteLoan: (id) =>
    set((state) => {
      const updated = state.loans.filter((l) => l.id !== id);
      saveLoans(updated);
      return { loans: updated, metrics: calculatePortfolioMetrics(updated) };
    }),

  recordPayment: (loanId, txData) =>
    set((state) => {
      const idx = state.loans.findIndex((l) => l.id === loanId);
      if (idx === -1) return state;

      const loan = state.loans[idx];
      const updatedLoan = updateLoanAfterPayment(loan, txData.amount);
      const tx: RepaymentTransaction = { id: `TX-${Date.now()}`, ...txData };
      updatedLoan.transactions.push(tx);

      const updated = [...state.loans];
      updated[idx] = updatedLoan;
      saveLoans(updated);
      return { loans: updated, metrics: calculatePortfolioMetrics(updated) };
    }),

  setLoans: (loans) =>
    set(() => {
      saveLoans(loans);
      return { loans, metrics: calculatePortfolioMetrics(loans) };
    }),
}));
