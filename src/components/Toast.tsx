import React, { createContext, useContext, useState, useCallback } from "react"

export type ToastType = "success" | "error" | "warning" | "info"

interface Toast { id: string; message: string; type: ToastType }
interface ToastContextValue { showToast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })
export const useToast = () => useContext(ToastContext)

const CONFIG: Record<ToastType, { border: string; icon: string; label: string }> = {
  success: { border: "#7fc98f", icon: "#7fc98f", label: "?" },
  error:   { border: "#e07070", icon: "#e07070", label: "?" },
  warning: { border: "#d4a843", icon: "#d4a843", label: "?" },
  info:    { border: "#70a8e0", icon: "#70a8e0", label: "?" },
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: "fixed", bottom: 80, right: 16, zIndex: 99999,
        display: "flex", flexDirection: "column", gap: 8, maxWidth: 340,
      }}>
        {toasts.map((toast) => {
          const c = CONFIG[toast.type]
          return (
            <div key={toast.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "#141414",
              border: `1px solid ${c.border}`,
              borderLeft: `3px solid ${c.border}`,
              borderRadius: 8,
              padding: "12px 14px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              animation: "toastIn 0.15s ease-out",
              fontFamily: "'JetBrains Mono', monospace",
              minWidth: 260,
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%",
                background: c.border + "22", color: c.icon,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>{c.label}</span>
              <span style={{ color: "#f3ead8", fontSize: 12, flex: 1, lineHeight: 1.5, fontFamily: "'Manrope', sans-serif" }}>
                {message}
              </span>
              <button onClick={() => remove(toast.id)} style={{
                background: "none", border: "none",
                color: "rgba(243,234,216,0.4)",
                cursor: "pointer", fontSize: 14, lineHeight: 1, flexShrink: 0,
                padding: "0 2px",
              }}>?</button>
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes toastIn { from { opacity: 0; } to { opacity: 1; } }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
