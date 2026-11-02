import { Capacitor } from "@capacitor/core"
import { NativeBiometric } from "@capgo/capacitor-native-biometric"

const SECURITY_KEY = "cyberlend_security"
const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

interface SecurityRecord {
  enabled: boolean
  pinHash: string
  pinSalt: string
  recoveryHash: string
  recoverySalt: string
  autoLockMinutes: number
  biometricEnabled: boolean
}

function loadRecord(): SecurityRecord | null {
  try {
    const raw = localStorage.getItem(SECURITY_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveRecord(record: SecurityRecord) {
  localStorage.setItem(SECURITY_KEY, JSON.stringify(record))
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function hashValue(value: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(salt + ":" + value)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return bytesToHex(digest)
}

function randomSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return bytesToHex(bytes.buffer)
}

function generateRecoveryCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  let code = ""
  bytes.forEach((b, i) => {
    code += RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length]
    if ((i + 1) % 4 === 0 && i !== bytes.length - 1) code += "-"
  })
  return code
}

export function isSecurityConfigured(): boolean {
  return loadRecord() !== null
}

export function isSecurityEnabled(): boolean {
  const record = loadRecord()
  return !!record?.enabled
}

export function getAutoLockMinutes(): number {
  return loadRecord()?.autoLockMinutes ?? 5
}

export function setAutoLockMinutes(minutes: number) {
  const record = loadRecord()
  if (!record) return
  record.autoLockMinutes = minutes
  saveRecord(record)
}

export function setSecurityEnabled(enabled: boolean) {
  const record = loadRecord()
  if (!record) return
  record.enabled = enabled
  saveRecord(record)
}

export function clearSecurity() {
  localStorage.removeItem(SECURITY_KEY)
}

export async function setupPin(pin: string): Promise<string> {
  const pinSalt = randomSalt()
  const pinHash = await hashValue(pin, pinSalt)
  const recoverySalt = randomSalt()
  const recoveryCode = generateRecoveryCode()
  const recoveryHash = await hashValue(recoveryCode, recoverySalt)
  saveRecord({
    enabled: true,
    pinHash,
    pinSalt,
    recoveryHash,
    recoverySalt,
    autoLockMinutes: 5,
    biometricEnabled: false,
  })
  return recoveryCode
}

export async function verifyPin(pin: string): Promise<boolean> {
  const record = loadRecord()
  if (!record) return false
  const candidate = await hashValue(pin, record.pinSalt)
  return candidate === record.pinHash
}

export async function verifyRecoveryCode(code: string): Promise<boolean> {
  const record = loadRecord()
  if (!record) return false
  const candidate = await hashValue(code.trim().toUpperCase(), record.recoverySalt)
  return candidate === record.recoveryHash
}

export async function resetPinWithRecovery(newPin: string): Promise<string> {
  const previous = loadRecord()
  const pinSalt = randomSalt()
  const pinHash = await hashValue(newPin, pinSalt)
  const recoverySalt = randomSalt()
  const recoveryCode = generateRecoveryCode()
  const recoveryHash = await hashValue(recoveryCode, recoverySalt)
  saveRecord({
    enabled: true,
    pinHash,
    pinSalt,
    recoveryHash,
    recoverySalt,
    autoLockMinutes: previous?.autoLockMinutes ?? 5,
    biometricEnabled: previous?.biometricEnabled ?? false,
  })
  return recoveryCode
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const result = await NativeBiometric.isAvailable()
    return result.isAvailable
  } catch {
    return false
  }
}

export async function verifyBiometric(): Promise<boolean> {
  try {
    await NativeBiometric.verifyIdentity({
      reason: "Unlock Cyberlend Ledger",
      title: "Unlock",
    })
    return true
  } catch {
    return false
  }
}

export function isBiometricEnabled(): boolean {
  return !!loadRecord()?.biometricEnabled
}

export function setBiometricEnabled(enabled: boolean) {
  const record = loadRecord()
  if (!record) return
  record.biometricEnabled = enabled
  saveRecord(record)
}

