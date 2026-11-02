export type ProcessingFeeType = "None" | "Percentage" | "Fixed"
export type RepaymentFrequencyDefault = "Daily" | "Weekly" | "Bi-weekly" | "Monthly" | "Other"

export type NotificationRingtone = "Default" | "Chime" | "Bell" | "None"

export interface CyberlendSettings {
  defaultInterestRate: number
  defaultProcessingFeeType: ProcessingFeeType
  defaultProcessingFeeValue: number
  defaultRepaymentFrequency: RepaymentFrequencyDefault
  targetReturnRate: number
  notificationsEnabled: boolean
  notificationRingtone: NotificationRingtone
}

const SETTINGS_KEY = "cyberlend_settings"

export const DEFAULT_SETTINGS: CyberlendSettings = {
  defaultInterestRate: 20,
  defaultProcessingFeeType: "None",
  defaultProcessingFeeValue: 0,
  defaultRepaymentFrequency: "Monthly",
  targetReturnRate: 20,
  notificationsEnabled: true,
  notificationRingtone: "Default",
}

export function loadSettings(): CyberlendSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: CyberlendSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

