import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDhhData } from '../../hooks/useDhhData'
import { useFilters } from '../../hooks/useFilters'
import { activeFilterCount } from '../../lib/filters'
import { trackYear } from '../../lib/indexDataset'
import type { Track } from '../../types'
import { MobileFilterSheet } from '../filters/MobileFilterSheet'
import { ReleaseCard, useTrackScene } from './ReleaseCard'

function Row({ track, index }: { track: Track; index: number }) {
  const { color } = useTrackScene(track)
  return (
    <motion.li
      layout
      className="relative pl-8"
      initial={{ opacity: 0, x: 28 }}
      whileInView={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay: (index % 3) * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <span aria-hidden className="absolute left-[7px] top-8 size-2.5 -translate-x-1/2 rounded-full ring-4 ring-bg" style={{ background: color }} />
      <ReleaseCard track={track} variant="wide" />
    </motion.li>
  )
}

/**
 * Touch-first timeline: a vertical spine read with the thumb, sticky year
 * chips for jumping around, and a bottom sheet for filters.
 */
export function VerticalTimeline() {
  const data = useDhhData()
  const { results, filters } = useFilters()
  const [sheet, setSheet] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const chipsRef = useRef<HTMLDivElement>(null)
  const [activeYear, setActiveYear] = useState<number | null>(null)
  const count = activeFilterCount(filters)

  const byYear = useMemo(() => {
    const groups: { year: number; tracks: Track[] }[] = []
    for (const t of results) {
      const y = trackYear(t)
      const last = groups.at(-1)
      if (last?.year === y) last.tracks.push(t)
      else groups.push({ year: y, tracks: [t] })
    }
    return groups
  }, [results])

  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 60%', 'end 60%'] })
  const spine = useSpring(scrollYProgress, { stiffness: 200, damping: 40 })

  // Track which year header is currently under the chip bar.
  useEffect(() => {
    const headers = listRef.current?.querySelectorAll<HTMLElement>('[data-year]')
    if (!headers?.length) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActiveYear(Number(e.target.getAttribute('data-year')))
      },
      { rootMargin: '-140px 0px -70% 0px' },
    )
    headers.forEach((h) => io.observe(h))
    return () => io.disconnect()
  }, [byYear])

  // Keep the active chip visible inside the horizontal chip row.
  useEffect(() => {
    const chip = chipsRef.current?.querySelector<HTMLElement>(`[data-chip="${activeYear}"]`)
    chip?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [activeYear])

  const jump = (year: number) => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-year="${year}"]`)
    if (!el) return
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 124, behavior: 'smooth' })
  }

  return (
    <section id="timeline" aria-label="Release timeline" className="relative pb-24">
      <div className="sticky top-14 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-3xl uppercase leading-none">Timeline</h2>
            <span className="kicker">{results.length} releases</span>
          </div>
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="flex items-center gap-2 rounded-full border border-line px-3.5 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em]"
          >
            Filters
            {count > 0 && <span className="grid size-5 place-items-center rounded-full bg-accent text-[0.6rem] text-bg">{count}</span>}
          </button>
        </div>
        <div ref={chipsRef} className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-3">
          {byYear.map(({ year, tracks }) => (
            <button
              key={year}
              type="button"
              data-chip={year}
              onClick={() => jump(year)}
              className={`shrink-0 rounded-full px-3 py-1 font-display text-base transition-colors ${
                activeYear === year ? 'bg-ink text-bg' : 'bg-surface-2 text-muted'
              }`}
            >
              {year}
              <sup className="ml-0.5 font-mono text-[0.55rem] opacity-60">{tracks.length}</sup>
            </button>
          ))}
        </div>
      </div>

      <div ref={listRef} className="relative mx-auto max-w-2xl px-4 pt-8">
        <div aria-hidden className="absolute bottom-0 left-[23px] top-8 w-px bg-line" />
        <motion.div aria-hidden className="absolute left-[23px] top-8 w-px origin-top bg-accent" style={{ scaleY: spine, bottom: 0 }} />

        {byYear.length === 0 && <p className="py-20 text-center font-mono text-xs uppercase tracking-[0.16em] text-muted">No releases match these filters</p>}

        <AnimatePresence initial={false}>
          {byYear.map(({ year, tracks }) => (
            <motion.div key={year} layout className="mb-10" exit={{ opacity: 0 }}>
              <h3 data-year={year} className="relative mb-4 flex items-end gap-3 pl-8">
                <span className="absolute left-[7px] top-1/2 h-px w-4 bg-faint" aria-hidden />
                <motion.span
                  className="font-display text-6xl leading-none"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  {year}
                </motion.span>
                <span className="kicker mb-1.5">
                  {tracks.length} release{tracks.length > 1 ? 's' : ''}
                </span>
              </h3>
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {tracks.map((t, i) => (
                    <Row key={t.id} track={t} index={i} />
                  ))}
                </AnimatePresence>
              </ul>
            </motion.div>
          ))}
        </AnimatePresence>
        <p className="pl-8 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-faint">
          {data.yearRange[1]} and counting
        </p>
      </div>

      <MobileFilterSheet open={sheet} onClose={() => setSheet(false)} />
    </section>
  )
}
