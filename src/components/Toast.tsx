import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: "#0f2a1e", border: "#22c55e", icon: "#22c55e" },
  error:   { bg: "#2a0f0f", border: "#ef4444", icon: "#ef4444" },
  warning: { bg: "#2a1f0f", border: "#f59e0b", icon: "#f59e0b" },
  info:    { bg: "#0f1a2a", border: "#3b82f6", icon: "#3b82f6" },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: "fixed", top: 20, right: 20, zIndex: 99999,
        display: "flex", flexDirection: "column", gap: 10, maxWidth: 340,
      }}>
        {toasts.map((toast) => {
          const c = COLORS[toast.type];
          return (
            <div key={toast.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: c.bg, border: `1px solid ${c.border}`,
              borderRadius: 12, padding: "12px 16px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              animation: "slideIn 0.25s ease",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              <span style={{
                width: 24, height: 24, borderRadius: "50%",
                background: c.border + "22", color: c.icon,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>{ICONS[toast.type]}</span>
              <span style={{ color: "#e2e8f0", fontSize: 12, flex: 1, lineHeight: 1.5 }}>
                {toast.message}
              </span>
              <button onClick={() => remove(toast.id)} style={{
                background: "none", border: "none", color: "#64748b",
                cursor: "pointer", fontSize: 16, lineHeight: 1, flexShrink: 0,
              }}>x</button>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </ToastContext.Provider>
  );
};