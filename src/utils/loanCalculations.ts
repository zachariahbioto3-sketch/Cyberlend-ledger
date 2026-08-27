import { Loan, PortfolioMetrics } from '../types';

// Core Cyberlend formula:
// Lend X → Collect 2X over 5 months → Monthly payment = (principal * 2) / term
export function calculateCyberlendLoan(principal: number, term: number = 5) {
  const totalRepayable = principal * 2;
  const monthlyPayment = Math.round((totalRepayable / term) * 100) / 100;
  return { totalRepayable, monthlyPayment };
}

export function calculatePortfolioMetrics(loans: Loan[]): PortfolioMetrics {
  let totalPrincipalLent = 0;
  let totalExpectedReturn = 0;
  let totalCollected = 0;
  let activeLoansCount = 0;
  let completedLoansCount = 0;
  let overdueCount = 0;
  let defaultedCount = 0;

  const today = new Date();

  loans.forEach((loan) => {
    totalPrincipalLent += loan.loanAmount;
    totalExpectedReturn += loan.totalRepayable;
    totalCollected += loan.amountPaid;

    if (loan.status === 'Completed') completedLoansCount++;
    else if (loan.status === 'Defaulted') defaultedCount++;
    else {
      activeLoansCount++;
      if (loan.status === 'Overdue' || new Date(loan.nextDueDate) < today) overdueCount++;
    }
  });

  return {
    totalLoansOriginated: loans.length,
    totalPrincipalLent: Math.round(totalPrincipalLent * 100) / 100,
    totalExpectedReturn: Math.round(totalExpectedReturn * 100) / 100,
    totalCollected: Math.round(totalCollected * 100) / 100,
    totalOutstanding: Math.round((totalExpectedReturn - totalCollected) * 100) / 100,
    totalProfit: Math.round((totalCollected - totalPrincipalLent) * 100) / 100,
    activeLoansCount,
    completedLoansCount,
    overdueCount,
    defaultedCount,
  };
}

export function updateLoanAfterPayment(loan: Loan, paymentAmount: number): Loan {
  const amountPaid = Math.round((loan.amountPaid + paymentAmount) * 100) / 100;
  const remainingBalance = Math.max(0, Math.round((loan.remainingBalance - paymentAmount) * 100) / 100);
  const monthsCompleted = Math.min(loan.term, Math.floor(amountPaid / loan.monthlyPayment));
  const monthsRemaining = Math.max(0, loan.term - monthsCompleted);

  const status = remainingBalance === 0 ? 'Completed' : loan.status;

  const [year, month, day] = loan.originationDate.split('-').map(Number);
  const nextDue = new Date(year, month - 1 + monthsCompleted + 1, day);
  const nextDueDate = nextDue.toISOString().split('T')[0];

  return {
    ...loan,
    amountPaid,
    remainingBalance,
    monthsCompleted,
    monthsRemaining,
    status,
    nextDueDate,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `KES ${(amount / 1_000).toFixed(0)}k`;
  return formatCurrency(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-KE', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
