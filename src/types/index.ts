export type LoanCategory = "Personal" | "Business" | "Emergency" | "Other";

export type LoanStatus = "Active" | "Overdue" | "Completed" | "Defaulted";

export type PaymentMethod = "M-Pesa" | "Bank Transfer";

export type PaymentType = "Interest" | "Principal";

export type ClientFlag = "VIP" | "Blacklisted" | "Defaulter" | "New" | "Regular";

export interface RepaymentTransaction {
  id: string;
  loanId: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  status: "Completed" | "Pending" | "Failed";
  paymentType: PaymentType;
  notes?: string;
}

export interface Loan {
  id: string;
  loanNumber: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerEmail?: string;
  borrowerAddress?: string;
  borrowerIdNumber?: string;
  borrowerPhoto?: string;
  clientFlags?: ClientFlag[];
  clientNotes?: string;
  referralSource?: string;
  dateJoined?: string;
  loanAmount: number;
  monthlyInterest: number;
  totalRepayable: number;
  monthlyPayment: number;
  term: number;
  category: LoanCategory;
  status: LoanStatus;
  originationDate: string;
  maturityDate: string;
  nextDueDate: string;
  interestCollected: number;
  amountPaid: number;
  remainingBalance: number;
  monthsCompleted: number;
  monthsRemaining: number;
  transactions: RepaymentTransaction[];
  notes?: string;
}

export interface PortfolioMetrics {
  totalLoansOriginated: number;
  totalPrincipalLent: number;
  totalExpectedReturn: number;
  totalCollected: number;
  totalOutstanding: number;
  totalProfit: number;
  activeLoansCount: number;
  completedLoansCount: number;
  overdueCount: number;
  defaultedCount: number;
}

export interface BorrowerProfile {
  borrowerName: string;
  borrowerPhone: string;
  borrowerEmail: string;
  borrowerAddress: string;
  borrowerIdNumber: string;
  borrowerPhoto: string;
  clientFlags: ClientFlag[];
  clientNotes: string;
  referralSource: string;
  dateJoined: string;
}
