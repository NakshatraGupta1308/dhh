import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDhhData } from '../../hooks/useDhhData'
import { useFilters } from '../../hooks/useFilters'
import { activeFilterCount, type FilterKey } from '../../lib/filters'
import { FilterPanel } from './FilterPanel'

/** Desktop filter bar: scene quick-picks inline, full panel drops down. */
export function FilterBar() {
  const data = useDhhData()
  const { filters, toggle, clear, results } = useFilters()
  const [open, setOpen] = useState(false)
  const count = activeFilterCount(filters)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  const chips = useMemo(() => {
    const out: { key: FilterKey; id: string; label: string; color?: string }[] = []
    for (const id of filters.artists) out.push({ key: 'artists', id, label: data.artistById.get(id)?.name ?? id })
    for (const id of filters.labels) out.push({ key: 'labels', id, label: data.labelById.get(id)?.name ?? id })
    for (const id of filters.languages) out.push({ key: 'languages', id, label: data.languageById.get(id)?.name ?? id })
    return out
  }, [filters, data])

  return (
    <div ref={ref} className="relative z-30 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="flex items-center gap-4 px-4 py-2.5 sm:px-8">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-2xl uppercase leading-none">Timeline</h2>
          <motion.span key={results.length} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="kicker">
            {results.length} / {data.tracks.length}
          </motion.span>
        </div>

        <div className="no-scrollbar flex flex-1 items-center gap-1.5 overflow-x-auto">
          {data.regions.map((r) => {
            const on = filters.regions.includes(r.id)
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggle('regions', r.id)}
                aria-pressed={on}
                className="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] transition-colors"
                style={{
                  borderColor: on ? r.color : 'var(--color-line)',
                  background: on ? r.color : 'transparent',
                  color: on ? '#0a0a0b' : 'var(--color-muted)',
                }}
              >
                <span className="size-1.5 rounded-full" style={{ background: on ? '#0a0a0b' : r.color }} />
                {r.name}
              </button>
            )
          })}
          {chips.map((c) => (
            <button
              key={c.key + c.id}
              type="button"
              onClick={() => toggle(c.key, c.id)}
              className="flex shrink-0 items-center gap-1 rounded-full bg-ink px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-bg"
            >
              {c.label} <span aria-hidden>×</span>
              <span className="sr-only">remove filter</span>
            </button>
          ))}
        </div>

        {count > 0 && (
          <button type="button" onClick={clear} className="kicker shrink-0 hover:text-ink">
            Reset
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex shrink-0 items-center gap-2 rounded-full border border-line px-3.5 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.14em] transition-colors hover:border-ink"
        >
          Filters
          {count > 0 && <span className="grid size-5 place-items-center rounded-full bg-accent text-[0.6rem] text-bg">{count}</span>}
          <motion.span animate={{ rotate: open ? 180 : 0 }} aria-hidden>
            ↓
          </motion.span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-full overflow-hidden border-b border-line bg-surface shadow-2xl shadow-black/60"
          >
            <div className="px-4 py-6 sm:px-8">
              <FilterPanel columns />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
