import { motion, useReducedMotion } from 'motion/react'
import { hash } from '../../lib/hash'

/** Looping equaliser used as the Producers page motif, one bar per colour. */
export function BeatBars({ colors, bars = 48 }: { colors: string[]; bars?: number }) {
  const reduce = useReducedMotion()
  return (
    <div className="flex h-full items-end gap-[3px]" aria-hidden>
      {Array.from({ length: bars }, (_, i) => {
        const h = hash(`bar${i}`)
        const lo = 0.12 + (h % 20) / 100
        const hi = 0.45 + ((h >> 5) % 55) / 100
        return (
          <motion.span
            key={i}
            className="flex-1 origin-bottom rounded-t-[2px]"
            style={{ background: colors[i % colors.length], height: '100%' }}
            initial={{ scaleY: 0 }}
            animate={reduce ? { scaleY: hi } : { scaleY: [lo, hi, lo * 1.4, hi * 0.8, lo] }}
            transition={
              reduce
                ? { duration: 0.6 }
                : { duration: 1.6 + (h % 9) / 10, repeat: Infinity, ease: 'easeInOut', delay: (i % 12) * 0.05 }
            }
          />
        )
      })}
    </div>
  )
}
