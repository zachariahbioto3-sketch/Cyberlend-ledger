import { Loan, PortfolioMetrics } from "../types";
// global variables//
const INTEREST_RATE = 0.20;
//functions for our loan calculator//
export function calculateCyberlendLoan(principal: number, term: number = 5) {
  const monthlyInterest  = Math.round(principal * INTEREST_RATE);
  const totalRepayable   = Math.round((monthlyInterest * term) + principal);
  const monthlyPayment   = monthlyInterest;
  return { monthlyInterest, totalRepayable, monthlyPayment };
}

export function calculatePortfolioMetrics(loans: Loan[]): PortfolioMetrics {
  let totalPrincipalLent   = 0;
  let totalExpectedReturn  = 0;
  let totalCollected       = 0;
  let totalOutstanding     = 0;
  let activeLoansCount     = 0;
  let completedLoansCount  = 0;
  let overdueCount         = 0;
  let defaultedCount       = 0;

  loans.forEach((loan) => {
    totalPrincipalLent  += loan.loanAmount;
    totalExpectedReturn += loan.totalRepayable;

    // Sum interest transactions directly from transaction records
    const interestCollected = loan.transactions
      .filter((tx) => tx.status === "Completed" && tx.paymentType === "Interest")
      .reduce((sum, tx) => sum + tx.amount, 0);

    totalCollected += interestCollected;

    if (loan.status === "Completed") {
      completedLoansCount++;
    } else if (loan.status === "Defaulted") {
      defaultedCount++;
    } else {
      // Principal is still outstanding for active/overdue loans
      totalOutstanding += loan.loanAmount;
      activeLoansCount++;
      if (loan.status === "Overdue") overdueCount++;
    }
  });

  return {
    totalLoansOriginated: loans.length,
    totalPrincipalLent:   Math.round(totalPrincipalLent),
    totalExpectedReturn:  Math.round(totalExpectedReturn),
    totalCollected:       Math.round(totalCollected),
    totalOutstanding:     Math.round(totalOutstanding),
    totalProfit:          Math.round(totalCollected), // profit = interest collected
    activeLoansCount,
    completedLoansCount,
    overdueCount,
    defaultedCount,
  };
}

export function updateLoanAfterInterest(loan: Loan): Loan {
  const monthsCompleted   = loan.monthsCompleted + 1;
  const monthsRemaining   = Math.max(0, loan.term - monthsCompleted);
  const interestCollected = loan.interestCollected + (loan.monthlyInterest || loan.monthlyPayment);
  const [year, month, day] = loan.originationDate.split("-").map(Number);
  const nextDue = new Date(year, month - 1 + monthsCompleted + 1, day);
  const nextDueDate = nextDue.toISOString().split("T")[0];
  return {
    ...loan,
    amountPaid:        interestCollected,
    interestCollected,
    monthsCompleted,
    monthsRemaining,
    nextDueDate,
    status:            "Active",
    remainingBalance:  loan.loanAmount,
  };
}

export function closeLoanWithPrincipal(loan: Loan): Loan {
  return { ...loan, remainingBalance: 0, status: "Completed" };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency", currency: "KES",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000)     return `KES ${(amount / 1_000).toFixed(0)}k`;
  return formatCurrency(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "N/A";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-KE", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return dateStr; }
}
