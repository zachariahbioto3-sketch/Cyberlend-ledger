import { Loan, PortfolioMetrics, RepaymentRow, InterestBasis } from "../types";

const DEFAULT_INTEREST_RATE = 0.20;

// ─── EXISTING CYBERLEND LOAN MODEL ───────────────────────────────────────────
// Recurring interest-only loan model:
// Borrower pays interest each month, principal stays unchanged.
// Loan closes only when borrower pays principal + interest together.

export function calculateCyberlendLoan(principal: number, term: number = 5) {
  const monthlyInterest = Math.ceil(principal * DEFAULT_INTEREST_RATE);
  const monthlyPayment  = monthlyInterest;
  const totalRepayable  = principal + (monthlyInterest * term);
  return { monthlyInterest, totalRepayable, monthlyPayment };
}

// ─── AGREEMENT REPAYMENT SCHEDULE ────────────────────────────────────────────
// Generates full repayment schedule table for the loan agreement PDF.
// Supports Flat Rate and Reducing Balance interest basis.

export function generateRepaymentSchedule(
  principal: number,
  annualRatePercent: number,
  basis: InterestBasis,
  termMonths: number,
  startDate: string,
  feesPerInstalment: number = 0
): RepaymentRow[] {
  const rows: RepaymentRow[] = [];
  const monthlyRate = annualRatePercent / 100;

  if (basis === "Flat Rate" || basis === "Other") {
    // Flat Rate: interest calculated on original principal every month
    // Principal paid as lump sum on final instalment (Cyberlend model)
    const interestPerMonth = Math.ceil(principal * monthlyRate);
    let balance = principal;

    for (let i = 1; i <= termMonths; i++) {
      const isLast      = i === termMonths;
      const principalDue = isLast ? principal : 0;
      const totalDue    = principalDue + interestPerMonth + feesPerInstalment;
      balance           = isLast ? 0 : principal;

      rows.push({
        instalment: i,
        dueDate:    addMonths(startDate, i),
        principal:  principalDue,
        interest:   interestPerMonth,
        fees:       feesPerInstalment,
        totalDue,
        balance,
      });
    }
  } else if (basis === "Reducing Balance") {
    // Reducing Balance: interest recalculates on outstanding principal each month
    // Equal principal repayment each month
    const principalPerMonth = Math.ceil(principal / termMonths);
    let balance = principal;

    for (let i = 1; i <= termMonths; i++) {
      const isLast       = i === termMonths;
      const interestDue  = Math.ceil(balance * monthlyRate);
      const principalDue = isLast ? balance : Math.min(principalPerMonth, balance);
      const totalDue     = principalDue + interestDue + feesPerInstalment;
      balance            = Math.max(0, balance - principalDue);

      rows.push({
        instalment: i,
        dueDate:    addMonths(startDate, i),
        principal:  principalDue,
        interest:   interestDue,
        fees:       feesPerInstalment,
        totalDue,
        balance,
      });
    }
  }

  return rows;
}

// ─── SCHEDULE SUMMARY HELPERS ─────────────────────────────────────────────────

export function scheduleTotalInterest(rows: RepaymentRow[]): number {
  return rows.reduce((sum, r) => sum + r.interest, 0);
}

export function scheduleTotalDue(rows: RepaymentRow[]): number {
  return rows.reduce((sum, r) => sum + r.totalDue, 0);
}

// ─── DATE HELPER ──────────────────────────────────────────────────────────────

function addMonths(dateStr: string, months: number): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1 + months, day);
    return d.toISOString().split("T")[0];
  } catch {
    return dateStr;
  }
}

// ─── PORTFOLIO METRICS ────────────────────────────────────────────────────────

export function calculatePortfolioMetrics(loans: Loan[]): PortfolioMetrics {
  let totalPrincipalLent       = 0;
  let totalExpectedReturn      = 0;
  let totalCollected           = 0;
  let totalOutstanding         = 0;
  let activeLoansCount         = 0;
  let completedLoansCount      = 0;
  let overdueCount             = 0;
  let defaultedCount           = 0;
  let returnsFromPreviousLoans = 0;

  loans.forEach((loan) => {
    totalPrincipalLent  += loan.loanAmount;
    totalExpectedReturn += loan.totalRepayable;

    const interestCollected = loan.transactions
      .filter((tx) => tx.status === "Completed" && tx.paymentType === "Interest")
      .reduce((sum, tx) => sum + tx.amount, 0);

    totalCollected += interestCollected;

    if (loan.status === "Completed") {
      completedLoansCount++;
      returnsFromPreviousLoans += loan.loanAmount;
    } else if (loan.status === "Defaulted") {
      defaultedCount++;
    } else {
      totalOutstanding += loan.loanAmount;
      activeLoansCount++;
      if (loan.status === "Overdue") overdueCount++;
    }
  });

  const totalProfit      = totalCollected;
  const availableCapital = returnsFromPreviousLoans;
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

// ─── LOAN LIFECYCLE ───────────────────────────────────────────────────────────

export function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function nextDueAfter(originationDate: string, monthsCompleted: number): string {
  const [year, month, day] = originationDate.split("-").map(Number);
  return toLocalISO(new Date(year, month - 1 + monthsCompleted + 1, day));
}

export function updateLoanAfterInterest(loan: Loan, amount: number = loan.monthlyInterest): Loan {
  const monthsCompleted = loan.monthsCompleted + 1;
  return {
    ...loan,
    interestCollected: loan.interestCollected + amount,
    amountPaid:        loan.amountPaid + amount,
    monthsCompleted,
    monthsRemaining:   Math.max(0, loan.term - monthsCompleted),
    nextDueDate:       nextDueAfter(loan.originationDate, monthsCompleted),
    remainingBalance:  loan.loanAmount,
    status:            "Active",
  };
}

export function closeLoanWithPrincipal(loan: Loan): Loan {
  return {
    ...loan,
    amountPaid:       loan.amountPaid + loan.loanAmount,
    remainingBalance: 0,
    status:           "Completed",
  };
}

// ─── FORMATTING ───────────────────────────────────────────────────────────────

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

export function numberToWords(amount: number): string {
  if (amount === 0) return "Zero Shillings Only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(n: number): string {
    if (n < 20)   return ones[n];
    if (n < 100)  return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 1_000_000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 1_000_000_000) return convert(Math.floor(n / 1_000_000)) + " Million" + (n % 1_000_000 ? " " + convert(n % 1_000_000) : "");
    return convert(Math.floor(n / 1_000_000_000)) + " Billion" + (n % 1_000_000_000 ? " " + convert(n % 1_000_000_000) : "");
  }

  const rounded = Math.round(amount);
  return convert(rounded) + " Shillings Only";
}
