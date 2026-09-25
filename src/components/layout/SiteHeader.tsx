import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useEffect, useState } from 'react'
import { useSearch } from '../../hooks/useSearch'
import { useView, type View } from '../../hooks/useView'

const LINKS: { view: View; anchor?: string; label: string }[] = [
  { view: 'home', anchor: 'timeline', label: 'Timeline' },
  { view: 'home', anchor: 'scenes', label: 'Scenes' },
  { view: 'producers', label: 'Producers' },
  { view: 'genres', label: 'Genres' },
  { view: 'slang', label: 'Slang' },
]

function hrefFor(l: (typeof LINKS)[number]) {
  return l.view === 'home' ? `./#${l.anchor}` : `?view=${l.view}`
}

export function SiteHeader() {
  const { scrollY } = useScroll()
  const [solid, setSolid] = useState(false)
  const [menu, setMenu] = useState(false)
  const { view, navigate } = useView()
  const { openSearch } = useSearch()
  useMotionValueEvent(scrollY, 'change', (y) => setSolid(y > 80))
  useEffect(() => setMenu(false), [view])

  const go = (l: (typeof LINKS)[number]) => {
    setMenu(false)
    navigate(l.view, { anchor: l.anchor })
  }
  const isActive = (l: (typeof LINKS)[number]) => l.view !== 'home' && (view === l.view || (l.view === 'genres' && view === 'genre'))

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: view === 'home' ? 1.1 : 0, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        solid || menu || view !== 'home' ? 'border-b border-line/70 bg-bg/85 backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-8">
        <a
          href="./"
          onClick={(e) => {
            e.preventDefault()
            navigate('home', { anchor: 'top' })
          }}
          className="group flex shrink-0 items-baseline gap-2"
          aria-label="DHH Explorer home"
        >
          <span className="font-display text-2xl leading-none tracking-wide text-accent transition-transform group-hover:-skew-x-6">DHH</span>
          <span className="kicker hidden !text-ink sm:inline">Explorer</span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={hrefFor(l)}
              onClick={(e) => {
                e.preventDefault()
                go(l)
              }}
              aria-current={isActive(l) ? 'page' : undefined}
              className={`rounded-full px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.16em] transition-colors ${
                isActive(l) ? 'bg-ink text-bg' : 'text-muted hover:bg-surface-2 hover:text-ink'
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openSearch}
            className="flex items-center gap-3 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-sm text-muted transition-colors hover:border-ink hover:text-ink"
            aria-label="Search"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden rounded border border-line px-1.5 font-mono text-[0.6rem] md:inline">Ctrl K</kbd>
          </button>
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            aria-expanded={menu}
            aria-label="Menu"
            className="grid size-9 place-items-center rounded-full border border-line lg:hidden"
          >
            <span className="relative block h-3 w-4" aria-hidden>
              <motion.span className="absolute left-0 top-0 h-px w-4 bg-ink" animate={menu ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} />
              <motion.span className="absolute bottom-0 left-0 h-px w-4 bg-ink" animate={menu ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }} />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menu && (
          <motion.nav
            className="overflow-hidden border-t border-line lg:hidden"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col px-4 py-3">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.label}
                  href={hrefFor(l)}
                  onClick={(e) => {
                    e.preventDefault()
                    go(l)
                  }}
                  className={`py-2 font-display text-4xl uppercase leading-none ${isActive(l) ? 'text-accent' : ''}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  {l.label}
                </motion.a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
