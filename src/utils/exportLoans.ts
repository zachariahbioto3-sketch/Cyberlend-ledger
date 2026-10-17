import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Loan } from "../types";
import { savePdf } from "./pdfReportGenerator";

const HEADERS = [
  "Loan #", "Borrower", "Phone", "Principal", "Monthly Interest",
  "Total Repayable", "Paid", "Remaining", "Status", "Next Due", "Originated",
];

function toRows(loans: Loan[]) {
  return loans.map((l) => [
    l.loanNumber, l.borrowerName, l.borrowerPhone, l.loanAmount, l.monthlyInterest,
    l.totalRepayable, l.amountPaid, l.remainingBalance, l.status, l.nextDueDate, l.originationDate,
  ]);
}

function stamp() {
  return new Date().toISOString().split("T")[0];
}

function textToBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function base64ToBlob(base64: string, mime: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// Web: normal download. Android APK: saves into the Downloads folder.
async function saveFile(filename: string, mime: string, base64: string) {
  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: `Download/${filename}`,
      data: base64,
      directory: Directory.ExternalStorage,
      recursive: true,
    });
    return;
  }
  const url = URL.createObjectURL(base64ToBlob(base64, mime));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportLoansCSV(loans: Loan[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [HEADERS, ...toRows(loans)].map((r) => r.map(esc).join(",")).join("\r\n");
  await saveFile(`cyberlend-ledger-${stamp()}.csv`, "text/csv", textToBase64("\uFEFF" + csv));
}

export async function exportLoansExcel(loans: Loan[]) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...toRows(loans)]);
  ws["!cols"] = [12, 22, 14, 12, 16, 16, 12, 12, 12, 12, 12].map((wch) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ledger");
  const base64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
  await saveFile(
    `cyberlend-ledger-${stamp()}.xlsx`,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    base64
  );
}

export async function exportLoansPDF(loans: Loan[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const kes = (n: number) => `KES ${Math.round(n || 0).toLocaleString("en-KE")}`;
  const outstanding = loans.reduce(
    (s, l) => s + (l.status === "Active" || l.status === "Overdue" ? l.remainingBalance : 0), 0
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Cyberlend Capital - Loan Ledger", 14, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${loans.length} records | ${kes(outstanding)} outstanding | ${stamp()}`, 14, 22);

  autoTable(doc, {
    startY: 27,
    head: [["Loan #", "Borrower", "Phone", "Principal", "Paid", "Remaining", "Status", "Next Due"]],
    body: loans.map((l) => [
      l.loanNumber, l.borrowerName, l.borrowerPhone, kes(l.loanAmount),
      kes(l.amountPaid), kes(l.remainingBalance), l.status, l.nextDueDate,
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [196, 154, 47], textColor: [10, 10, 10] },
    columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
  });

  await savePdf(doc, `cyberlend-ledger-${stamp()}.pdf`);
}