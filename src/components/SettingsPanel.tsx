import { useState, useEffect, useRef } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "./ui/sheet"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { ConfirmDialog } from "./ConfirmDialog"
import { LenderDetails } from "../types"
import { exportBackup, restoreBackup, eraseAllData } from "../utils/backup"
import { CyberlendSettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from "../utils/settings"
import { fieldClassName } from "./ui/input"
import { Sun, Moon } from "lucide-react"
import { isSecurityEnabled, isSecurityConfigured, setSecurityEnabled, setupPin, verifyPin, verifyRecoveryCode, resetPinWithRecovery, getAutoLockMinutes, setAutoLockMinutes, isBiometricAvailable, isBiometricEnabled, setBiometricEnabled, verifyBiometric } from "../utils/security"

interface SettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isDark: boolean
  onToggleTheme: () => void
}

const LENDER_KEY = "cyberlend_lender_default"
const EMPTY_LENDER: LenderDetails = { fullName: "", idNumber: "", address: "", phone: "", email: "" }

function loadLender(): LenderDetails {
  try {
    const raw = localStorage.getItem(LENDER_KEY)
    return raw ? { ...EMPTY_LENDER, ...JSON.parse(raw) } : EMPTY_LENDER
  } catch {
    return EMPTY_LENDER
  }
}

