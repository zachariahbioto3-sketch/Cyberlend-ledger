import { useState } from "react";
import { Download, FileText, FileSpreadsheet, FileType, Loader2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "./Toast";
import { Loan } from "../types";
import { exportLoansCSV, exportLoansExcel, exportLoansPDF } from "../utils/exportLoans";

type Kind = "csv" | "excel" | "pdf";

const itemClass =
  "min-h-11 gap-3 px-3 text-sm text-[var(--text-primary)] focus:bg-[var(--bg-raised)] focus:text-[var(--gold-500)]";

export function ExportMenu({ loans }: { loans: Loan[] }) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState<Kind | null>(null);

  const run = async (kind: Kind) => {
    if (loans.length === 0) { showToast("No loans to export", "error"); return; }
    setBusy(kind);
    try {
      if (kind === "csv") await exportLoansCSV(loans);
      if (kind === "excel") await exportLoansExcel(loans);
      if (kind === "pdf") await exportLoansPDF(loans);
      showToast(`Ledger exported as ${kind.toUpperCase()}`, "success");
    } catch (e) {
      console.error("Export failed", e);
      showToast("Export failed", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={busy !== null}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--gold-500)] px-4 text-xs font-medium text-[var(--gold-500)] transition-colors hover:bg-[var(--gold-500)] hover:text-[var(--bg-base)] disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Export
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border border-[rgba(243,234,216,0.1)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-[var(--text-primary)]">
            Export as
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={itemClass} onClick={() => run("csv")}>
          <FileText className="h-4 w-4" /> Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass} onClick={() => run("excel")}>
          <FileSpreadsheet className="h-4 w-4" /> Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass} onClick={() => run("pdf")}>
          <FileType className="h-4 w-4" /> Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}