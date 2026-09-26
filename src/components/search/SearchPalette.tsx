import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDhhData } from '../../hooks/useDhhData'
import { useSearch } from '../../hooks/useSearch'
import { useView } from '../../hooks/useView'
import { buildSearchIndex, KIND_LABEL, search, type ResultKind, type SearchResult } from '../../lib/search'

const ORDER: ResultKind[] = ['artist', 'producer', 'scene', 'genre', 'beef', 'hustle', 'page', 'slang', 'release']
const SUGGESTIONS = ['Seedhe Maut', 'Boom Bap', 'Gujarat', 'Sez on the Beat', 'Bantai', 'Trap']

export function SearchPalette() {
  const data = useDhhData()
  const { isOpen, closeSearch } = useSearch()
  const { navigate } = useView()
  const index = useMemo(() => buildSearchIndex(data), [data])
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => search(index, query), [index, query])
  // Group by kind for display, keeping the best match's group first.
  const groups = useMemo(() => {
    const kinds = [...new Set(results.map((r) => r.kind))].sort((a, b) =>
      results.findIndex((r) => r.kind === a) - results.findIndex((r) => r.kind === b) || ORDER.indexOf(a) - ORDER.indexOf(b),
    )
    return kinds.map((k) => ({ kind: k, items: results.filter((r) => r.kind === k) }))
  }, [results])
  const flat = groups.flatMap((g) => g.items)

  useEffect(() => {
    if (!isOpen) return
    setQuery('')
    setActive(0)
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    requestAnimationFrame(() => inputRef.current?.focus())
    return () => {
      document.documentElement.style.overflow = prev
    }
  }, [isOpen])

  useEffect(() => setActive(0), [query])
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const go = (r: SearchResult) => {
    closeSearch()
    navigate(r.view, { id: r.id ?? null, release: r.release ?? null })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeSearch()
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(flat.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter' && flat[active]) {
      e.preventDefault()
      go(flat[active])
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center px-3 pt-[8vh] sm:pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search">
          <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeSearch} />
          <motion.div
            className="relative flex max-h-[80dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/60"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-line px-5">
              <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search artists, producers, scenes, genres, slang, songs"
                className="h-14 w-full bg-transparent text-base placeholder:text-faint focus:outline-none"
                role="combobox"
                aria-expanded={flat.length > 0}
                aria-controls="search-results"
                aria-activedescendant={flat[active] ? `sr-${flat[active].key}` : undefined}
              />
              <button type="button" onClick={closeSearch} className="kicker shrink-0 rounded border border-line px-2 py-1 hover:text-ink">
                Esc
              </button>
            </div>

            <div ref={listRef} id="search-results" role="listbox" className="overflow-y-auto overscroll-contain p-2">
              {!query.trim() && (
                <div className="p-3">
                  <p className="kicker mb-3">Try</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} type="button" onClick={() => setQuery(s)} className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-ink">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {query.trim() && flat.length === 0 && <p className="p-6 text-center text-sm text-muted">Nothing in the archive matches "{query}".</p>}
              {groups.map((g) => (
                <div key={g.kind} className="mb-2">
                  <p className="kicker px-3 pb-1 pt-2">{KIND_LABEL[g.kind]}</p>
                  {g.items.map((r) => {
                    const i = flat.indexOf(r)
                    return (
                      <button
                        key={r.key}
                        id={`sr-${r.key}`}
                        type="button"
                        role="option"
                        aria-selected={i === active}
                        data-index={i}
                        onMouseMove={() => setActive(i)}
                        onClick={() => go(r)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${i === active ? 'bg-surface-2' : ''}`}
                      >
                        <span
                          className={`size-2.5 shrink-0 ${r.kind === 'genre' ? 'rotate-45' : r.kind === 'slang' || r.kind === 'page' ? 'rounded-sm' : 'rounded-full'}`}
                          style={{ background: r.color }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-lg uppercase leading-tight">{r.title}</span>
                          <span className="block truncate text-xs text-muted">{r.subtitle}</span>
                        </span>
                        {i === active && <span className="kicker shrink-0">Enter ↵</span>}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
