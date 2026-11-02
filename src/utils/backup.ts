import { Capacitor } from "@capacitor/core"
import { Filesystem, Directory } from "@capacitor/filesystem"

const BACKUP_KEYS = [
  "cyberlend_loans",
  "cyberlend_waitlist",
  "cyberlend_goals",
  "cyberlend_agreements",
  "cyberlend_capital",
  "cyberlend_lender_default",
  "cyberlend_settings",
  "cyberlend-theme",
]

function textToBase64(text: string) {
  const bytes = new TextEncoder().encode(text)
  let bin = ""
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin)
}

function stamp() {
  return new Date().toISOString().split("T")[0]
}

export async function exportBackup() {
  const data: Record<string, string> = {}
  BACKUP_KEYS.forEach((key) => {
    const raw = localStorage.getItem(key)
    if (raw !== null) data[key] = raw
  })
  const payload = JSON.stringify({ app: "cyberlend-ledger", version: 1, exportedAt: new Date().toISOString(), data }, null, 2)
  const filename = "cyberlend-backup-" + stamp() + ".json"

  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: "Download/" + filename,
      data: textToBase64(payload),
      directory: Directory.ExternalStorage,
      recursive: true,
    })
    return
  }
  const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export interface BackupResult {
  ok: boolean
  message: string
}

export function restoreBackup(fileText: string): BackupResult {
  let parsed: any
  try {
    parsed = JSON.parse(fileText)
  } catch {
    return { ok: false, message: "That file is not valid JSON" }
  }
  if (!parsed || parsed.app !== "cyberlend-ledger" || !parsed.data) {
    return { ok: false, message: "That file does not look like a Cyberlend backup" }
  }
  BACKUP_KEYS.forEach((key) => {
    const value = parsed.data[key]
    if (typeof value === "string") localStorage.setItem(key, value)
  })
  return { ok: true, message: "Backup restored" }
}

export function eraseAllData() {
  BACKUP_KEYS.forEach((key) => localStorage.removeItem(key))
}

