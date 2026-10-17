import * as React from "react"
import { cn } from "@/lib/utils"

const base = "w-full min-w-0 rounded-[8px] text-sm text-foreground outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-fg"

export const fieldClassName = base + " border border-foreground/15 bg-foreground/[0.04] px-3 py-1 shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50"

export const fieldViewClassName = base + " border border-transparent bg-transparent px-0 py-1 cursor-default"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn("h-9", className ?? fieldClassName)} {...props} />
}

export { Input }