export function SettingsPanel({ open, onOpenChange, isDark, onToggleTheme }: SettingsPanelProps) {
  const [lender, setLender] = useState<LenderDetails>(EMPTY_LENDER)
  const [settings, setSettings] = useState<CyberlendSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)

  const [secEnabled, setSecEnabled] = useState(false)
  const [secConfigured, setSecConfigured] = useState(false)
  const [autoLockMinutes, setAutoLockMinutesState] = useState(5)
  const [secMode, setSecMode] = useState<"idle" | "setup-pin" | "setup-confirm" | "setup-done" | "reset-code" | "reset-newpin" | "reset-done">("idle")
  const [secPin1, setSecPin1] = useState("")
  const [secPin2, setSecPin2] = useState("")
  const [resetCode, setResetCode] = useState("")
  const [issuedCode, setIssuedCode] = useState("")
  const [secError, setSecError] = useState("")
  const [bioHardwareAvailable, setBioHardwareAvailable] = useState(false)
  const [bioEnabled, setBioEnabled] = useState(false)
  const [dangerMode, setDangerMode] = useState<"idle" | "pin" | "confirm">("idle")
  const [dangerPin, setDangerPin] = useState("")
  const [dangerError, setDangerError] = useState("")

  useEffect(() => {
    if (open) {
      setLender(loadLender())
      setSettings(loadSettings())
      setSaved(false)
      setSecEnabled(isSecurityEnabled())
      setSecConfigured(isSecurityConfigured())
      setAutoLockMinutesState(getAutoLockMinutes())
      setSecMode("idle")
      setSecPin1("")
      setSecPin2("")
      setResetCode("")
      setSecError("")
      setBioEnabled(isBiometricEnabled())
      isBiometricAvailable().then(setBioHardwareAvailable)
      setDangerMode("idle")
      setDangerPin("")
      setDangerError("")
    }
  }, [open])

  const set = (key: keyof LenderDetails, value: string) => {
    setLender((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const setSetting = (key: keyof CyberlendSettings, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem(LENDER_KEY, JSON.stringify(lender))
    saveSettings(settings)
    setSaved(true)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingRestoreText, setPendingRestoreText] = useState<string | null>(null)
  const [restoreError, setRestoreError] = useState("")

  const handleExport = () => {
    exportBackup()
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPendingRestoreText(String(reader.result || ""))
      setRestoreError("")
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const handleConfirmRestore = () => {
    if (pendingRestoreText === null) return
    const result = restoreBackup(pendingRestoreText)
    setPendingRestoreText(null)
    if (result.ok) {
      window.location.reload()
    } else {
      setRestoreError(result.message)
    }
  }
  const handleToggleSecurity = () => {
    if (!secConfigured) {
      setSecMode("setup-pin")
      setSecError("")
      return
    }
    const next = !secEnabled
    setSecurityEnabled(next)
    setSecEnabled(next)
  }

  const handleSetupContinue = () => {
    if (secPin1.length !== 6) {
      setSecError("Enter all 6 digits")
      return
    }
    setSecError("")
    setSecMode("setup-confirm")
  }

  const handleSetupSubmit = async () => {
    if (secPin2 !== secPin1) {
      setSecError("PINs do not match")
      return
    }
    const code = await setupPin(secPin1)
    setIssuedCode(code)
    setSecEnabled(true)
    setSecConfigured(true)
    setAutoLockMinutesState(5)
    setSecMode("setup-done")
    setSecError("")
  }

  const handleStartReset = () => {
    setSecMode("reset-code")
    setResetCode("")
    setSecError("")
  }

  const handleResetCodeContinue = async () => {
    const ok = await verifyRecoveryCode(resetCode)
    if (ok) {
      setSecError("")
      setSecPin1("")
      setSecPin2("")
      setSecMode("reset-newpin")
    } else {
      setSecError("That recovery code does not match")
    }
  }

  const handleResetSubmit = async () => {
    if (secPin1.length !== 6) {
      setSecError("New PIN must be 6 digits")
      return
    }
    if (secPin1 !== secPin2) {
      setSecError("PINs do not match")
      return
    }
    const code = await resetPinWithRecovery(secPin1)
    setIssuedCode(code)
    setSecMode("reset-done")
    setSecError("")
  }

  const handleAutoLockChange = (minutes: number) => {
    setAutoLockMinutesState(minutes)
    setAutoLockMinutes(minutes)
  }
  const handleToggleBiometric = async () => {
    if (bioEnabled) {
      setBiometricEnabled(false)
      setBioEnabled(false)
      return
    }
    setSecError("")
    const confirmed = await verifyBiometric()
    if (confirmed) {
      setBiometricEnabled(true)
      setBioEnabled(true)
    } else {
      setSecError("Could not confirm fingerprint or face")
    }
  }
  const handleStartErase = () => {
    setDangerError("")
    setDangerPin("")
    setDangerMode(isSecurityEnabled() ? "pin" : "confirm")
  }

  const handleDangerPinContinue = async () => {
    const ok = await verifyPin(dangerPin)
    if (ok) {
      setDangerError("")
      setDangerMode("confirm")
    } else {
      setDangerError("Incorrect PIN")
    }
  }

  const handleConfirmErase = () => {
    eraseAllData()
    window.location.reload()
  }

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Lender account and app preferences</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Account</h3>

            <div className="space-y-1.5">
              <Label htmlFor="settings-fullname">Full name</Label>
              <Input id="settings-fullname" value={lender.fullName} onChange={(e) => set("fullName", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="settings-email">Email</Label>
              <Input id="settings-email" type="email" value={lender.email} onChange={(e) => set("email", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="settings-phone">Phone</Label>
              <Input id="settings-phone" value={lender.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="settings-idnumber">ID number</Label>
              <Input id="settings-idnumber" value={lender.idNumber} onChange={(e) => set("idNumber", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="settings-address">Address</Label>
              <Input id="settings-address" value={lender.address} onChange={(e) => set("address", e.target.value)} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Backup and restore</h3>
            <p className="text-xs text-muted-foreground">Export everything to a JSON file, or restore from one. Restoring replaces all current data.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>Export all data</Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Restore from backup</Button>
            </div>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileSelected} />
            {restoreError && <p className="text-xs text-red-500">{restoreError}</p>}
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Defaults</h3>

            <div className="space-y-1.5">
              <Label htmlFor="settings-rate">Default interest rate percent</Label>
              <Input id="settings-rate" type="number" value={settings.defaultInterestRate} onChange={(e) => setSetting("defaultInterestRate", Number(e.target.value))} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="settings-fee-type">Default processing fee type</Label>
              <select id="settings-fee-type" className={fieldClassName + " h-9"} value={settings.defaultProcessingFeeType} onChange={(e) => setSetting("defaultProcessingFeeType", e.target.value)}>
                <option value="None">None</option>
                <option value="Percentage">Percentage</option>
                <option value="Fixed">Fixed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="settings-fee-value">Default processing fee value</Label>
              <Input id="settings-fee-value" type="number" value={settings.defaultProcessingFeeValue} onChange={(e) => setSetting("defaultProcessingFeeValue", Number(e.target.value))} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="settings-frequency">Default repayment frequency</Label>
              <select id="settings-frequency" className={fieldClassName + " h-9"} value={settings.defaultRepaymentFrequency} onChange={(e) => setSetting("defaultRepaymentFrequency", e.target.value)}>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-weekly">Bi-weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Analytics target</h3>
            <div className="space-y-1.5">
              <Label htmlFor="settings-target-rate">Target return rate percent</Label>
              <Input id="settings-target-rate" type="number" value={settings.targetReturnRate} onChange={(e) => setSetting("targetReturnRate", Number(e.target.value))} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Theme</h3>
            <Button variant="outline" size="sm" onClick={onToggleTheme}>
              {isDark ? <Sun className="w-4 h-4 mr-1" /> : <Moon className="w-4 h-4 mr-1" />}
              {isDark ? "Switch to light mode" : "Switch to dark mode"}
            </Button>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notifications</h3>
            <p className="text-xs text-muted-foreground">This app does not send notifications yet. These settings are saved for when that is built.</p>

            <Button variant="outline" size="sm" onClick={() => setSetting("notificationsEnabled", !settings.notificationsEnabled)}>
              {settings.notificationsEnabled ? "Notifications on" : "Notifications off"}
            </Button>

            <div className="space-y-1.5">
              <Label htmlFor="settings-ringtone">Ringtone</Label>
              <select id="settings-ringtone" className={fieldClassName + " h-9"} value={settings.notificationRingtone} onChange={(e) => setSetting("notificationRingtone", e.target.value)}>
                <option value="Default">Default</option>
                <option value="Chime">Chime</option>
                <option value="Bell">Bell</option>
                <option value="None">None</option>
              </select>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Security</h3>

            {secMode === "idle" && (
              <>
                <p className="text-xs text-muted-foreground">
                  {secConfigured
                    ? (secEnabled ? "A 6-digit PIN protects this app." : "A PIN is saved but not currently required.")
                    : "Protect this app with a 6-digit PIN."}
                </p>
                <Button variant="outline" size="sm" onClick={handleToggleSecurity}>
                  {secConfigured ? (secEnabled ? "Turn off security" : "Turn on security") : "Set up a PIN"}
                </Button>
                {secConfigured && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="settings-autolock" className="whitespace-nowrap">Auto-lock after</Label>
                    <Input id="settings-autolock" type="number" min={1} className="w-20" value={autoLockMinutes} onChange={(e) => handleAutoLockChange(Number(e.target.value))} />
                    <span className="text-xs text-muted-foreground">minutes idle</span>
                  </div>
                )}
                {secConfigured && (
                  <Button variant="outline" size="sm" onClick={handleStartReset}>Reset PIN</Button>
                )}
                {secConfigured && bioHardwareAvailable && (
                  <Button variant="outline" size="sm" onClick={handleToggleBiometric}>
                    {bioEnabled ? "Turn off fingerprint or face unlock" : "Enable fingerprint or face unlock"}
                  </Button>
                )}
              </>
            )}

            {secMode === "setup-pin" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-setup-pin1">Choose a 6-digit PIN</Label>
                  <Input id="settings-setup-pin1" type="password" inputMode="numeric" maxLength={6} value={secPin1} onChange={(e) => setSecPin1(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                </div>
                {secError && <p className="text-xs text-red-500">{secError}</p>}
                <Button size="sm" onClick={handleSetupContinue}>Continue</Button>
              </>
            )}

            {secMode === "setup-confirm" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-setup-pin2">Confirm PIN</Label>
                  <Input id="settings-setup-pin2" type="password" inputMode="numeric" maxLength={6} value={secPin2} onChange={(e) => setSecPin2(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                </div>
                {secError && <p className="text-xs text-red-500">{secError}</p>}
                <Button size="sm" onClick={handleSetupSubmit}>Save PIN</Button>
              </>
            )}

            {secMode === "setup-done" && (
              <>
                <p className="text-xs text-muted-foreground">Write this recovery code down somewhere safe. It will not be shown again.</p>
                <div className="p-3 rounded-md border text-center font-mono text-lg tracking-wider" style={{ borderColor: "var(--border)" }}>
                  {issuedCode}
                </div>
                <Button size="sm" onClick={() => setSecMode("idle")}>I have saved this code</Button>
              </>
            )}

            {secMode === "reset-code" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-reset-code">Current recovery code</Label>
                  <Input id="settings-reset-code" value={resetCode} onChange={(e) => setResetCode(e.target.value)} placeholder="XXXX-XXXX-XXXX" />
                </div>
                {secError && <p className="text-xs text-red-500">{secError}</p>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleResetCodeContinue}>Continue</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSecMode("idle"); setSecError("") }}>Cancel</Button>
                </div>
              </>
            )}

            {secMode === "reset-newpin" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-reset-pin1">New PIN</Label>
                  <Input id="settings-reset-pin1" type="password" inputMode="numeric" maxLength={6} value={secPin1} onChange={(e) => setSecPin1(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-reset-pin2">Confirm new PIN</Label>
                  <Input id="settings-reset-pin2" type="password" inputMode="numeric" maxLength={6} value={secPin2} onChange={(e) => setSecPin2(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                </div>
                {secError && <p className="text-xs text-red-500">{secError}</p>}
                <Button size="sm" onClick={handleResetSubmit}>Save new PIN</Button>
              </>
            )}

            {secMode === "reset-done" && (
              <>
                <p className="text-xs text-muted-foreground">Write this new recovery code down somewhere safe. The old one no longer works.</p>
                <div className="p-3 rounded-md border text-center font-mono text-lg tracking-wider" style={{ borderColor: "var(--border)" }}>
                  {issuedCode}
                </div>
                <Button size="sm" onClick={() => setSecMode("idle")}>Done</Button>
              </>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-red-500">Danger zone</h3>

            {dangerMode === "idle" && (
              <>
                <p className="text-xs text-muted-foreground">Permanently erases all loans, clients, agreements and settings on this device. Your PIN and recovery code are kept.</p>
                <Button variant="destructive" size="sm" onClick={handleStartErase}>Erase all data</Button>
              </>
            )}

            {dangerMode === "pin" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-danger-pin">Enter your PIN to continue</Label>
                  <Input id="settings-danger-pin" type="password" inputMode="numeric" maxLength={6} value={dangerPin} onChange={(e) => setDangerPin(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                </div>
                {dangerError && <p className="text-xs text-red-500">{dangerError}</p>}
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={handleDangerPinContinue}>Continue</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDangerMode("idle")}>Cancel</Button>
                </div>
              </>
            )}
          </section>

          <section className="space-y-1 opacity-50">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">About</h3>
            <p className="text-xs text-muted-foreground">Cyberlend Ledger</p>
          </section>
        </div>

        <SheetFooter>
          <Button onClick={handleSave}>{saved ? "Saved" : "Save changes"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    <ConfirmDialog
      open={pendingRestoreText !== null}
      title="Restore from backup?"
      description="This replaces all current loans, clients, agreements and settings with the contents of the selected file. This cannot be undone."
      confirmLabel="Restore"
      destructive
      onConfirm={handleConfirmRestore}
      onCancel={() => setPendingRestoreText(null)}
    />
    <ConfirmDialog
      open={dangerMode === "confirm"}
      title="Erase all data?"
      description="This permanently deletes all loans, clients, agreements and settings on this device. Your PIN and recovery code are kept. This cannot be undone."
      confirmLabel="Erase everything"
      destructive
      onConfirm={handleConfirmErase}
      onCancel={() => setDangerMode("idle")}
    />
    </>
  )
}









