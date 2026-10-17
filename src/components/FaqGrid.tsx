import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  { q: "How do I record a payment?", a: "Open a loan from the ledger and choose Record Payment. An interest payment rolls the loan over to the next month. A principal payment settles and closes the loan." },
  { q: "What do the loan statuses mean?", a: "Active loans are running and on time. Overdue loans have passed their due date. Completed loans are fully settled. Defaulted loans are flagged as unlikely to be repaid." },
  { q: "How do I export my ledger?", a: "Use the Export button above the ledger and pick CSV, Excel or PDF. On the Android app the file is saved to your Downloads folder." },
  { q: "Where is my data stored?", a: "Your records are saved in this app's local storage on this device. Export regularly so you always have a backup copy." },
  { q: "What is the waitlist?", a: "The waitlist holds clients who have enquired but have no loan yet. Promote an entry to a loan when you are ready to lend." },
  { q: "Can I edit a client's details?", a: "Yes. Open the Clients page, pick a client and use the edit option to update their details, notes and flags." },
  { q: "Where do I find loan agreements?", a: "Open the Agreements page to create an agreement for a loan and download it as a PDF." },
  { q: "How do I start a new loan?", a: "Use the New Loan button, fill in the borrower and loan details, and save. The loan then appears in the ledger as Active." },
];

export function FaqGrid() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-5xl px-2 py-10">
      <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--gold-500)]">
        Frequently asked questions
      </p>
      <h2 className="mx-auto mt-3 max-w-xl text-center font-heading text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
        Quick answers, organized by topic.
      </h2>
      <p className="mx-auto mt-4 max-w-md text-center text-sm text-[var(--text-muted)]">
        Tap any card to read the full answer.
      </p>

      <div className="mt-10 grid items-start gap-3 md:grid-cols-2">
        {faqs.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={item.q}
              className={cn(
                "rounded-xl border bg-[var(--bg-surface)] transition-colors",
                isOpen ? "border-[var(--gold-500)]" : "border-[rgba(243,234,216,0.08)] hover:bg-[var(--bg-raised)]"
              )}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-[var(--text-primary)]"
              >
                {item.q}
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200", isOpen && "rotate-180")}
                />
              </button>
              <div className={cn("grid transition-[grid-template-rows] duration-200 ease-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--text-muted)]">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}