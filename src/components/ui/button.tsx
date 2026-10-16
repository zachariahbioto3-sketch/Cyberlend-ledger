import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-sm font-medium font-body transition-all duration-150 ease-out btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:pointer-events-none disabled:opacity-40 min-h-[44px] px-4",
  {
    variants: {
      variant: {
        default:     "bg-[var(--gold-500)] text-[var(--bg-base)] hover:bg-[var(--gold-400)] active:bg-[var(--gold-600)]",
        outline:     "border border-[var(--gold-500)] text-[var(--gold-500)] bg-transparent hover:bg-[var(--gold-500)] hover:text-[var(--bg-base)]",
        ghost:       "text-[var(--text-muted)] bg-transparent hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]",
        destructive: "bg-[var(--danger)] text-[var(--danger-fg)] hover:opacity-90",
      },
      size: {
        default: "h-11 px-4",
        sm:      "h-9 px-3 text-xs",
        lg:      "h-12 px-6 text-base",
        icon:    "h-11 w-11 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = "Button"

export { Button, buttonVariants }
