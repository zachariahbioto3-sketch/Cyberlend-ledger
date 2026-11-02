import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { verifyPin, verifyRecoveryCode, resetPinWithRecovery, isBiometricEnabled, verifyBiometric } from "../utils/security"

interface AppLockScreenProps {
  onUnlock: () => void
}

type Mode = "pin" | "forgot-code" | "forgot-newpin" | "forgot-done"

export function AppLockScreen({ onUnlock }: AppLockScreenProps) {
  const [mode, setMode] = useState<Mode>("pin")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [newPin, setNewPin] = useState("")
  const [newPinConfirm, setNewPinConfirm] = useState("")
  const [issuedCode, setIssuedCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [biometricAvailable] = useState(() => isBiometricEnabled())

  const attemptBiometric = async () => {
    setBusy(true)
    const ok = await verifyBiometric()
    setBusy(false)
    if (ok) onUnlock()
  }

  useEffect(() => {
    if (biometricAvailable) {
      attemptBiometric()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUnlock = async () => {
    if (pin.length !== 6) {
      setError("Enter all 6 digits")
      return
    }
    setBusy(true)
    const ok = await verifyPin(pin)
    setBusy(false)
    if (ok) {
      onUnlock()
    } else {
      setError("Incorrect PIN")
      setPin("")
    }
  }

  const handleCheckRecoveryCode = async () => {
    if (!recoveryCode.trim()) {
      setError("Enter your recovery code")
      return
    }
    setBusy(true)
    const ok = await verifyRecoveryCode(recoveryCode)
    setBusy(false)
    if (ok) {
      setError("")
      setMode("forgot-newpin")
    } else {
      setError("That recovery code does not match")
    }
  }

  const handleSetNewPin = async () => {
    if (newPin.length !== 6) {
      setError("New PIN must be 6 digits")
      return
    }
    if (newPin !== newPinConfirm) {
      setError("PINs do not match")
      return
    }
    setBusy(true)
    const code = await resetPinWithRecovery(newPin)
    setBusy(false)
    setIssuedCode(code)
    setError("")
    setMode("forgot-done")
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
      <div className="card-surface p-6 max-w-sm w-full flex flex-col gap-4">
        {mode === "pin" && (
          <>
            <div>
              <h3 className="font-heading text-base font-semibold text-[var(--text-primary)]">Enter your PIN</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">Cyberlend Ledger is locked</p>
            </div>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError("") }}
              onKeyDown={(e) => { if (e.key === "Enter") handleUnlock() }}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button onClick={handleUnlock} disabled={busy}>Unlock</Button>
            {biometricAvailable && (
              <Button variant="outline" onClick={attemptBiometric} disabled={busy}>Use fingerprint or face</Button>
            )}
            <button className="text-xs text-center text-[var(--text-muted)] underline" onClick={() => { setMode("forgot-code"); setError("") }}>
              Forgot PIN?
            </button>
          </>
        )}

        {mode === "forgot-code" && (
          <>
            <div>
              <h3 className="font-heading text-base font-semibold text-[var(--text-primary)]">Recovery code</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">Enter the recovery code you saved when you set up your PIN</p>
            </div>
            <Input
              autoFocus
              value={recoveryCode}
              onChange={(e) => { setRecoveryCode(e.target.value); setError("") }}
              placeholder="XXXX-XXXX-XXXX"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button onClick={handleCheckRecoveryCode} disabled={busy}>Continue</Button>
            <button className="text-xs text-center text-[var(--text-muted)] underline" onClick={() => { setMode("pin"); setError("") }}>
              Back to PIN entry
            </button>
          </>
        )}

        {mode === "forgot-newpin" && (
          <>
            <div>
              <h3 className="font-heading text-base font-semibold text-[var(--text-primary)]">Set a new PIN</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">Choose a new 6-digit PIN</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lock-new-pin">New PIN</Label>
              <Input id="lock-new-pin" type="password" inputMode="numeric" maxLength={6}
                value={newPin} onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError("") }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lock-new-pin-confirm">Confirm new PIN</Label>
              <Input id="lock-new-pin-confirm" type="password" inputMode="numeric" maxLength={6}
                value={newPinConfirm} onChange={(e) => { setNewPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6)); setError("") }} />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button onClick={handleSetNewPin} disabled={busy}>Set new PIN</Button>
          </>
        )}

        {mode === "forgot-done" && (
          <>
            <div>
              <h3 className="font-heading text-base font-semibold text-[var(--text-primary)]">Save your new recovery code</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">Write this down somewhere safe. It will not be shown again, and your old recovery code no longer works.</p>
            </div>
            <div className="p-3 rounded-md border text-center font-mono text-lg tracking-wider" style={{ borderColor: "var(--border)" }}>
              {issuedCode}
            </div>
            <Button onClick={onUnlock}>I have saved this code, unlock</Button>
          </>
        )}
      </div>
    </div>
  )
}

