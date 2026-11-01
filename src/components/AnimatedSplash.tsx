import React from "react"
import { motion } from "framer-motion"

interface Props { onDone: () => void }

const EASE = [0.76, 0, 0.24, 1] as const

export const AnimatedSplash: React.FC<Props> = ({ onDone }) => (
  <motion.div
    className="fixed inset-0 z-[999] flex items-center justify-center"
    style={{ background: "#CDF27E", willChange: "transform" }}
    initial={{ y: 0 }}
    animate={{ y: "-100%" }}
    transition={{ delay: 1.15, duration: 0.7, ease: EASE }}
    onAnimationComplete={onDone}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center gap-3"
    >
      <span className="font-brand text-6xl" style={{ color: "#111214" }}>CC</span>
      <span
        className="text-xs font-bold uppercase"
        style={{ color: "#111214", letterSpacing: "0.3em", fontFamily: "var(--font-sans)" }}
      >
        Cyberlend
      </span>
    </motion.div>
  </motion.div>
)
