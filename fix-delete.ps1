$ErrorActionPreference = "Stop"

function Get-FlexPattern([string]$literal) {
  $esc = [regex]::Escape($literal)
  $esc = $esc -replace "`r`n", "\r?\n"
  $esc = $esc -replace "`n", "\r?\n"
  return $esc
}

function Apply-Fix([string]$path, [string]$label, [string]$alreadyDoneMarker, [string]$old, [string]$new) {
  $raw = Get-Content -Path $path -Raw -Encoding UTF8
  if ($raw.Contains($alreadyDoneMarker)) {
    Write-Host "SKIP (already applied): $label"
    return $raw
  }
  $pattern = Get-FlexPattern $old
  $count = [regex]::Matches($raw, $pattern, "Singleline").Count
  if ($count -ne 1) {
    Write-Host "WARN (expected 1 match, found $count, left unchanged): $label"
    return $raw
  }
  $evaluator = [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $new }
  $result = [regex]::Replace($raw, $pattern, $evaluator, "Singleline")
  Write-Host "APPLIED: $label"
  return $result
}

function Remove-DuplicateLine([string]$raw, [string]$lineText, [string]$label) {
  $i1 = $raw.IndexOf($lineText)
  if ($i1 -lt 0) { return $raw }
  $i2 = $raw.IndexOf($lineText, $i1 + $lineText.Length)
  if ($i2 -lt 0) { return $raw }
  $before = $raw.Substring(0, $i2)
  $after = $raw.Substring($i2 + $lineText.Length)
  $after = $after -replace "^\r?\n", ""
  Write-Host "DEDUPED: $label"
  return $before + $after
}

# ---------- App.tsx ----------
$appPath = ".\src\App.tsx"
Copy-Item $appPath ".\src\App.prev4.txt" -Force
$appText = Get-Content -Path $appPath -Raw -Encoding UTF8

$dupState = "  const [deleteTarget, setDeleteTarget] = useState<Loan | null>(null);"
$appText = Remove-DuplicateLine $appText $dupState "deleteTarget state"

$dupDialog = "      <ConfirmDialog open={!!deleteTarget} title=`"Delete this loan?`" description=`"This permanently deletes the loan and its payment history. Cannot be undone.`" confirmLabel=`"Delete`" destructive onConfirm={() => { if (deleteTarget) deleteLoan(deleteTarget.id); setDeleteTarget(null); setDetailLoan(null); }} onCancel={() => setDeleteTarget(null)} />"
$appText = Remove-DuplicateLine $appText $dupDialog "delete-loan ConfirmDialog"

Set-Content -Path $appPath -Value $appText -Encoding UTF8
Write-Host "App.tsx deduped and saved."

# ---------- LoanLedgerTable.tsx ----------
$tablePath = ".\src\components\LoanLedgerTable.tsx"
Copy-Item $tablePath ".\src\components\LoanLedgerTable.prev2.txt" -Force
$tableText = Get-Content -Path $tablePath -Raw -Encoding UTF8

$dupState2 = "  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<Loan[] | null>(null);"
$tableText = Remove-DuplicateLine $tableText $dupState2 "confirmDeleteGroup state"

$oldTrash = @"
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedBorrower(group); }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: t.textFaint }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,50,50,0.1)"; e.currentTarget.style.color = "#f87171"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.textFaint; }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
"@
$newTrash = @"
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteGroup(group); }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: t.textFaint }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,50,50,0.1)"; e.currentTarget.style.color = "#f87171"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.textFaint; }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
"@
$tableText = Apply-Fix $tablePath "trash icon -> confirm delete" "setConfirmDeleteGroup(group)" $oldTrash $newTrash

$oldClose = @"
      )}
    </div>
  );
};
"@
$newClose = @"
      )}

      {confirmDeleteGroup && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4" onClick={() => setConfirmDeleteGroup(null)}>
          <div className="w-full max-w-sm rounded-2xl border p-5" style={{ background: t.bgCard, borderColor: t.border }} onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold mb-1" style={{ color: t.text }}>
              Delete {confirmDeleteGroup.length > 1 ? "all loans" : "this loan"} for {confirmDeleteGroup[0].borrowerName}?
            </p>
            <p className="text-xs mb-4" style={{ color: t.textFaint }}>This permanently removes {confirmDeleteGroup.length} loan{confirmDeleteGroup.length === 1 ? "" : "s"} and their payment history. Cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDeleteGroup(null)} className="px-3 py-1.5 rounded-xl border text-xs font-bold" style={{ background: t.bgBtn, borderColor: t.border, color: t.textMuted }}>CANCEL</button>
              <button
                onClick={() => { confirmDeleteGroup.forEach((l) => onDeleteLoan(l.id)); setConfirmDeleteGroup(null); }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: "#f87171", color: "#111" }}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
"@
$tableText = Apply-Fix $tablePath "add confirm-delete modal" "confirmDeleteGroup &&" $oldClose $newClose

Set-Content -Path $tablePath -Value $tableText -Encoding UTF8
Write-Host "LoanLedgerTable.tsx updated."

npm run build
