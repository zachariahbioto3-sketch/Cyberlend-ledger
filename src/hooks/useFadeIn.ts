import { useEffect, useRef } from "react"

export function useFadeIn(trigger: unknown) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) return
    el.style.opacity = "0"
    el.style.transform = "translateY(6px)"
    const id = requestAnimationFrame(() => {
      el.style.transition = "opacity 0.15s ease-out, transform 0.15s ease-out"
      el.style.opacity = "1"
      el.style.transform = "translateY(0)"
    })
    return () => cancelAnimationFrame(id)
  }, [trigger])

  return ref
}
