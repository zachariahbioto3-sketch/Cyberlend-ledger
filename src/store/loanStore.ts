import { create } from 'zustand';
import { Loan, RepaymentTransaction, PortfolioMetrics } from '../types';
import { calculateCyberlendLoan, calculatePortfolioMetrics, updateLoanAfterPayment } from '../utils/loanCalculations';

interface LoanState {
  loans: Loan[];
  metrics: PortfolioMetrics;
  
  addLoan: (loan: Omit<Loan, 'id' | 'transactions'>) => void;
  updateLoan: (id: string, loan: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;
  recordPayment: (loanId: string, transaction: Omit<RepaymentTransaction, 'id'>) => void;
  setLoans: (loans: Loan[]) => void;
  calculateMetrics: () => void;
}

export const useLoanStore = create<LoanState>((set) => ({
  loans: [],
  metrics: {
    totalLoansOriginated: 0,
    totalPrincipalLent: 0,
    totalInterestEarned: 0,
    totalMonthlyRevenue: 0,
    activeLoansCount: 0,
    completedLoansCount: 0,
    defaultedLoansCount: 0,
    totalAmountOutstanding: 0,
    totalAmountPaid: 0,
    averageMonthlyPayment: 0,
    overdueCount: 0,
  },

  addLoan: (loanData) =>
    set((state) => {
      const loanId = `LOAN-${Date.now()}`;
      const loanNumber = `CL-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')}`;

      const { interestAmount, totalRepayable, monthlyPayment, monthlyPrincipal, monthlyInterest } =
        calculateCyberlendLoan(loanData.loanAmount, loanData.term);

      const [year, month, day] = loanData.originationDate.split('-').map(Number);
      const maturityDateObj = new Date(year, month - 1 + loanData.term, day);
      const maturityDate = maturityDateObj.toISOString().split('T')[0];

      const newLoan: Loan = {
        id: loanId,
        loanNumber,
        borrowerName: loanData.borrowerName,
        borrowerPhone: loanData.borrowerPhone,
        borrowerEmail: loanData.borrowerEmail,
        loanAmount: loanData.loanAmount,
        interestAmount,
        totalRepayable,
        interestRate: 20,
        term: loanData.term,
        monthlyPayment,
        monthlyPrincipal,
        monthlyInterest,
        category: loanData.category,
        status: 'Active',
        originationDate: loanData.originationDate,
        maturityDate,
        nextDueDate: loanData.originationDate,
        amountPaid: 0,
        principalPaid: 0,
        interestPaid: 0,
        remainingBalance: loanData.loanAmount,
        monthsCompleted: 0,
        monthsRemaining: loanData.term,
        transactions: [],
        notes: loanData.notes || '',
      };

      const updatedLoans = [...state.loans, newLoan];
      const newMetrics = calculatePortfolioMetrics(updatedLoans);

      return {
        loans: updatedLoans,
        metrics: newMetrics,
      };
    }),

  updateLoan: (id, loanData) =>
    set((state) => {
      const updatedLoans = state.loans.map((l) => (l.id === id ? { ...l, ...loanData } : l));
      const newMetrics = calculatePortfolioMetrics(updatedLoans);

      return {
        loans: updatedLoans,
        metrics: newMetrics,
      };
    }),

  deleteLoan: (id) =>
    set((state) => {
      const updatedLoans = state.loans.filter((l) => l.id !== id);
      const newMetrics = calculatePortfolioMetrics(updatedLoans);

      return {
        loans: updatedLoans,
        metrics: newMetrics,
      };
    }),

  recordPayment: (loanId, transactionData) =>
    set((state) => {
      const loanIndex = state.loans.findIndex((l) => l.id === loanId);
      if (loanIndex === -1) return state;

      const loan = state.loans[loanIndex];
      const updatedLoan = updateLoanAfterPayment(loan, transactionData.amount);

      const transaction: RepaymentTransaction = {
        id: `TX-${Date.now()}`,
        ...transactionData,
      };

      updatedLoan.transactions.push(transaction);

      const updatedLoans = [...state.loans];
      updatedLoans[loanIndex] = updatedLoan;

      const newMetrics = calculatePortfolioMetrics(updatedLoans);

      return {
        loans: updatedLoans,
        metrics: newMetrics,
      };
    }),

  setLoans: (loans) =>
    set((state) => {
      const newMetrics = calculatePortfolioMetrics(loans);
      return {
        loans,
        metrics: newMetrics,
      };
    }),

  calculateMetrics: () =>
    set((state) => ({
      metrics: calculatePortfolioMetrics(state.loans),
    })),
}));