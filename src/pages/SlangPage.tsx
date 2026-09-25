import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { ArtistChip } from '../components/common/Links'
import { PageShell } from '../components/layout/PageShell'
import { useDhhData } from '../hooks/useDhhData'
import { useView } from '../hooks/useView'
import type { SlangCategory } from '../types'

const CATEGORIES: { id: SlangCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'street', label: 'Street slang' },
  { id: 'craft', label: 'Rap craft' },
  { id: 'culture', label: 'Culture' },
  { id: 'industry', label: 'Industry' },
]

export function SlangPage() {
  const data = useDhhData()
  const { id, navigate } = useView()
  const [category, setCategory] = useState<SlangCategory | 'all'>('all')
  const [query, setQuery] = useState('')

  const terms = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...data.slang]
      .filter((s) => category === 'all' || s.category === category)
      .filter((s) => !q || [s.term, ...s.aliases, s.meaning].some((x) => x.toLowerCase().includes(q)))
      .sort((a, b) => a.term.localeCompare(b.term))
  }, [data.slang, category, query])

  // Arriving from search with ?id=bantai scrolls straight to that term.
  useEffect(() => {
    if (!id) return
    const t = setTimeout(() => document.getElementById(`slang-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
    return () => clearTimeout(t)
  }, [id])

  return (
    <PageShell>
      <section className="mx-auto max-w-[1600px] px-4 pb-24 pt-28 sm:px-8">
        <p className="kicker">✦ Speak the language</p>
        <h1 className="mt-3 font-display text-[clamp(4rem,16vw,13rem)] uppercase leading-[0.82]">
          Slang <span className="text-outline">&amp; terms</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          The words you will hear in DHH verses, comment sections and cyphers, from Bambaiya street talk to the language of the craft.
        </p>

        <div className="sticky top-14 z-20 -mx-4 mt-10 flex flex-wrap items-center gap-2 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-full border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.12em] ${category === c.id ? 'border-ink bg-ink text-bg' : 'border-line text-muted hover:border-muted'}`}
            >
              {c.label}
            </button>
          ))}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter terms"
            className="ml-auto w-full rounded-full border border-line bg-bg px-4 py-2 text-sm placeholder:text-faint focus:border-ink focus:outline-none sm:w-64"
          />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {terms.map((s, i) => {
            const active = s.id === id
            return (
              <motion.article
                key={s.id}
                id={`slang-${s.id}`}
                className={`flex flex-col rounded-[var(--radius-card)] border p-5 ${active ? 'border-accent bg-surface-2' : 'border-line bg-surface'}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.05 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-4xl uppercase leading-none">{s.term}</h2>
                  <span className="kicker shrink-0">{s.category}</span>
                </div>
                {s.aliases.length > 0 && <p className="mt-1 text-xs text-faint">also: {s.aliases.join(', ')}</p>}
                <p className="mt-3 text-sm leading-relaxed text-ink/90">{s.meaning}</p>
                <p className="mt-3 border-l-2 border-accent pl-3 text-sm italic text-muted">"{s.example}"</p>
                {(s.related_artist_ids?.length || s.related_track_ids?.length) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {s.related_artist_ids?.map((a) => <ArtistChip key={a} id={a} />)}
                    {s.related_track_ids?.map((tid) => {
                      const t = data.trackById.get(tid)
                      return (
                        t && (
                          <button
                            key={tid}
                            type="button"
                            onClick={() => navigate('artist', { id: t.artist_ids[0], release: t.id })}
                            className="rounded-full border border-line px-3 py-1.5 text-sm transition-colors hover:border-ink"
                          >
                            ♪ {t.title}
                          </button>
                        )
                      )
                    })}
                  </div>
                )}
              </motion.article>
            )
          })}
        </div>
        {terms.length === 0 && <p className="mt-12 text-center text-muted">No terms match that.</p>}
      </section>
    </PageShell>
  )
}
