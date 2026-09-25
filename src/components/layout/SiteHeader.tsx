import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'
import { useView, type View } from '../../hooks/useView'

const LINKS: { view: View; anchor?: string; label: string }[] = [
  { view: 'home', anchor: 'timeline', label: 'Timeline' },
  { view: 'home', anchor: 'scenes', label: 'Scenes' },
  { view: 'home', anchor: 'roster', label: 'Roster' },
  { view: 'producers', label: 'Producers' },
]

export function SiteHeader() {
  const { scrollY } = useScroll()
  const [solid, setSolid] = useState(false)
  const { view, navigate } = useView()
  useMotionValueEvent(scrollY, 'change', (y) => setSolid(y > 80))

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        solid ? 'border-b border-line/70 bg-bg/80 backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 sm:px-8">
        <a
          href="./"
          onClick={(e) => {
            e.preventDefault()
            navigate('home', 'top')
          }}
          className="group flex items-baseline gap-2"
          aria-label="DHH Explorer home"
        >
          <span className="font-display text-2xl leading-none tracking-wide text-accent transition-transform group-hover:-skew-x-6">DHH</span>
          <span className="kicker hidden !text-ink sm:inline">Explorer</span>
        </a>
        <nav className="flex items-center gap-0.5 sm:gap-2">
          {LINKS.map((l) => {
            const active = l.view === 'producers' && view === 'producers'
            return (
              <a
                key={l.label}
                href={l.view === 'producers' ? '?view=producers' : `./#${l.anchor}`}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(l.view, l.anchor)
                }}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-2 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.08em] transition-colors sm:px-3 sm:text-[0.7rem] sm:tracking-[0.16em] ${
                  active ? 'bg-ink text-bg' : 'text-muted hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {l.label}
              </a>
            )
          })}
        </nav>
      </div>
    </motion.header>
  )
}
