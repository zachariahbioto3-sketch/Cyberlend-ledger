export type LoanCategory = 
  | 'Personal Loan' 
  | 'Business Loan' 
  | 'Emergency Loan' 
  | 'Asset-Backed' 
  | 'Other';

export type LoanStatus = 
  | 'Active' 
  | 'Grace Period' 
  | 'Overdue' 
  | 'Paid in Full' 
  | 'Defaulted';

export type PaymentMethod = 'M-Pesa' | 'Bank Transfer';

export interface RepaymentTransaction {
  id: string;
  loanId: string;
  date: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  status: 'Completed' | 'Pending' | 'Failed';
  notes?: string;
}

export interface Loan {
  id: string;
  loanNumber: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerEmail: string;
  loanAmount: number;
  interestAmount: number;
  totalRepayable: number;
  interestRate: number;
  term: number;
  monthlyPayment: number;
  monthlyPrincipal: number;
  monthlyInterest: number;
  category: LoanCategory;
  status: LoanStatus;
  originationDate: string;
  maturityDate: string;
  nextDueDate: string;
  amountPaid: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  monthsCompleted: number;
  monthsRemaining: number;
  transactions: RepaymentTransaction[];
  notes?: string;
}

export interface PortfolioMetrics {
  totalLoansOriginated: number;
  totalPrincipalLent: number;
  totalInterestEarned: number;
  totalMonthlyRevenue: number;
  activeLoansCount: number;
  completedLoansCount: number;
  defaultedLoansCount: number;
  totalAmountOutstanding: number;
  totalAmountPaid: number;
  averageMonthlyPayment: number;
  overdueCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}