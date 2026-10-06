import { useState } from "react";
import { useLoanStore } from "../store/loanStore";
import { AgreementForm } from "./AgreementForm";
import { generateAgreementPdf } from "../utils/pdfReportGenerator";
import { formatCurrency, formatDate } from "../utils/loanCalculations";
import { LoanAgreement, AgreementStatus } from "../types";

interface AgreementsPageProps {
  theme: any;
}

export function AgreementsPage({ theme: t }: AgreementsPageProps) {
  const { agreements, deleteAgreement, updateAgreement } = useLoanStore();
  const [showForm,     setShowForm]     = useState(false);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<AgreementStatus | "All">("All");
  const [selected,     setSelected]     = useState<LoanAgreement | null>(null);

  const filtered = agreements.filter((a) => {
    const matchSearch =
      a.borrower.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.agreementNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.lender.fullName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusStyle = (s: AgreementStatus) => ({
    Draft:     { background: "rgba(234,179,8,0.12)",   color: "#eab308", border: "rgba(234,179,8,0.25)" },
    Active:    { background: "rgba(91,124,250,0.12)",  color: "#5b7cfa", border: "rgba(91,124,250,0.25)" },
    Completed: { background: "rgba(74,222,128,0.12)",  color: "#4ade80", border: "rgba(74,222,128,0.25)" },
  }[s]);

  function handleDelete(id: string) {
    if (window.confirm("Delete this agreement? This cannot be undone.")) {
      deleteAgreement(id);
      if (selected?.id === id) setSelected(null);
    }
  }

  function handleStatusChange(id: string, status: AgreementStatus) {
    updateAgreement(id, { status });
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null);
  }

  async function handlePdf(agreement: LoanAgreement) {
    await generateAgreementPdf(agreement);
  }

  const input = `w-full rounded-lg px-3 py-2 text-sm focus:outline-none border`;
  const inputSx = { background: t.bgInput, color: t.text, borderColor: t.borderMid };

  return (
    <div className="p-4 md:p-6 space-y-6 w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: t.text }}>Loan Agreements</h1>
          <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>{agreements.length} agreement{agreements.length !== 1 ? "s" : ""} total</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition"
          style={{ background: "#5b7cfa", color: "#ffffff" }}>
          + New Agreement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(["Draft","Active","Completed"] as AgreementStatus[]).map((s) => {
          const ss  = statusStyle(s);
          const count = agreements.filter((a) => a.status === s).length;
          return (
            <div key={s} className="rounded-xl p-4 border" style={{ background: t.bgCard, borderColor: t.border }}>
              <p className="text-xs mb-1" style={{ color: t.textMuted }}>{s}</p>
              <p className="text-2xl font-bold mb-1" style={{ color: t.text }}>{count}</p>
              <span className="text-xs px-2 py-0.5 rounded-full border" style={ss}>{s}</span>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className={input + " flex-1"}
          style={inputSx}
          placeholder="Search by borrower, lender or agreement number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={input}
          style={{ ...inputSx, width: "auto" }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}>
          <option value="All">All Statuses</option>
          <option>Draft</option>
          <option>Active</option>
          <option>Completed</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="font-medium" style={{ color: t.text }}>No agreements found</p>
          <p className="text-sm mt-1" style={{ color: t.textMuted }}>
            {agreements.length === 0 ? "Create your first loan agreement to get started." : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border" style={{ background: t.bgCard, borderColor: t.border }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b" style={{ background: t.bgActive, borderColor: t.border }}>
                <tr>
                  {["Agreement No.","Date","Borrower","Lender","Approved","Net Disbursed","Status","Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap" style={{ color: t.textMuted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const ss = statusStyle(a.status);
                  return (
                    <tr
                      key={a.id}
                      className="border-t transition cursor-pointer"
                      style={{
                        borderColor: t.border,
                        background: selected?.id === a.id ? t.bgActive : "transparent",
                      }}
                      onClick={() => setSelected(selected?.id === a.id ? null : a)}>
                      <td className="px-4 py-3 font-mono font-medium whitespace-nowrap" style={{ color: "#5b7cfa" }}>{a.agreementNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: t.textMuted }}>{formatDate(a.date)}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: t.text }}>{a.borrower.fullName}</td>
                      <td className="px-4 py-3" style={{ color: t.textMuted }}>{a.lender.fullName}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: t.text }}>{formatCurrency(a.facility.approvedAmount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#4ade80" }}>{formatCurrency(a.netDisbursed)}</td>
                      <td className="px-4 py-3">
                        <select
                          className="text-xs px-2 py-1 rounded-full outline-none cursor-pointer border"
                          style={{ ...ss, background: ss.background }}
                          value={a.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(a.id, e.target.value as AgreementStatus)}>
                          <option value="Draft">Draft</option>
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handlePdf(a)}
                            className="px-2 py-1 text-xs rounded transition"
                            style={{ background: "rgba(91,124,250,0.15)", color: "#5b7cfa" }}>
                            PDF
                          </button>
                          <button onClick={() => handleDelete(a.id)}
                            className="px-2 py-1 text-xs rounded transition"
                            style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selected && (
        <div className="rounded-xl p-5 space-y-5 border" style={{ background: t.bgCard, borderColor: t.border }}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold" style={{ color: t.text }}>Agreement Detail — {selected.agreementNumber}</h2>
            <button onClick={() => setSelected(null)} className="text-lg" style={{ color: t.textMuted }}>✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#5b7cfa" }}>Parties</p>
              {[["Lender", selected.lender.fullName],["Lender ID", selected.lender.idNumber],["Lender Phone", selected.lender.phone],["Borrower", selected.borrower.fullName],["Borrower ID", selected.borrower.idNumber],["Borrower Phone", selected.borrower.phone],["Guarantor", selected.guarantor.fullName],["Guarantor ID", selected.guarantor.idNumber],["Guarantor Phone", selected.guarantor.phone]].map(([l, v]) => (
                <DetailItem key={l} label={l} value={v} t={t} />
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#5b7cfa" }}>Loan Terms</p>
              {[["Requested", formatCurrency(selected.facility.requestedAmount)],["Approved", formatCurrency(selected.facility.approvedAmount)],["Net Disbursed", formatCurrency(selected.netDisbursed)],["Term", `${selected.facility.term} month(s)`],["Purpose", selected.facility.purpose],["Interest Rate", `${selected.interest.rate}%`],["Basis", selected.interest.basis],["Total Interest", formatCurrency(selected.interest.totalInterestPayable || 0)],["Disbursement", `${selected.disbursement.method} — ${selected.disbursement.accountOrPhone}`]].map(([l, v]) => (
                <DetailItem key={l} label={l} value={v} t={t} />
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#5b7cfa" }}>Schedule</p>
              {[["Instalments", String(selected.repaymentSchedule.length)],["First Payment", formatDate(selected.repayment.firstPaymentDate)],["Final Payment", formatDate(selected.repayment.finalPaymentDate)],["Per Instalment", formatCurrency(selected.repayment.amountPerInstalment)],["Frequency", selected.repayment.frequency],["Pay Method", selected.repayment.paymentMethod],["Pay Account", selected.repayment.paymentAccount]].map(([l, v]) => (
                <DetailItem key={l} label={l} value={v} t={t} />
              ))}
            </div>
          </div>

          {selected.repaymentSchedule.length > 0 && (
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: t.border }}>
              <table className="w-full text-xs">
                <thead style={{ background: t.bgActive }}>
                  <tr>
                    {["#","Due Date","Principal","Interest","Fees","Total Due","Balance"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left" style={{ color: t.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.repaymentSchedule.map((row) => (
                    <tr key={row.instalment} className="border-t" style={{ borderColor: t.border }}>
                      <td className="px-3 py-1.5" style={{ color: t.textMuted }}>{row.instalment}</td>
                      <td className="px-3 py-1.5" style={{ color: t.textMuted }}>{row.dueDate}</td>
                      <td className="px-3 py-1.5" style={{ color: t.text }}>{formatCurrency(row.principal)}</td>
                      <td className="px-3 py-1.5" style={{ color: t.text }}>{formatCurrency(row.interest)}</td>
                      <td className="px-3 py-1.5" style={{ color: t.text }}>{formatCurrency(row.fees)}</td>
                      <td className="px-3 py-1.5 font-medium" style={{ color: "#5b7cfa" }}>{formatCurrency(row.totalDue)}</td>
                      <td className="px-3 py-1.5" style={{ color: t.textMuted }}>{formatCurrency(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button onClick={() => handlePdf(selected)}
            className="w-full py-2.5 text-sm rounded-lg font-medium transition"
            style={{ background: "#5b7cfa", color: "#ffffff" }}>
            📄 Download Agreement PDF
          </button>
        </div>
      )}

      {showForm && <AgreementForm onClose={() => setShowForm(false)} theme={t} />}
    </div>
  );
}

function DetailItem({ label, value, t }: { label: string; value: string; t: any }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs" style={{ color: t.textFaint }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: t.text }}>{value || "—"}</span>
    </div>
  );
}
