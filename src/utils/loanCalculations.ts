import { Loan, PortfolioMetrics } from "../types";

const INTEREST_RATE = 0.20;

// Recurring interest-only loan model:
// Borrower pays interest each month, principal stays unchanged.
// Loan closes only when borrower pays principal + interest together.
export function calculateCyberlendLoan(principal: number, term: number = 5) {
  const monthlyInterest = Math.ceil(principal * INTEREST_RATE);
  const monthlyPayment  = monthlyInterest; // monthly = interest only
  // totalRepayable = principal + (interest * term) — an estimate, not a deadline
  const totalRepayable  = principal + (monthlyInterest * term);
  return { monthlyInterest, totalRepayable, monthlyPayment };
}

export function calculatePortfolioMetrics(loans: Loan[]): PortfolioMetrics {
  let totalPrincipalLent       = 0;
  let totalExpectedReturn      = 0;
  let totalCollected           = 0; // sum of all interest payments received
  let totalOutstanding         = 0; // principal still in the field
  let activeLoansCount         = 0;
  let completedLoansCount      = 0;
  let overdueCount             = 0;
  let defaultedCount           = 0;
  let returnsFromPreviousLoans = 0; // principal recovered from closed loans

  loans.forEach((loan) => {
    totalPrincipalLent  += loan.loanAmount;
    totalExpectedReturn += loan.totalRepayable;

    // Only count completed interest transactions as collected
    const interestCollected = loan.transactions
      .filter((tx) => tx.status === "Completed" && tx.paymentType === "Interest")
      .reduce((sum, tx) => sum + tx.amount, 0);

    totalCollected += interestCollected;

    if (loan.status === "Completed") {
      completedLoansCount++;
      // Principal has been returned — it's available to lend again
      returnsFromPreviousLoans += loan.loanAmount;
    } else if (loan.status === "Defaulted") {
      defaultedCount++;
    } else {
      // Active / Overdue — principal is still out in the field
      totalOutstanding += loan.loanAmount;
      activeLoansCount++;
      if (loan.status === "Overdue") overdueCount++;
    }
  });

  // Profit = all interest collected (principal is not income, it's returned capital)
  const totalProfit      = totalCollected;
  // Capital available to re-lend = recovered principal from closed loans
  const availableCapital = returnsFromPreviousLoans;
  // Conservative lendable amount = 80% of available capital
  const lendableAmount   = Math.floor(availableCapital * 0.8);

  return {
    totalLoansOriginated:     loans.length,
    totalPrincipalLent:       Math.round(totalPrincipalLent),
    totalExpectedReturn:      Math.round(totalExpectedReturn),
    totalCollected:           Math.round(totalCollected),
    totalOutstanding:         Math.round(totalOutstanding),
    totalProfit:              Math.round(totalProfit),
    activeLoansCount,
    completedLoansCount,
    overdueCount,
    defaultedCount,
    availableCapital:         Math.round(availableCapital),
    lendableAmount:           Math.round(lendableAmount),
    returnsFromPreviousLoans: Math.round(returnsFromPreviousLoans),
  };
}

// Called when borrower pays interest for the month.
// Principal stays the same — loan recurs to them automatically.
export function updateLoanAfterInterest(loan: Loan): Loan {
  const monthsCompleted   = loan.monthsCompleted + 1;
  const interestCollected = loan.interestCollected + loan.monthlyInterest;
  const [year, month, day] = loan.originationDate.split("-").map(Number);
  const nextDue     = new Date(year, month - 1 + monthsCompleted + 1, day);
  const nextDueDate = nextDue.toISOString().split("T")[0];

  return {
    ...loan,
    interestCollected,
    amountPaid:       interestCollected,      // tracks total interest paid so far
    monthsCompleted,
    monthsRemaining:  Math.max(0, loan.term - monthsCompleted),
    nextDueDate,
    remainingBalance: loan.loanAmount,        // principal never changes until closure
    status:           "Active",
  };
}

// Called when borrower decides to close the loan.
// They pay principal + this month's interest — loan is terminated.
export function closeLoanWithPrincipal(loan: Loan): Loan {
  return {
    ...loan,
    remainingBalance: 0,          // principal fully returned
    status:           "Completed",
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency", currency: "KES",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000)     return `KES ${(amount / 1_000).toFixed(1)}k`;
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
