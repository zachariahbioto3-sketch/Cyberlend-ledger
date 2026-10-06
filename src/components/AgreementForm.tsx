import { useState, useMemo } from "react";
import { useLoanStore } from "../store/loanStore";
import {
  generateRepaymentSchedule,
  scheduleTotalInterest,
  numberToWords,
  formatCurrency,
} from "../utils/loanCalculations";
import {
  LoanAgreement,
  Guarantor,
  LenderDetails,
  AgreementFacility,
  AgreementInterest,
  AgreementFees,
  AgreementDisbursement,
  AgreementRepayment,
  LoanPurpose,
  InterestBasis,
  DisbursementMethod,
  RepaymentFrequency,
  PaymentMethod,
} from "../types";

interface AgreementFormProps {
  onClose: () => void;
  theme: any;
}

const EMPTY_LENDER: LenderDetails = { fullName: "", idNumber: "", address: "", phone: "", email: "" };
const EMPTY_BORROWER = { fullName: "", idNumber: "", dateOfBirth: "", address: "", phone: "", email: "", occupation: "", employerOrBusiness: "" };
const EMPTY_GUARANTOR: Guarantor = { fullName: "", idNumber: "", address: "", phone: "", email: "", occupation: "" };
const EMPTY_FACILITY: AgreementFacility = { requestedAmount: 0, approvedAmount: 0, amountInWords: "", purpose: "Personal Use", disbursementDate: new Date().toISOString().slice(0, 10), maturityDate: "", term: 1 };
const EMPTY_INTEREST: AgreementInterest = { rate: 20, basis: "Flat Rate", otherBasisDescription: "", calculationMethod: "", totalInterestPayable: 0 };
const EMPTY_FEES: AgreementFees = { processingFeeType: "None", processingFeeValue: 0, otherFees: "", totalFees: 0 };
const EMPTY_DISBURSEMENT: AgreementDisbursement = { method: "Mobile Money", otherMethodDescription: "", accountOrPhone: "", reference: "" };
const EMPTY_REPAYMENT: AgreementRepayment = { frequency: "Monthly", numberOfInstalments: 1, amountPerInstalment: 0, firstPaymentDate: "", finalPaymentDate: "", paymentMethod: "M-Pesa", paymentAccount: "" };

const LOAN_PURPOSES: LoanPurpose[] = [
  "Business Capital","School Fees","Medical Emergency","Land/Property",
  "Agriculture","Home Improvement","Debt Consolidation","Electronics/Assets","Personal Use","Other",
];

