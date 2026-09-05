import jsPDF from "jspdf";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";

// Saves PDF correctly on both Web and Android APK
export async function savePdf(doc: any, filename: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    // Android: use Capacitor Filesystem to write to Downloads
    const base64 = doc.output("datauristring").split(",")[1];
    await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Documents,
    });
    alert(`Saved to Documents: ${filename}`);
  } else {
    // Web: normal browser download
    doc.save(filename);
  }
}
import autoTable from "jspdf-autotable";
import { Loan, PortfolioMetrics } from "../types";
import { formatCompactCurrency } from "./loanCalculations";

interface PdfReportOptions {
  organizationName: string;
  preparedBy: string;
  reportTitle: string;
  includePaidOff: boolean;
}

export function generatePortfolioSummaryPdf(
  loans: Loan[],
  metrics: PortfolioMetrics,
  options: PdfReportOptions
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const DARK      = [15, 17, 23] as [number, number, number];
  const CARD      = [26, 29, 39] as [number, number, number];
  const BLUE      = [91, 124, 250] as [number, number, number];
  const WHITE     = [232, 234, 240] as [number, number, number];
  const MUTED     = [120, 125, 150] as [number, number, number];
  const RED       = [248, 113, 113] as [number, number, number];
  const GREEN     = [74, 222, 128] as [number, number, number];
  const BORDER    = [40, 44, 60] as [number, number, number];

  const filteredLoans = options.includePaidOff
    ? loans
    : loans.filter((l) => l.status !== "Completed");

  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...CARD);
  doc.rect(0, 0, W, 28, "F");
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, 4, 28, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.text(options.organizationName.toUpperCase(), 12, 11);

  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(options.reportTitle, 12, 18);

  const now = new Date().toLocaleDateString("en-KE", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFontSize(7);
  doc.text(`Generated: ${now}`, 12, 24);
  doc.text(`Prepared by: ${options.preparedBy}`, W - 12, 24, { align: "right" });

  doc.setFontSize(7);
  doc.setTextColor(...BLUE);
  doc.text("CYBERLEND LEDGER", W - 12, 11, { align: "right" });

  const kpis = [
    { label: "TOTAL LENT",    value: formatCompactCurrency(metrics.totalPrincipalLent) },
    { label: "OUTSTANDING",   value: formatCompactCurrency(metrics.totalOutstanding) },
    { label: "COLLECTED",     value: formatCompactCurrency(metrics.totalCollected) },
    { label: "NET PROFIT",    value: formatCompactCurrency(metrics.totalProfit) },
    { label: "ACTIVE LOANS",  value: String(metrics.activeLoansCount) },
    { label: "OVERDUE",       value: String(metrics.overdueCount) },
    { label: "COMPLETED",     value: String(metrics.completedLoansCount) },
    { label: "DEFAULTED",     value: String(metrics.defaultedCount) },
  ];

  const cardW = (W - 24) / 4;
  const cardH = 18;
  const cardY = 33;

  kpis.forEach((kpi, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const x = 12 + col * (cardW + 2);
    const y = cardY + row * (cardH + 2);
    doc.setFillColor(...CARD);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, "F");
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, "S");
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...MUTED);
    doc.text(kpi.label, x + 3, y + 5);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLUE);
    doc.text(kpi.value, x + 3, y + 13);
  });

  const tableY = cardY + 2 * (cardH + 2) + 6;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text("LOAN SCHEDULE", 12, tableY - 2);

  const statusColor = (status: string): [number, number, number] => {
    if (status === "Active")    return BLUE;
    if (status === "Overdue")   return RED;
    if (status === "Completed") return GREEN;
    return MUTED;
  };

  autoTable(doc, {
    startY: tableY,
    margin: { left: 12, right: 12 },
    head: [["LOAN #", "BORROWER", "PHONE", "CATEGORY", "PRINCIPAL", "MONTHLY", "COLLECTED", "REMAINING", "STATUS", "MATURITY"]],
    body: filteredLoans.map((l) => [
      l.loanNumber, l.borrowerName, l.borrowerPhone, l.category,
      formatCompactCurrency(l.loanAmount), formatCompactCurrency(l.monthlyPayment),
      formatCompactCurrency(l.interestCollected), formatCompactCurrency(l.remainingBalance),
      l.status, l.maturityDate,
    ]),
    styles: { fontSize: 6.5, cellPadding: 2.5, font: "helvetica", textColor: WHITE, fillColor: CARD, lineColor: BORDER, lineWidth: 0.2 },
    headStyles: { fillColor: [22, 25, 38], textColor: MUTED, fontStyle: "bold", fontSize: 6 },
    alternateRowStyles: { fillColor: [20, 22, 33] },
    columnStyles: {
      0: { cellWidth: 22 }, 1: { cellWidth: 30 }, 2: { cellWidth: 24 }, 3: { cellWidth: 20 },
      4: { cellWidth: 22, halign: "right" }, 5: { cellWidth: 22, halign: "right" },
      6: { cellWidth: 22, halign: "right" }, 7: { cellWidth: 22, halign: "right" },
      8: { cellWidth: 18, halign: "center" }, 9: { cellWidth: 22, halign: "center" },
    },
    didParseCell(data) {
      if (data.column.index === 8 && data.section === "body") {
        const val = data.cell.raw as string;
        data.cell.styles.textColor = statusColor(val);
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  doc.addPage();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...CARD);
  doc.rect(0, 0, W, 18, "F");
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, 4, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...WHITE);
  doc.text("TRANSACTION LEDGER", 12, 12);
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(options.organizationName, W - 12, 12, { align: "right" });

  const allTx = filteredLoans.flatMap((l) =>
    l.transactions.map((tx) => ({ ...tx, borrowerName: l.borrowerName, loanNumber: l.loanNumber }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  autoTable(doc, {
    startY: 24,
    margin: { left: 12, right: 12 },
    head: [["TX REF", "LOAN #", "BORROWER", "DATE", "TYPE", "AMOUNT", "METHOD", "STATUS"]],
    body: allTx.map((tx) => [
      tx.referenceNumber || tx.id, tx.loanNumber, tx.borrowerName,
      tx.date, tx.paymentType, formatCompactCurrency(tx.amount), tx.paymentMethod, tx.status,
    ]),
    styles: { fontSize: 6.5, cellPadding: 2.5, font: "helvetica", textColor: WHITE, fillColor: CARD, lineColor: BORDER, lineWidth: 0.2 },
    headStyles: { fillColor: [22, 25, 38], textColor: MUTED, fontStyle: "bold", fontSize: 6 },
    alternateRowStyles: { fillColor: [20, 22, 33] },
    columnStyles: { 5: { halign: "right" }, 7: { halign: "center" } },
    didParseCell(data) {
      if (data.column.index === 7 && data.section === "body") {
        const val = data.cell.raw as string;
        data.cell.styles.textColor = val === "Completed" ? GREEN : val === "Pending" ? [251, 191, 36] : RED;
      }
    },
  });

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...CARD);
    doc.rect(0, H - 8, W, 8, "F");
    doc.setFontSize(6);
    doc.setTextColor(...MUTED);
    doc.text("CYBERLEND LEDGER - CONFIDENTIAL", 12, H - 3);
    doc.text(`Page ${p} of ${totalPages}`, W - 12, H - 3, { align: "right" });
  }

  doc.save(`cyberlend-report-${new Date().toISOString().split("T")[0]}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. LOAN NOTE STATEMENT
// ─────────────────────────────────────────────────────────────────────────────
export function generateLoanNoteStatement(loan: Loan, orgName: string, preparedBy: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  const DARK  = [15, 17, 23]   as [number, number, number];
  const CARD  = [26, 29, 39]   as [number, number, number];
  const BLUE  = [91, 124, 250] as [number, number, number];
  const WHITE = [232, 234, 240] as [number, number, number];
  const MUTED = [120, 125, 150] as [number, number, number];
  const RED   = [248, 113, 113] as [number, number, number];
  const GREEN = [74, 222, 128]  as [number, number, number];
  const AMBER = [245, 158, 11]  as [number, number, number];

  const fmt = (n: number) => `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
  const now = new Date().toLocaleDateString("en-KE", { day: "2-digit", month: "long", year: "numeric" });

  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 297, "F");
  doc.setFillColor(...CARD);
  doc.rect(0, 0, W, 32, "F");
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, 4, 32, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text(orgName.toUpperCase(), 12, 12);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("LOAN NOTE STATEMENT", 12, 19);
  doc.text(`Generated: ${now}  |  Prepared by: ${preparedBy}`, 12, 25);

  const statusColor = loan.status === "Active" ? BLUE : loan.status === "Overdue" ? RED : GREEN;
  doc.setFillColor(...statusColor);
  doc.roundedRect(W - 42, 10, 32, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(loan.status.toUpperCase(), W - 26, 16.5, { align: "center" });

  let y = 40;
  doc.setFillColor(...CARD);
  doc.roundedRect(10, y, W - 20, 52, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text(loan.borrowerName, 16, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const infoLines = [
    ["Loan Number:", loan.loanNumber],
    ["Phone:",       loan.borrowerPhone],
    ["ID Number:",   loan.borrowerIdNumber || "-"],
    ["Address:",     loan.borrowerAddress  || "-"],
    ["Purpose:",     loan.loanPurpose      || "-"],
    ["Occupation:",  loan.occupation       || "-"],
  ];
  const col1x = 16, col2x = W / 2 + 5;
  infoLines.forEach((pair, i) => {
    const cx = i % 2 === 0 ? col1x : col2x;
    const cy = y + 17 + Math.floor(i / 2) * 9;
    doc.setTextColor(...MUTED);
    doc.text(pair[0], cx, cy);
    doc.setTextColor(...WHITE);
    doc.text(pair[1], cx + 28, cy);
  });

  y += 58;
  const terms = [
    { label: "PRINCIPAL",        value: fmt(loan.loanAmount) },
    { label: "MONTHLY INTEREST", value: fmt(loan.monthlyInterest) },
    { label: "TERM",             value: `${loan.term} months` },
    { label: "ORIGINATED",       value: loan.originationDate },
    { label: "NEXT DUE",         value: loan.nextDueDate },
  ];
  const colW = (W - 20) / terms.length;
  terms.forEach((t, i) => {
    const cx = 10 + i * colW;
    doc.setFillColor(...DARK);
    doc.roundedRect(cx + 1, y, colW - 2, 22, 2, 2, "F");
    doc.setFontSize(6);
    doc.setTextColor(...MUTED);
    doc.text(t.label, cx + colW / 2, y + 6, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLUE);
    doc.text(t.value, cx + colW / 2, y + 14, { align: "center" });
  });

  y += 30;
  const summaryItems = [
    { label: "TOTAL LENT",         value: fmt(loan.loanAmount),        color: WHITE },
    { label: "INTEREST COLLECTED", value: fmt(loan.interestCollected), color: GREEN },
    { label: "REMAINING BALANCE",  value: fmt(loan.remainingBalance),  color: loan.remainingBalance > 0 ? AMBER : GREEN },
    { label: "MONTHS COMPLETED",   value: `${loan.monthsCompleted} / ${loan.term}`, color: WHITE },
  ];
  const sw = (W - 20) / summaryItems.length;
  doc.setFillColor(...CARD);
  doc.roundedRect(10, y, W - 20, 22, 3, 3, "F");
  summaryItems.forEach((s, i) => {
    const cx = 10 + i * sw + sw / 2;
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(s.label, cx, y + 7, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...s.color);
    doc.text(s.value, cx, y + 16, { align: "center" });
  });

  y += 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("TRANSACTION HISTORY", 12, y);
  y += 5;

  const txRows = loan.transactions.map((tx) => [
    tx.date, tx.paymentType, fmt(tx.amount),
    tx.paymentMethod || "-", tx.referenceNumber || "-", tx.status, tx.notes || "-",
  ]);

  if (txRows.length === 0) {
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("No transactions recorded yet.", 12, y + 6);
  } else {
    autoTable(doc, {
      startY: y,
      head: [["DATE", "TYPE", "AMOUNT", "METHOD", "REF", "STATUS", "NOTES"]],
      body: txRows,
      styles: { fontSize: 7, cellPadding: 3, fillColor: DARK, textColor: WHITE, lineColor: [40, 44, 60], lineWidth: 0.2 },
      headStyles: { fillColor: CARD, textColor: MUTED, fontStyle: "bold", fontSize: 6.5 },
      alternateRowStyles: { fillColor: [20, 22, 30] },
      columnStyles: { 2: { textColor: GREEN }, 5: { textColor: BLUE } },
      margin: { left: 10, right: 10 },
    });
  }

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(...CARD);
    doc.rect(0, 287, W, 10, "F");
    doc.setFontSize(6);
    doc.setTextColor(...MUTED);
    doc.text(`${orgName.toUpperCase()} - CONFIDENTIAL`, 12, 293);
    doc.text(`Page ${p} of ${pageCount}`, W - 12, 293, { align: "right" });
  }

  doc.save(`LoanNote_${loan.loanNumber}_${loan.borrowerName.replace(/\s+/g, "_")}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PORTFOLIO DEBT SERVICE REPORT
// ─────────────────────────────────────────────────────────────────────────────
export function generateDebtServiceReport(loans: Loan[], orgName: string, preparedBy: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const DARK  = [15, 17, 23]   as [number, number, number];
  const CARD  = [26, 29, 39]   as [number, number, number];
  const BLUE  = [91, 124, 250] as [number, number, number];
  const WHITE = [232, 234, 240] as [number, number, number];
  const MUTED = [120, 125, 150] as [number, number, number];
  const RED   = [248, 113, 113] as [number, number, number];
  const GREEN = [74, 222, 128]  as [number, number, number];
  const AMBER = [245, 158, 11]  as [number, number, number];

  const fmt = (n: number) => `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
  const now = new Date().toLocaleDateString("en-KE", { day: "2-digit", month: "long", year: "numeric" });

  const activeLoans    = loans.filter((l) => l.status === "Active" || l.status === "Overdue");
  const totalMonthly   = activeLoans.reduce((s, l) => s + l.monthlyInterest, 0);
  const totalPrincipal = activeLoans.reduce((s, l) => s + l.loanAmount, 0);
  const totalCollected = activeLoans.reduce((s, l) => s + l.interestCollected, 0);
  const overdueLoans   = activeLoans.filter((l) => l.status === "Overdue");
  const overdueExposure = overdueLoans.reduce((s, l) => s + l.loanAmount, 0);

  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...CARD);
  doc.rect(0, 0, W, 28, "F");
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, 4, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text(orgName.toUpperCase(), 12, 11);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("PORTFOLIO DEBT SERVICE REPORT", 12, 18);
  doc.text(`Generated: ${now}  |  Prepared by: ${preparedBy}`, 12, 24);
  doc.text(`Active Loans: ${activeLoans.length}  |  Overdue: ${overdueLoans.length}`, W - 12, 24, { align: "right" });

  let y = 34;
  const kpis = [
    { label: "TOTAL PRINCIPAL DEPLOYED", value: fmt(totalPrincipal),  color: BLUE  },
    { label: "MONTHLY INTEREST DUE",     value: fmt(totalMonthly),    color: GREEN },
    { label: "TOTAL COLLECTED",          value: fmt(totalCollected),  color: GREEN },
    { label: "OVERDUE EXPOSURE",         value: fmt(overdueExposure), color: overdueExposure > 0 ? RED : GREEN },
    { label: "ACTIVE BORROWERS",         value: String(activeLoans.length), color: WHITE },
  ];
  const kw = (W - 20) / kpis.length;
  kpis.forEach((k, i) => {
    const cx = 10 + i * kw;
    doc.setFillColor(...CARD);
    doc.roundedRect(cx + 1, y, kw - 2, 20, 2, 2, "F");
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(k.label, cx + kw / 2, y + 6, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...k.color);
    doc.text(k.value, cx + kw / 2, y + 15, { align: "center" });
  });

  y += 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text("DEBT SERVICE SCHEDULE", 12, y);
  y += 4;

  const rows = activeLoans.map((l) => {
    const coverage = l.interestCollected > 0
      ? Math.min(100, Math.round((l.interestCollected / (l.monthlyInterest * l.monthsCompleted || 1)) * 100))
      : 0;
    return [
      l.loanNumber, l.borrowerName, l.borrowerPhone,
      fmt(l.loanAmount), fmt(l.monthlyInterest), fmt(l.interestCollected),
      fmt(l.remainingBalance), `${l.monthsCompleted}/${l.term}`,
      l.nextDueDate, `${coverage}%`, l.status,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["LOAN #", "BORROWER", "PHONE", "PRINCIPAL", "MONTHLY INT.", "COLLECTED", "BALANCE", "PROGRESS", "NEXT DUE", "COVERAGE", "STATUS"]],
    body: rows,
    styles: { fontSize: 6.5, cellPadding: 2.5, fillColor: DARK, textColor: WHITE, lineColor: [40, 44, 60], lineWidth: 0.15 },
    headStyles: { fillColor: CARD, textColor: MUTED, fontStyle: "bold", fontSize: 6 },
    alternateRowStyles: { fillColor: [20, 22, 30] },
    columnStyles: { 3: { textColor: BLUE }, 4: { textColor: GREEN }, 5: { textColor: GREEN }, 6: { textColor: AMBER }, 10: { textColor: BLUE } },
    didParseCell: (data) => {
      if (data.column.index === 10 && data.section === "body") {
        const val = String(data.cell.raw);
        data.cell.styles.textColor = val === "Overdue" ? RED : val === "Active" ? BLUE : GREEN;
      }
    },
    margin: { left: 10, right: 10 },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(...CARD);
    doc.rect(0, H - 10, W, 10, "F");
    doc.setFontSize(6);
    doc.setTextColor(...MUTED);
    doc.text(`${orgName.toUpperCase()} - CONFIDENTIAL`, 12, H - 4);
    doc.text(`Page ${p} of ${pageCount}`, W - 12, H - 4, { align: "right" });
  }

  doc.save(`DebtServiceReport_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PORTFOLIO STANDING REPORT
// ─────────────────────────────────────────────────────────────────────────────
export function generateStandingReport(loans: Loan[], metrics: PortfolioMetrics, orgName: string, preparedBy: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const DARK  = [15, 17, 23]   as [number, number, number];
  const CARD  = [26, 29, 39]   as [number, number, number];
  const BLUE  = [91, 124, 250] as [number, number, number];
  const WHITE = [232, 234, 240] as [number, number, number];
  const MUTED = [120, 125, 150] as [number, number, number];
  const RED   = [248, 113, 113] as [number, number, number];
  const GREEN = [74, 222, 128]  as [number, number, number];
  const AMBER = [245, 158, 11]  as [number, number, number];

  const fmt = (n: number) => `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
  const now = new Date().toLocaleDateString("en-KE", { day: "2-digit", month: "long", year: "numeric" });

  const active    = loans.filter((l) => l.status === "Active");
  const overdue   = loans.filter((l) => l.status === "Overdue");
  const completed = loans.filter((l) => l.status === "Completed");
  const repayRate = loans.length ? Math.round((completed.length / loans.length) * 100) : 0;
  const collectionRate = (() => {
    const expected = loans.reduce((s, l) => s + l.monthlyInterest * l.monthsCompleted, 0);
    if (expected === 0) return 0;
    return Math.min(100, Math.round((metrics.totalCollected / expected) * 100));
  })();

  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...CARD);
  doc.rect(0, 0, W, 28, "F");
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, 4, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text(orgName.toUpperCase(), 12, 11);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("PORTFOLIO STANDING REPORT", 12, 18);
  doc.text(`Generated: ${now}  |  Prepared by: ${preparedBy}`, 12, 24);

  let y = 34;
  const kpis = [
    { label: "TOTAL PRINCIPAL LENT",  value: fmt(metrics.totalPrincipalLent), color: BLUE  },
    { label: "TOTAL INTEREST EARNED", value: fmt(metrics.totalCollected),      color: GREEN },
    { label: "ACTIVE LOANS",          value: String(active.length),            color: BLUE  },
    { label: "OVERDUE LOANS",         value: String(overdue.length),           color: overdue.length > 0 ? RED : GREEN },
    { label: "COMPLETED LOANS",       value: String(completed.length),         color: GREEN },
    { label: "REPAYMENT RATE",        value: `${repayRate}%`,                  color: repayRate >= 80 ? GREEN : repayRate >= 50 ? AMBER : RED },
    { label: "COLLECTION RATE",       value: `${collectionRate}%`,             color: collectionRate >= 80 ? GREEN : AMBER },
  ];
  const kw = (W - 20) / kpis.length;
  kpis.forEach((k, i) => {
    const cx = 10 + i * kw;
    doc.setFillColor(...CARD);
    doc.roundedRect(cx + 1, y, kw - 2, 20, 2, 2, "F");
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(k.label, cx + kw / 2, y + 6, { align: "center" });
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...k.color);
    doc.text(k.value, cx + kw / 2, y + 15, { align: "center" });
  });

  y += 28;
  if (overdue.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...RED);
    doc.text(`OVERDUE ACCOUNTS (${overdue.length})`, 12, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["LOAN #", "BORROWER", "PHONE", "PRINCIPAL", "MONTHLY INT.", "LAST DUE", "MONTHS OVERDUE", "BALANCE"]],
      body: overdue.map((l) => {
        const daysOverdue = Math.floor((Date.now() - new Date(l.nextDueDate).getTime()) / 86400000);
        return [l.loanNumber, l.borrowerName, l.borrowerPhone, fmt(l.loanAmount),
          fmt(l.monthlyInterest), l.nextDueDate, `${Math.ceil(daysOverdue / 30)} mo`, fmt(l.remainingBalance)];
      }),
      styles: { fontSize: 6.5, cellPadding: 2.5, fillColor: [30, 15, 15], textColor: WHITE, lineColor: [60, 30, 30], lineWidth: 0.15 },
      headStyles: { fillColor: [50, 20, 20], textColor: RED, fontStyle: "bold", fontSize: 6 },
      columnStyles: { 3: { textColor: AMBER }, 7: { textColor: RED } },
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text("FULL PORTFOLIO STANDING", 12, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["LOAN #", "BORROWER", "PRINCIPAL", "MONTHLY INT.", "COLLECTED", "BALANCE", "MONTHS", "ORIGINATED", "MATURES", "STATUS"]],
    body: loans.map((l) => [
      l.loanNumber, l.borrowerName, fmt(l.loanAmount), fmt(l.monthlyInterest),
      fmt(l.interestCollected), fmt(l.remainingBalance),
      `${l.monthsCompleted}/${l.term}`, l.originationDate, l.maturityDate, l.status,
    ]),
    styles: { fontSize: 6.5, cellPadding: 2.5, fillColor: DARK, textColor: WHITE, lineColor: [40, 44, 60], lineWidth: 0.15 },
    headStyles: { fillColor: CARD, textColor: MUTED, fontStyle: "bold", fontSize: 6 },
    alternateRowStyles: { fillColor: [20, 22, 30] },
    columnStyles: { 2: { textColor: BLUE }, 4: { textColor: GREEN }, 5: { textColor: AMBER } },
    didParseCell: (data) => {
      if (data.column.index === 9 && data.section === "body") {
        const val = String(data.cell.raw);
        data.cell.styles.textColor = val === "Overdue" ? RED : val === "Active" ? BLUE : GREEN;
      }
    },
    margin: { left: 10, right: 10 },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(...CARD);
    doc.rect(0, H - 10, W, 10, "F");
    doc.setFontSize(6);
    doc.setTextColor(...MUTED);
    doc.text(`${orgName.toUpperCase()} - CONFIDENTIAL`, 12, H - 4);
    doc.text(`Page ${p} of ${pageCount}`, W - 12, H - 4, { align: "right" });
  }

  doc.save(`StandingReport_${new Date().toISOString().slice(0, 10)}.pdf`);
}

