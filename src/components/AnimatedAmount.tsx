import { useCountUp } from "@/hooks/useCountUp"

interface AnimatedAmountProps {
  value: number
  prefix?: string
  decimals?: number
  className?: string
  duration?: number
}

export function AnimatedAmount({
  value,
  prefix = "KES ",
  decimals = 0,
  className,
  duration = 600,
}: AnimatedAmountProps) {
  const animated = useCountUp(value, duration)

  const formatted = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(animated)

  return (
    <span
      className={className}
      style={{ fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-mono)" }}
    >
      {prefix}{formatted}
    </span>
  )
}
