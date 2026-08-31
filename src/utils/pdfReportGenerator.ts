import jsPDF from "jspdf";
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

  // ── PAGE 1 BACKGROUND ──────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, H, "F");

  // header bar
  doc.setFillColor(...CARD);
  doc.rect(0, 0, W, 28, "F");
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, 4, 28, "F");

  // org name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.text(options.organizationName.toUpperCase(), 12, 11);

  // report title
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(options.reportTitle, 12, 18);

  // date + prepared by
  const now = new Date().toLocaleDateString("en-KE", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFontSize(7);
  doc.text(`Generated: ${now}`, 12, 24);
  doc.text(`Prepared by: ${options.preparedBy}`, W - 12, 24, { align: "right" });

  // CYBERLEND watermark
  doc.setFontSize(7);
  doc.setTextColor(...BLUE);
  doc.text("CYBERLEND LEDGER", W - 12, 11, { align: "right" });

  // ── KPI CARDS ──────────────────────────────────────────────────────
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

  // ── LOAN TABLE ─────────────────────────────────────────────────────
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
      l.loanNumber,
      l.borrowerName,
      l.borrowerPhone,
      l.category,
      formatCompactCurrency(l.loanAmount),
      formatCompactCurrency(l.monthlyPayment),
      formatCompactCurrency(l.interestCollected),
      formatCompactCurrency(l.remainingBalance),
      l.status,
      l.maturityDate,
    ]),
    styles: {
      fontSize: 6.5,
      cellPadding: 2.5,
      font: "helvetica",
      textColor: WHITE,
      fillColor: CARD,
      lineColor: BORDER,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [22, 25, 38],
      textColor: MUTED,
      fontStyle: "bold",
      fontSize: 6,
    },
    alternateRowStyles: { fillColor: [20, 22, 33] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 30 },
      2: { cellWidth: 24 },
      3: { cellWidth: 20 },
      4: { cellWidth: 22, halign: "right" },
      5: { cellWidth: 22, halign: "right" },
      6: { cellWidth: 22, halign: "right" },
      7: { cellWidth: 22, halign: "right" },
      8: { cellWidth: 18, halign: "center" },
      9: { cellWidth: 22, halign: "center" },
    },
    didParseCell(data) {
      if (data.column.index === 8 && data.section === "body") {
        const val = data.cell.raw as string;
        data.cell.styles.textColor = statusColor(val);
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // ── PAGE 2 — TRANSACTIONS ──────────────────────────────────────────
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
    l.transactions.map((tx) => ({
      ...tx,
      borrowerName: l.borrowerName,
      loanNumber: l.loanNumber,
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  autoTable(doc, {
    startY: 24,
    margin: { left: 12, right: 12 },
    head: [["TX REF", "LOAN #", "BORROWER", "DATE", "TYPE", "AMOUNT", "METHOD", "STATUS"]],
    body: allTx.map((tx) => [
      tx.referenceNumber || tx.id,
      tx.loanNumber,
      tx.borrowerName,
      tx.date,
      tx.paymentType,
      formatCompactCurrency(tx.amount),
      tx.paymentMethod,
      tx.status,
    ]),
    styles: {
      fontSize: 6.5,
      cellPadding: 2.5,
      font: "helvetica",
      textColor: WHITE,
      fillColor: CARD,
      lineColor: BORDER,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [22, 25, 38],
      textColor: MUTED,
      fontStyle: "bold",
      fontSize: 6,
    },
    alternateRowStyles: { fillColor: [20, 22, 33] },
    columnStyles: {
      5: { halign: "right" },
      7: { halign: "center" },
    },
    didParseCell(data) {
      if (data.column.index === 7 && data.section === "body") {
        const val = data.cell.raw as string;
        data.cell.styles.textColor =
          val === "Completed" ? GREEN : val === "Pending" ? [251, 191, 36] : RED;
      }
    },
  });

  // footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...CARD);
    doc.rect(0, H - 8, W, 8, "F");
    doc.setFontSize(6);
    doc.setTextColor(...MUTED);
    doc.text("CYBERLEND LEDGER — CONFIDENTIAL", 12, H - 3);
    doc.text(`Page ${p} of ${totalPages}`, W - 12, H - 3, { align: "right" });
  }

  doc.save(`cyberlend-report-${new Date().toISOString().split("T")[0]}.pdf`);
}
