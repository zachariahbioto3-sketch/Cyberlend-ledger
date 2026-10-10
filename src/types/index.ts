export type LoanCategory = "Personal" | "Business" | "Emergency" | "Agriculture" | "Education" | "Medical" | "Other";

export type LoanStatus = "Active" | "Overdue" | "Completed" | "Defaulted";

export type PaymentMethod = "M-Pesa" | "Bank Transfer";

export type PaymentType = "Interest" | "Principal";

export type ClientFlag = "VIP" | "Risk" | "Blacklisted" | "Defaulter" | "New" | "Regular";

export type LoanPurpose =
  | "Business Capital"
  | "School Fees"
  | "Medical Emergency"
  | "Land/Property"
  | "Agriculture"
  | "Home Improvement"
  | "Debt Consolidation"
  | "Electronics/Assets"
  | "Personal Use"
  | "Other";

export type InterestBasis = "Flat Rate" | "Reducing Balance" | "Other";

export type AgreementStatus = "Draft" | "Active" | "Completed";

export type DisbursementMethod = "Mobile Money" | "Bank Transfer" | "Cheque" | "Cash" | "Other";

export type RepaymentFrequency = "Daily" | "Weekly" | "Bi-weekly" | "Monthly" | "Other";

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
  borrowerIdPhoto?: string;
  borrowerUsername?: string;
  loanPurpose?: LoanPurpose;
  kraPin?: string;
  occupation?: string;
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
  agreementId?: string;
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
  availableCapital: number;
  lendableAmount: number;
  returnsFromPreviousLoans: number;
}

export interface BorrowerProfile {
  borrowerName: string;
  borrowerPhone: string;
  borrowerEmail: string;
  borrowerAddress: string;
  borrowerIdNumber: string;
  borrowerPhoto: string;
  borrowerIdPhoto: string;
  borrowerUsername: string;
  loanPurpose: LoanPurpose;
  kraPin: string;
  occupation: string;
  clientFlags: ClientFlag[];
  clientNotes: string;
  referralSource: string;
  dateJoined: string;
}

export interface WishlistEntry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  occupation: string;
  amountNeeded: number;
  purpose: LoanPurpose;
  dateNeeded: string;
  dateRegistered: string;
  notes?: string;
  idNumber?: string;
  address?: string;
  kraPin?: string;
  referralSource?: string;
  status: "Enquiry" | "Pending" | "Approved" | "Rejected";
}

export interface Goals {
  targetPortfolioSize: number;
  targetClientCount: number;
  targetMonthlyReturn: number;
  targetReturnRate: number;
}

export interface Guarantor {
  fullName: string;
  idNumber: string;
  address: string;
  phone: string;
  email: string;
  occupation: string;
}

export interface RepaymentRow {
  instalment: number;
  dueDate: string;
  principal: number;
  interest: number;
  fees: number;
  totalDue: number;
  balance: number;
}

export interface LenderDetails {
  fullName: string;
  idNumber: string;
  address: string;
  phone: string;
  email: string;
}

export interface AgreementFacility {
  requestedAmount: number;
  approvedAmount: number;
  amountInWords: string;
  purpose: LoanPurpose;
  disbursementDate: string;
  maturityDate: string;
  term: number;
}

export interface AgreementInterest {
  rate: number;
  basis: InterestBasis;
  otherBasisDescription?: string;
  calculationMethod?: string;
  totalInterestPayable?: number;
}

export interface AgreementFees {
  processingFeeType: "None" | "Percentage" | "Fixed";
  processingFeeValue: number;
  otherFees: string;
  totalFees: number;
}

export interface AgreementDisbursement {
  method: DisbursementMethod;
  otherMethodDescription?: string;
  accountOrPhone: string;
  reference: string;
}

export interface AgreementRepayment {
  frequency: RepaymentFrequency;
  numberOfInstalments: number;
  amountPerInstalment: number;
  firstPaymentDate: string;
  finalPaymentDate: string;
  paymentMethod: PaymentMethod;
  paymentAccount: string;
}

export interface LoanAgreement {
  id: string;
  agreementNumber: string;
  agreementVersion: string;
  date: string;
  status: AgreementStatus;
  lender: LenderDetails;
  borrower: {
    fullName: string;
    idNumber: string;
    dateOfBirth: string;
    address: string;
    phone: string;
    email: string;
    occupation: string;
    employerOrBusiness: string;
  };
  guarantor: Guarantor;
  facility: AgreementFacility;
  interest: AgreementInterest;
  fees: AgreementFees;
  netDisbursed: number;
  disbursement: AgreementDisbursement;
  repayment: AgreementRepayment;
  repaymentSchedule: RepaymentRow[];
  linkedLoanId?: string;
  createdAt: string;
}
