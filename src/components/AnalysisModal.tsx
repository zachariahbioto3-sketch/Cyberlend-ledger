import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  summary: string;
  body: string;
  chart?: React.ReactNode;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ open, onClose, title, summary, body, chart }) => {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(17,18,20,0.45)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-[var(--radius-lg)] border overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: "var(--background)",
          borderColor: "var(--border)",
          width: "92vw",
          maxWidth: "640px",
          maxHeight: "88vh",
        }}
      >
        <div className="p-5 border-b flex items-start justify-between gap-4" style={{ borderColor: "var(--border)" }}>
          <div>
            <h3 className="cl-mono text-sm font-bold tracking-widest" style={{ color: "var(--foreground)" }}>
              {title.toUpperCase()}
            </h3>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{summary}</p>
          </div>
          <button
            onClick={onClose}
            className={cn("p-1.5 rounded-lg shrink-0")}
            style={{ color: "var(--muted-foreground)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {chart && (
            <div className="rounded-[var(--radius-md)] border p-3" style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}>
              {chart}
            </div>
          )}
          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{body}</p>
        </div>
      </div>
    </div>
  );
};
