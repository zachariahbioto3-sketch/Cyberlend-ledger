import { readFileSync, writeFileSync } from "fs";
const path = "src/components/ClientProfilePanel.tsx";
let src = readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const steps = [
  // 1. StatRow becomes clickable + chevron rotates when open
  [`function StatRow({
  theme: t, label, value, last,
}: { theme: any; label: string; value: number; last?: boolean }) {
  return (
    <div
      className={\`flex items-center justify-between px-5 py-3.5 \${last ? "" : "border-b"}\`}
      style={{ borderColor: t.border }}
    >
      <p className="text-sm" style={{ color: t.text }}>{label}</p>
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold" style={{ color: t.text }}>{value}</span>
        <ChevronRight className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
      </div>
    </div>
  );
}`,
   `function StatRow({
  theme: t, label, value, last, open, onClick,
}: { theme: any; label: string; value: number; last?: boolean; open?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={\`w-full flex items-center justify-between px-5 py-3.5 \${last ? "" : "border-b"}\`}
      style={{ borderColor: t.border }}
    >
      <p className="text-sm" style={{ color: t.text }}>{label}</p>
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold" style={{ color: t.text }}>{value}</span>
        <ChevronRight
          className="w-3.5 h-3.5 transition-transform"
          style={{ color: t.textFaint, transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </div>
    </button>
  );
}`,
   "make StatRow clickable with rotating chevron"],

  // 2. Add toggle state
  [`  const [lightbox, setLightbox] = React.useState<string | null>(null);`,
   `  const [lightbox, setLightbox] = React.useState<string | null>(null);\n  const [loansOpen, setLoansOpen] = React.useState(false);\n  const [txOpen, setTxOpen] = React.useState(false);`,
   "add loansOpen/txOpen state"],

  // 3. Wire the two stat rows
  [`        <StatRow theme={t} label="Loans" value={clientLoans.length} />\n        <StatRow theme={t} label="Transactions" value={totalTransactions} last />`,
   `        <StatRow theme={t} label="Loans" value={clientLoans.length} open={loansOpen} onClick={() => setLoansOpen((v) => !v)} />\n        <StatRow theme={t} label="Transactions" value={totalTransactions} last open={txOpen} onClick={() => setTxOpen((v) => !v)} />`,
   "wire stat row clicks"],

  // 4. Gate Payment history behind txOpen + add persistent Remaining value
  [`      {/* Payment history group */}
      <GroupCard theme={t}>`,
   `      {/* Payment history group — collapsed by default, opened from the Transactions row above */}
      {txOpen && (
      <GroupCard theme={t}>`,
   "gate payment history behind txOpen"],
  [`                      <div className="text-right shrink-0">
                        <p className="text-[9px]" style={{ color: t.textMuted }}>{formatDate(tx.date)}</p>
                        <p className="text-[9px]" style={{ color: tx.status === "Completed" ? "#4ade80" : "#f87171" }}>
                          {tx.status}
                        </p>
                      </div>`,
   `                      <div className="text-right shrink-0">
                        <p className="text-[9px]" style={{ color: t.textMuted }}>{formatDate(tx.date)}</p>
                        <p className="text-[9px]" style={{ color: tx.status === "Completed" ? "#4ade80" : "#f87171" }}>
                          {tx.status}
                        </p>
                        {cyc && (
                          <p className="text-[9px] font-bold" style={{ color: cyc.remaining > 0 ? "#f87171" : "#4ade80" }}>
                            Remaining {formatCurrency(cyc.remaining)}
                          </p>
                        )}
                      </div>`,
   "show Remaining value on every payment row"],
  [`          )}
        </div>
      </GroupCard>

      {/* Dues history group */}
      <GroupCard theme={t}>
        <GroupLabel theme={t}>Dues history</GroupLabel>
        <div className="max-h-72 overflow-y-auto pb-2">`,
   `          )}
        </div>
      </GroupCard>
      )}

      {/* Dues history group — collapsed by default, opened from the Loans row above */}
      {loansOpen && (
      <GroupCard theme={t}>
        <GroupLabel theme={t}>Dues history</GroupLabel>
        <div className="max-h-72 overflow-y-auto pb-2">`,
   "gate dues history behind loansOpen"],
  [`        </div>
      </GroupCard>

      {lightbox && (`,
   `        </div>
      </GroupCard>
      )}

      {lightbox && (`,
   "close loansOpen conditional"],
];

for (const [find, replace, label] of steps) {
  if (src.includes(replace)) { console.log(`[skip] ${label}`); continue; }
  if (!src.includes(find)) throw new Error(`Anchor not found for "${label}"`);
  src = src.replace(find, replace);
  console.log(`[ok] ${label}`);
}

writeFileSync(path, src, "utf8");