export function AgreementForm({ onClose, theme: t }: AgreementFormProps) {
  const { addAgreement, addLoan, loans } = useLoanStore();
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 7;

  const [lender,       setLender]       = useState<LenderDetails>(EMPTY_LENDER);
  const [borrower,     setBorrower]     = useState(EMPTY_BORROWER);
  const [guarantor,    setGuarantor]    = useState<Guarantor>(EMPTY_GUARANTOR);
  const [facility,     setFacility]     = useState<AgreementFacility>(EMPTY_FACILITY);
  const [interest,     setInterest]     = useState<AgreementInterest>(EMPTY_INTEREST);
  const [fees,         setFees]         = useState<AgreementFees>(EMPTY_FEES);
  const [disbursement, setDisbursement] = useState<AgreementDisbursement>(EMPTY_DISBURSEMENT);
  const [repayment,    setRepayment]    = useState<AgreementRepayment>(EMPTY_REPAYMENT);
  const [existingClient, setExistingClient] = useState("");

  function handleClientSelect(loanId: string) {
    setExistingClient(loanId);
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return;
    setBorrower({ fullName: loan.borrowerName || "", idNumber: loan.borrowerIdNumber || "", dateOfBirth: "", address: loan.borrowerAddress || "", phone: loan.borrowerPhone || "", email: loan.borrowerEmail || "", occupation: loan.occupation || "", employerOrBusiness: "" });
  }

  const processingFee = useMemo(() => {
    if (fees.processingFeeType === "None")       return 0;
    if (fees.processingFeeType === "Percentage") return Math.ceil(facility.approvedAmount * fees.processingFeeValue / 100);
    return fees.processingFeeValue;
  }, [fees, facility.approvedAmount]);

  const totalFees    = processingFee;
  const netDisbursed = Math.max(0, facility.approvedAmount - totalFees);

  const repaymentSchedule = useMemo(() => {
    if (!facility.approvedAmount || !facility.term || !interest.rate) return [];
    return generateRepaymentSchedule(facility.approvedAmount, interest.rate, interest.basis, facility.term, facility.disbursementDate, 0);
  }, [facility.approvedAmount, facility.term, interest.rate, interest.basis, facility.disbursementDate]);

  const totalInterest = scheduleTotalInterest(repaymentSchedule);

  function handleSubmit() {
    const agreementId     = `AGR-${Date.now()}`;
    const agreementNumber = `CA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const agreement: LoanAgreement = {
      id: agreementId, agreementNumber, agreementVersion: "1.0",
      date: new Date().toISOString().slice(0, 10), status: "Active",
      lender, borrower, guarantor,
      facility: { ...facility, amountInWords: numberToWords(facility.approvedAmount) },
      interest: { ...interest, totalInterestPayable: totalInterest },
      fees: { ...fees, totalFees },
      netDisbursed, disbursement,
      repayment: { ...repayment, numberOfInstalments: facility.term, firstPaymentDate: repaymentSchedule[0]?.dueDate || "", finalPaymentDate: repaymentSchedule[repaymentSchedule.length - 1]?.dueDate || "", amountPerInstalment: repaymentSchedule[0]?.totalDue || 0 },
      repaymentSchedule, createdAt: new Date().toISOString(),
    };
    addAgreement(agreement);
    addLoan({ borrowerName: borrower.fullName, borrowerPhone: borrower.phone, borrowerEmail: borrower.email, borrowerAddress: borrower.address, borrowerIdNumber: borrower.idNumber, occupation: borrower.occupation, loanAmount: facility.approvedAmount, term: facility.term, category: "Personal", originationDate: facility.disbursementDate, loanPurpose: facility.purpose, notes: `Agreement: ${agreementNumber}`, agreementId });
    onClose();
  }

  function next() { setStep((s) => Math.min(s + 1, TOTAL_STEPS)); }
  function prev() { setStep((s) => Math.max(s - 1, 1)); }
  function upd<T>(setter: React.Dispatch<React.SetStateAction<T>>, field: keyof T, value: any) {
    setter((prev) => ({ ...prev, [field]: value }));
  }

  // ── theme-aware class builders ──
  const input    = `w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border`;
  const inputSx  = { background: t.bgInput, color: t.text, borderColor: t.borderMid };
  const labelSx  = { color: t.textMuted };
  const cardSx   = { background: t.bgCard, borderColor: t.border };
  const modalSx  = { background: t.bgModal, borderColor: t.borderMid };
  const headSx   = { borderColor: t.border };
  const shSx     = { color: "#5b7cfa", borderColor: t.border };

  const stepTitles = ["Lender Details","Borrower Details","Guarantor Details","Loan Facility","Interest & Fees","Disbursement","Review & Confirm"];

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <label className="block text-xs mb-1" style={labelSx}>{label}</label>
        {children}
      </div>
    );
  }

  function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
      <p className="text-sm font-semibold mb-3 pb-1 border-b" style={shSx}>{children}</p>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div className="rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border" style={modalSx}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={headSx}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: t.text }}>New Loan Agreement</h2>
            <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>Step {step} of {TOTAL_STEPS} — {stepTitles[step - 1]}</p>
          </div>
          <button onClick={onClose} className="text-xl font-bold transition" style={{ color: t.textMuted }}>✕</button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-3">
          <div className="w-full rounded-full h-1.5" style={{ background: t.progressBg }}>
            <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%`, background: t.progressFill }} />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* STEP 1 — Lender */}
          {step === 1 && (
            <div className="mb-6">
              <SectionHeading>1. Lender Information</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["fullName","idNumber","address","phone","email"] as (keyof LenderDetails)[]).map((f) => (
                  <Field key={f} label={f === "fullName" ? "Full Name / Legal Name" : f === "idNumber" ? "ID / Registration No." : f.charAt(0).toUpperCase() + f.slice(1)}>
                    <input className={input} style={inputSx} value={lender[f]} onChange={(e) => upd(setLender, f, e.target.value)} />
                  </Field>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — Borrower */}
          {step === 2 && (
            <div className="mb-6">
              <SectionHeading>2. Borrower Information</SectionHeading>
              <div className="mb-4">
                <Field label="Auto-fill from existing client">
                  <select className={input} style={inputSx} value={existingClient} onChange={(e) => handleClientSelect(e.target.value)}>
                    <option value="">— Select existing client —</option>
                    {loans.map((l) => <option key={l.id} value={l.id}>{l.borrowerName} ({l.borrowerPhone})</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["fullName","idNumber","dateOfBirth","address","phone","email","occupation","employerOrBusiness"] as const).map((f) => (
                  <Field key={f} label={f === "fullName" ? "Full Name" : f === "idNumber" ? "National ID / Passport No." : f === "dateOfBirth" ? "Date of Birth" : f === "employerOrBusiness" ? "Employer / Business Name" : f.charAt(0).toUpperCase() + f.slice(1)}>
                    <input className={input} style={inputSx} type={f === "dateOfBirth" ? "date" : "text"} value={(borrower as any)[f]} onChange={(e) => upd(setBorrower, f, e.target.value)} />
                  </Field>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 — Guarantor */}
          {step === 3 && (
            <div className="mb-6">
              <SectionHeading>3. Guarantor Information</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["fullName","idNumber","address","phone","email","occupation"] as (keyof Guarantor)[]).map((f) => (
                  <Field key={f} label={f === "fullName" ? "Full Name" : f === "idNumber" ? "National ID / Passport No." : f.charAt(0).toUpperCase() + f.slice(1)}>
                    <input className={input} style={inputSx} value={guarantor[f]} onChange={(e) => upd(setGuarantor, f, e.target.value)} />
                  </Field>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4 — Facility */}
          {step === 4 && (
            <div className="mb-6">
              <SectionHeading>4. Loan Facility</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Requested Amount (KES)">
                  <input className={input} style={inputSx} type="number" value={facility.requestedAmount || ""} onChange={(e) => upd(setFacility, "requestedAmount", Number(e.target.value))} />
                </Field>
                <Field label="Approved Amount (KES)">
                  <input className={input} style={inputSx} type="number" value={facility.approvedAmount || ""} onChange={(e) => upd(setFacility, "approvedAmount", Number(e.target.value))} />
                </Field>
                <Field label="Loan Purpose">
                  <select className={input} style={inputSx} value={facility.purpose} onChange={(e) => upd(setFacility, "purpose", e.target.value as LoanPurpose)}>
                    {LOAN_PURPOSES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Loan Term (months)">
                  <input className={input} style={inputSx} type="number" min={1} value={facility.term || ""} onChange={(e) => upd(setFacility, "term", Number(e.target.value))} />
                </Field>
                <Field label="Disbursement Date">
                  <input className={input} style={inputSx} type="date" value={facility.disbursementDate} onChange={(e) => upd(setFacility, "disbursementDate", e.target.value)} />
                </Field>
                <Field label="Amount in Words">
                  <input className={input} style={{ ...inputSx, opacity: 0.7 }} readOnly value={facility.approvedAmount ? numberToWords(facility.approvedAmount) : ""} />
                </Field>
              </div>
            </div>
          )}

          {/* STEP 5 — Interest & Fees */}
          {step === 5 && (
            <div className="mb-6">
              <SectionHeading>5. Interest</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Interest Rate (%)">
                  <input className={input} style={inputSx} type="number" step="0.1" value={interest.rate} onChange={(e) => upd(setInterest, "rate", Number(e.target.value))} />
                </Field>
                <Field label="Interest Basis">
                  <select className={input} style={inputSx} value={interest.basis} onChange={(e) => upd(setInterest, "basis", e.target.value as InterestBasis)}>
                    <option>Flat Rate</option>
                    <option>Reducing Balance</option>
                    <option>Other</option>
                  </select>
                </Field>
                {interest.basis === "Other" && (
                  <div className="md:col-span-2">
                    <Field label="Describe Interest Basis">
                      <input className={input} style={inputSx} value={interest.otherBasisDescription || ""} onChange={(e) => upd(setInterest, "otherBasisDescription", e.target.value)} />
                    </Field>
                  </div>
                )}
                <div className="md:col-span-2">
                  <Field label="Calculation Method (optional)">
                    <input className={input} style={inputSx} value={interest.calculationMethod || ""} onChange={(e) => upd(setInterest, "calculationMethod", e.target.value)} />
                  </Field>
                </div>
              </div>

              <SectionHeading>Fees & Charges</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Processing Fee Type">
                  <select className={input} style={inputSx} value={fees.processingFeeType} onChange={(e) => upd(setFees, "processingFeeType", e.target.value as any)}>
                    <option>None</option>
                    <option>Percentage</option>
                    <option>Fixed</option>
                  </select>
                </Field>
                {fees.processingFeeType !== "None" && (
                  <Field label={fees.processingFeeType === "Percentage" ? "Fee (%)" : "Fee Amount (KES)"}>
                    <input className={input} style={inputSx} type="number" value={fees.processingFeeValue || ""} onChange={(e) => upd(setFees, "processingFeeValue", Number(e.target.value))} />
                  </Field>
                )}
                <div className="md:col-span-2">
                  <Field label="Other Fees (description)">
                    <input className={input} style={inputSx} value={fees.otherFees} onChange={(e) => upd(setFees, "otherFees", e.target.value)} placeholder="None" />
                  </Field>
                </div>
              </div>

              {/* Summary box */}
              <div className="mt-4 rounded-lg p-4 text-sm space-y-1 border" style={{ background: t.bgCard, borderColor: t.border }}>
                <div className="flex justify-between" style={{ color: t.textMuted }}>
                  <span>Approved Amount</span><span>{formatCurrency(facility.approvedAmount)}</span>
                </div>
                <div className="flex justify-between" style={{ color: t.textMuted }}>
                  <span>Processing Fee</span><span>- {formatCurrency(processingFee)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2 mt-2" style={{ color: t.text, borderColor: t.border }}>
                  <span>Net Disbursed</span><span>{formatCurrency(netDisbursed)}</span>
                </div>
                <div className="flex justify-between" style={{ color: "#4ade80" }}>
                  <span>Total Interest ({interest.basis})</span><span>{formatCurrency(totalInterest)}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6 — Disbursement */}
          {step === 6 && (
            <div className="mb-6">
              <SectionHeading>6. Disbursement</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Disbursement Method">
                  <select className={input} style={inputSx} value={disbursement.method} onChange={(e) => upd(setDisbursement, "method", e.target.value as DisbursementMethod)}>
                    <option>Mobile Money</option><option>Bank Transfer</option>
                    <option>Cheque</option><option>Cash</option><option>Other</option>
                  </select>
                </Field>
                {disbursement.method === "Other" && (
                  <Field label="Describe Method">
                    <input className={input} style={inputSx} value={disbursement.otherMethodDescription || ""} onChange={(e) => upd(setDisbursement, "otherMethodDescription", e.target.value)} />
                  </Field>
                )}
                <Field label="Account / Phone Number">
                  <input className={input} style={inputSx} value={disbursement.accountOrPhone} onChange={(e) => upd(setDisbursement, "accountOrPhone", e.target.value)} />
                </Field>
                <Field label="Disbursement Reference">
                  <input className={input} style={inputSx} value={disbursement.reference} onChange={(e) => upd(setDisbursement, "reference", e.target.value)} />
                </Field>
              </div>

              <SectionHeading>Repayment</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Repayment Frequency">
                  <select className={input} style={inputSx} value={repayment.frequency} onChange={(e) => upd(setRepayment, "frequency", e.target.value as RepaymentFrequency)}>
                    <option>Daily</option><option>Weekly</option><option>Bi-weekly</option>
                    <option>Monthly</option><option>Other</option>
                  </select>
                </Field>
                <Field label="Payment Method">
                  <select className={input} style={inputSx} value={repayment.paymentMethod} onChange={(e) => upd(setRepayment, "paymentMethod", e.target.value as PaymentMethod)}>
                    <option>M-Pesa</option><option>Bank Transfer</option>
                  </select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Payment Account / Number">
                    <input className={input} style={inputSx} value={repayment.paymentAccount} onChange={(e) => upd(setRepayment, "paymentAccount", e.target.value)} />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7 — Review */}
          {step === 7 && (
            <div className="mb-6">
              <SectionHeading>7. Review & Confirm</SectionHeading>
              <div className="space-y-2 text-sm mb-5">
                {[
                  ["Lender",          lender.fullName],
                  ["Borrower",        borrower.fullName],
                  ["Guarantor",       guarantor.fullName],
                  ["Requested",       formatCurrency(facility.requestedAmount)],
                  ["Approved",        formatCurrency(facility.approvedAmount)],
                  ["Net Disbursed",   formatCurrency(netDisbursed)],
                  ["Term",            `${facility.term} month(s)`],
                  ["Interest Rate",   `${interest.rate}% ${interest.basis}`],
                  ["Total Interest",  formatCurrency(totalInterest)],
                  ["Disbursement",    `${disbursement.method} — ${disbursement.accountOrPhone}`],
                  ["Repayment",       `${repayment.frequency} via ${repayment.paymentMethod}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b pb-1.5" style={{ borderColor: t.border }}>
                    <span style={{ color: t.textMuted }}>{label}</span>
                    <span className="font-medium" style={{ color: t.text }}>{value || "—"}</span>
                  </div>
                ))}
              </div>

              {repaymentSchedule.length > 0 && (
                <>
                  <p className="text-xs mb-2" style={{ color: t.textMuted }}>Repayment Schedule Preview</p>
                  <div className="overflow-x-auto rounded-lg border" style={{ borderColor: t.border }}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: t.bgCard }}>
                          {["#","Due Date","Principal","Interest","Total Due","Balance"].map((h) => (
                            <th key={h} className="px-2 py-2 text-left" style={{ color: t.textMuted }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {repaymentSchedule.map((row) => (
                          <tr key={row.instalment} className="border-t" style={{ borderColor: t.border }}>
                            <td className="px-2 py-1.5" style={{ color: t.textMuted }}>{row.instalment}</td>
                            <td className="px-2 py-1.5" style={{ color: t.textMuted }}>{row.dueDate}</td>
                            <td className="px-2 py-1.5" style={{ color: t.text }}>{formatCurrency(row.principal)}</td>
                            <td className="px-2 py-1.5" style={{ color: t.text }}>{formatCurrency(row.interest)}</td>
                            <td className="px-2 py-1.5 font-medium" style={{ color: "#5b7cfa" }}>{formatCurrency(row.totalDue)}</td>
                            <td className="px-2 py-1.5" style={{ color: t.textMuted }}>{formatCurrency(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: t.border }}>
          <button onClick={prev} disabled={step === 1}
            className="px-4 py-2 text-sm rounded-lg transition disabled:opacity-30"
            style={{ color: t.textMuted, background: t.bgBtn, border: `1px solid ${t.border}` }}>
            ← Back
          </button>
          {step < TOTAL_STEPS ? (
            <button onClick={next}
              className="px-5 py-2 text-sm rounded-lg font-medium transition"
              style={{ background: "#5b7cfa", color: "#ffffff" }}>
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit}
              className="px-5 py-2 text-sm rounded-lg font-medium transition"
              style={{ background: "#16a34a", color: "#ffffff" }}>
              ✓ Save Agreement & Create Loan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
