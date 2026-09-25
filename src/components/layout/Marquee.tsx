import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

/** Seamless looping row. Content is rendered twice and slid by exactly half. */
export function Marquee({ children, reverse = false, duration = 40 }: { children: ReactNode; reverse?: boolean; duration?: number }) {
  const reduce = useReducedMotion()
  return (
    <div className="flex overflow-hidden whitespace-nowrap [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <motion.div
        className="flex shrink-0"
        animate={reduce ? undefined : { x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration, ease: 'linear', repeat: Infinity }}
      >
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden>
          {children}
        </div>
      </motion.div>
    </div>
  )
}
