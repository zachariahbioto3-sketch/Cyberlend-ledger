import { Loan, PortfolioMetrics } from '../types';

export function calculateCyberlendLoan(
  principalAmount: number,
  termMonths: number = 5
): {
  interestAmount: number;
  totalRepayable: number;
  monthlyPayment: number;
  monthlyPrincipal: number;
  monthlyInterest: number;
} {
  if (principalAmount <= 0 || termMonths <= 0) {
    return {
      interestAmount: 0,
      totalRepayable: 0,
      monthlyPayment: 0,
      monthlyPrincipal: 0,
      monthlyInterest: 0,
    };
  }

  const interestAmount = Math.round(principalAmount * 0.2 * 100) / 100;
  const totalRepayable = principalAmount + interestAmount;
  const monthlyPayment = Math.round((totalRepayable / termMonths) * 100) / 100;
  const monthlyPrincipal = Math.round((principalAmount / termMonths) * 100) / 100;
  const monthlyInterest = Math.round((interestAmount / termMonths) * 100) / 100;

  return {
    interestAmount,
    totalRepayable,
    monthlyPayment,
    monthlyPrincipal,
    monthlyInterest,
  };
}

export function generatePaymentSchedule(loan: Loan) {
  const schedule = [];
  const [year, month, day] = loan.originationDate.split('-').map(Number);
  
  for (let i = 1; i <= loan.term; i++) {
    const paymentDate = new Date(year, (month - 1) + i, day);
    const dateStr = paymentDate.toISOString().split('T')[0];
    
    const principalBefore = loan.loanAmount - (loan.monthlyPrincipal * (i - 1));
    const remainingAfter = principalBefore - loan.monthlyPrincipal;

    schedule.push({
      period: i,
      dueDate: dateStr,
      principalBefore: Math.round(principalBefore * 100) / 100,
      monthlyPayment: loan.monthlyPayment,
      principal: loan.monthlyPrincipal,
      interest: loan.monthlyInterest,
      principalAfter: Math.max(0, Math.round(remainingAfter * 100) / 100),
    });
  }

  return schedule;
}

export function calculatePortfolioMetrics(loans: Loan[]): PortfolioMetrics {
  let totalPrincipalLent = 0;
  let totalInterestEarned = 0;
  let totalAmountPaid = 0;
  let totalAmountOutstanding = 0;
  let activeCount = 0;
  let completedCount = 0;
  let defaultedCount = 0;
  let overdueCount = 0;

  const today = new Date();

  loans.forEach((loan) => {
    totalPrincipalLent += loan.loanAmount;
    totalInterestEarned += loan.interestAmount;
    totalAmountPaid += loan.amountPaid;
    totalAmountOutstanding += loan.remainingBalance;

    if (loan.status === 'Paid in Full') {
      completedCount++;
    } else if (loan.status === 'Defaulted') {
      defaultedCount++;
    } else {
      activeCount++;
    }

    if (loan.status !== 'Paid in Full' && loan.status !== 'Defaulted') {
      const dueDate = new Date(loan.nextDueDate);
      if (dueDate < today) {
        overdueCount++;
      }
    }
  });

  const totalMonthlyRevenue = loans
    .filter((l) => l.status !== 'Paid in Full' && l.status !== 'Defaulted')
    .reduce((sum, l) => sum + l.monthlyPayment, 0);

  const averageMonthlyPayment =
    loans.length > 0
      ? Math.round((loans.reduce((sum, l) => sum + l.monthlyPayment, 0) / loans.length) * 100) / 100
      : 0;

  return {
    totalLoansOriginated: loans.length,
    totalPrincipalLent: Math.round(totalPrincipalLent * 100) / 100,
    totalInterestEarned: Math.round(totalInterestEarned * 100) / 100,
    totalMonthlyRevenue: Math.round(totalMonthlyRevenue * 100) / 100,
    activeLoansCount: activeCount,
    completedLoansCount: completedCount,
    defaultedLoansCount: defaultedCount,
    totalAmountOutstanding: Math.round(totalAmountOutstanding * 100) / 100,
    totalAmountPaid: Math.round(totalAmountPaid * 100) / 100,
    averageMonthlyPayment,
    overdueCount,
  };
}

export function updateLoanAfterPayment(
  loan: Loan,
  paymentAmount: number
): Loan {
  const amountPaid = loan.amountPaid + paymentAmount;
  const remainingBalance = Math.max(0, loan.remainingBalance - paymentAmount);

  let interestPortion = Math.min(loan.interestPaid + (loan.monthlyInterest * (loan.monthsCompleted + 1)), loan.interestAmount);
  let principalPortion = amountPaid - interestPortion;

  if (principalPortion < 0) {
    principalPortion = 0;
    interestPortion = amountPaid;
  }

  const monthsCompleted = Math.floor(amountPaid / loan.monthlyPayment);
  const monthsRemaining = Math.max(0, loan.term - monthsCompleted);

  let status = loan.status;
  if (remainingBalance === 0) {
    status = 'Paid in Full';
  }

  const [year, month, day] = loan.originationDate.split('-').map(Number);
  const nextDue = new Date(year, (month - 1) + monthsCompleted + 1, day);
  const nextDueDateStr = nextDue.toISOString().split('T')[0];

  return {
    ...loan,
    amountPaid: Math.round(amountPaid * 100) / 100,
    principalPaid: Math.round(principalPortion * 100) / 100,
    interestPaid: Math.round(interestPortion * 100) / 100,
    remainingBalance: Math.round(remainingBalance * 100) / 100,
    monthsCompleted,
    monthsRemaining,
    status,
    nextDueDate: nextDueDateStr,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatPercent(rate: number): string {
  return `${(rate || 0).toFixed(2)}%`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, (month || 1) - 1, day || 1);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `KES ${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `KES ${(amount / 1_000).toFixed(0)}k`;
  }
  return formatCurrency(amount);
}