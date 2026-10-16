import { useEffect, useRef, useState } from "react"

export function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(target)
  const prev = useRef(target)
  const frame = useRef<number>(0)

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced || prev.current === target) {
      setValue(target)
      prev.current = target
      return
    }

    const start     = prev.current
    const diff      = target - start
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(Math.round(start + diff * eased))
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick)
      } else {
        prev.current = target
      }
    }

    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration])

  return value
}
