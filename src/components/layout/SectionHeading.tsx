import { motion } from 'motion/react'
import type { ReactNode } from 'react'

export function SectionHeading({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-10 grid gap-4 md:grid-cols-[1fr_minmax(0,28rem)] md:items-end">
      <div>
        <p className="kicker mb-3">{kicker}</p>
        {/* The heading observes the viewport; the clipped span only follows its variant. */}
        <motion.h2
          className="overflow-hidden font-display text-[clamp(3.5rem,10vw,9rem)] uppercase leading-[0.85]"
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, amount: 0.5 }}
        >
          <motion.span
            className="block"
            variants={{ hidden: { y: '100%' }, shown: { y: 0 } }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {title}
          </motion.span>
        </motion.h2>
      </div>
      {children && <p className="text-muted md:pb-3">{children}</p>}
    </div>
  )
}
