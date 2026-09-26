import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { ArtistChip, SectionLabel } from '../components/common/Links'
import { NotFound, PageShell } from '../components/layout/PageShell'
import { useDhhData } from '../hooks/useDhhData'
import { useView } from '../hooks/useView'
import type { Beef, BeefRound, BeefStatus } from '../types'

/** One colour per side, fixed by position so rivals never share a colour. */
export const SIDE_COLORS = ['#FF3B30', '#4CC9F0', '#FFB703', '#C77DFF']
const EASE = [0.22, 1, 0.36, 1] as const
const STATUS_LABEL: Record<BeefStatus, string> = { ongoing: 'Ongoing', simmering: 'Simmering', cold: 'Gone cold' }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function roundDate(r: BeefRound): string {
  if (!r.date) return 'Date unknown'
  const [y, m, d] = r.date.split('-').map(Number)
  if (r.precision === 'day') return `${d} ${MONTHS[m - 1]} ${y}`
  if (r.precision === 'month') return `${MONTHS[m - 1]} ${y}`
  return String(y)
}

function Heat({ level, className = '' }: { level: number; className?: string }) {
  return (
    <span className={`inline-flex items-end gap-[3px] ${className}`} aria-label={`Heat ${level} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="w-1.5 rounded-sm" style={{ height: 6 + i * 3, background: i <= level ? '#FF3B30' : 'var(--color-line)' }} />
      ))}
    </span>
  )
}

function StatusPill({ status }: { status: BeefStatus }) {
  const color = status === 'ongoing' ? '#FF3B30' : status === 'simmering' ? '#FFB703' : 'var(--color-muted)'
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.14em]" style={{ borderColor: color, color }}>
      {status === 'ongoing' && <motion.span className="size-1.5 rounded-full" style={{ background: color }} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />}
      {STATUS_LABEL[status]}
    </span>
  )
}

function youtubeSearch(title: string, who: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${who}`)}`
}

function BeefCard({ beef, index }: { beef: Beef; index: number }) {
  const { navigate } = useView()
  const tracks = beef.rounds.filter((r) => r.by !== null).length
  return (
    <motion.button
      type="button"
      onClick={() => navigate('beef', { id: beef.id })}
      className="group relative flex min-h-72 flex-col justify-between overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface p-6 text-left transition-colors hover:border-accent"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.07, ease: EASE }}
      whileHover={{ y: -4 }}
    >
      <span aria-hidden className="pointer-events-none absolute -right-6 -top-10 font-display text-[10rem] leading-none text-outline opacity-10 transition-opacity [--outline:var(--color-accent)] group-hover:opacity-30">
        VS
      </span>
      <div className="relative flex items-center justify-between gap-3">
        <StatusPill status={beef.status} />
        <Heat level={beef.heat} />
      </div>
      <div className="relative mt-6">
        {beef.sides.map((s, i) => (
          <div key={s.name}>
            {i > 0 && <div className="my-1 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-faint">vs</div>}
            <div className="font-display text-3xl uppercase leading-[0.9] sm:text-4xl" style={{ color: SIDE_COLORS[i] }}>
              {s.name}
            </div>
          </div>
        ))}
      </div>
      <div className="relative mt-6 flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
        <span>{beef.years}</span>
        <span>
          {tracks} round{tracks === 1 ? '' : 's'} →
        </span>
      </div>
    </motion.button>
  )
}

function BeefIndex() {
  const data = useDhhData()
  const [filter, setFilter] = useState<BeefStatus | 'all'>('all')
  const shown = filter === 'all' ? data.beefs : data.beefs.filter((b) => b.status === filter)
  const disses = data.beefs.reduce((n, b) => n + b.rounds.filter((r) => r.by !== null).length, 0)
  const people = new Set(data.beefs.flatMap((b) => b.sides.map((s) => s.name))).size

  return (
    <PageShell>
      <section className="relative overflow-hidden pt-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent_0,transparent_22px,rgba(255,59,48,0.06)_22px,rgba(255,59,48,0.06)_24px)]" />
        <div className="relative mx-auto max-w-[1600px] px-4 pb-12 sm:px-8">
          <motion.p className="kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="text-accent">●</span> Every diss, every round
          </motion.p>
          <h1 className="relative mt-3 font-display text-[clamp(5rem,24vw,19rem)] uppercase leading-[0.8] text-accent" aria-label="Beef">
            <span className="flex overflow-hidden" aria-hidden>
              {'BEEF'.split('').map((ch, i) => (
                <motion.span key={i} initial={{ y: '105%', rotate: -8 }} animate={{ y: 0, rotate: 0 }} transition={{ delay: 0.1 + i * 0.06, duration: 0.8, ease: EASE }}>
                  {ch}
                </motion.span>
              ))}
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            The feuds that shaped desi hip hop, told round by round: who fired first, who answered, and where it stands now.{' '}
            <span className="text-ink">We report what was said on record, not who won.</span>
          </p>
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-5">
            {[
              [data.beefs.length, 'Beefs'],
              [disses, 'Diss tracks and shots'],
              [people, 'Artists involved'],
            ].map(([n, label]) => (
              <div key={label}>
                <div className="font-display text-4xl leading-none sm:text-5xl">{n}</div>
                <div className="kicker mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1600px] px-4 pb-24 sm:px-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {(['all', 'ongoing', 'simmering', 'cold'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.12em] ${filter === f ? 'border-ink bg-ink text-bg' : 'border-line text-muted hover:border-muted'}`}
            >
              {f === 'all' ? 'All beefs' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((b, i) => (
            <BeefCard key={b.id} beef={b} index={i} />
          ))}
        </div>
      </section>
    </PageShell>
  )
}

function Round({ beef, round, number }: { beef: Beef; round: BeefRound; number: number }) {
  const data = useDhhData()
  const { navigate } = useView()
  const byName = round.by !== null ? beef.sides[round.by].name : null
  const color = round.by !== null ? SIDE_COLORS[round.by] : 'var(--color-muted)'
  const right = round.by !== null && round.by % 2 === 1
  const release = round.track_id ? data.trackById.get(round.track_id) : undefined
  const targets = round.at.map((i) => beef.sides[i].name)

  return (
    <motion.li
      className="relative grid gap-3 md:grid-cols-2 md:gap-12"
      initial={{ opacity: 0, x: right ? 40 : -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <span aria-hidden className="absolute left-3 top-6 z-10 size-3 -translate-x-1/2 rounded-full ring-4 ring-bg md:left-1/2" style={{ background: color }} />
      <div className={`pl-9 md:pl-0 ${right ? 'md:col-start-2' : 'md:text-right'}`}>
        <article className="rounded-[var(--radius-card)] border bg-surface p-5" style={{ borderColor: `${color}66` }}>
          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted ${right ? '' : 'md:justify-end'}`}>
            <span className="text-faint">Round {String(number).padStart(2, '0')}</span>
            <span>{roundDate(round)}</span>
          </div>
          <h3 className="mt-2 font-display text-3xl uppercase leading-tight">{round.title}</h3>
          <p className="mt-1 text-sm">
            {byName ? (
              <>
                <span style={{ color }}>{byName}</span>
                {targets.length > 0 && (
                  <span className="text-muted">
                    {' '}
                    → {targets.join(' & ')}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted">Off record</span>
            )}
          </p>
          {round.note && <p className="mt-3 text-sm leading-relaxed text-ink/85">{round.note}</p>}
          {byName && (
            <div className={`mt-4 flex flex-wrap gap-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] ${right ? '' : 'md:justify-end'}`}>
              {release && (
                <button type="button" onClick={() => navigate('artist', { id: release.artist_ids[0], release: release.id })} className="text-ink hover:text-accent">
                  In the archive →
                </button>
              )}
              <a href={youtubeSearch(round.title, byName)} target="_blank" rel="noreferrer" className="text-ink hover:text-accent">
                Find on YouTube ↗
              </a>
            </div>
          )}
        </article>
      </div>
    </motion.li>
  )
}

function BeefDetail({ beef }: { beef: Beef }) {
  const data = useDhhData()
  const { navigate } = useView()
  const tally = beef.sides.map((_, i) => beef.rounds.filter((r) => r.by === i).length)
  const max = Math.max(1, ...tally)
  const others = data.beefs.filter((b) => b.id !== beef.id)
  const many = beef.sides.length > 2

  return (
    <PageShell>
      <header className="relative overflow-hidden pt-14">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent_0,transparent_22px,rgba(255,59,48,0.05)_22px,rgba(255,59,48,0.05)_24px)]" />
        <div className="relative mx-auto max-w-[1600px] px-4 pb-10 pt-10 sm:px-8">
          <div className="kicker relative z-10 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => navigate('beef')} className="text-accent hover:text-ink">
              ● Beef
            </button>
            <span>{beef.years}</span>
            <StatusPill status={beef.status} />
            <Heat level={beef.heat} />
          </div>
          <div className={`mt-6 grid items-center gap-4 ${many ? 'sm:grid-cols-2' : 'md:grid-cols-[1fr_auto_1fr]'}`}>
            {beef.sides.map((s, i) => (
              <motion.div
                key={s.name}
                className={many ? '' : i === 0 ? 'order-1' : 'order-3 md:col-start-3 md:text-right'}
                initial={{ opacity: 0, x: i % 2 ? 60 : -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.1 + i * 0.08 }}
              >
                <div
                  className={`break-words font-display uppercase leading-[0.85] ${many ? 'text-[clamp(2.4rem,6vw,5.5rem)]' : 'text-[clamp(2.8rem,9vw,7.5rem)]'}`}
                  style={{ color: SIDE_COLORS[i] }}
                >
                  {s.name}
                </div>
                {s.artist_id && (
                  <button type="button" onClick={() => navigate('artist', { id: s.artist_id! })} className="kicker mt-2 hover:text-ink">
                    Artist page →
                  </button>
                )}
              </motion.div>
            ))}
            {!many && (
              <motion.div
                className="order-2 font-display text-7xl leading-none text-outline [--outline:var(--color-ink)] md:col-start-2 md:row-start-1 md:text-9xl"
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 14 }}
              >
                VS
              </motion.div>
            )}
          </div>
          <p className="mt-8 max-w-2xl font-display text-2xl uppercase leading-tight text-accent sm:text-3xl">{beef.tagline}</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-12 px-4 pb-24 pt-8 sm:px-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-12">
          <section>
            <SectionLabel>The story</SectionLabel>
            <p className="max-w-2xl text-lg leading-relaxed text-ink/90">{beef.summary}</p>
          </section>
          <section>
            <SectionLabel>How it started</SectionLabel>
            <p className="max-w-2xl leading-relaxed text-muted">{beef.origin}</p>
          </section>
          <section className="overflow-x-clip">
            <SectionLabel>Round by round</SectionLabel>
            <ol className="relative space-y-6">
              <span aria-hidden className="absolute bottom-0 left-3 top-0 w-px bg-line md:left-1/2" />
              {beef.rounds.map((r, i) => (
                <Round key={`${r.title}-${i}`} beef={beef} round={r} number={i + 1} />
              ))}
            </ol>
          </section>
        </div>

        <aside className="min-w-0 space-y-10 lg:sticky lg:top-20 lg:self-start">
          <section>
            <SectionLabel>Shots fired</SectionLabel>
            <ul className="space-y-3">
              {beef.sides.map((s, i) => (
                <li key={s.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span style={{ color: SIDE_COLORS[i] }}>{s.name}</span>
                    <span className="font-mono text-xs text-muted">{tally[i]}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-line">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: SIDE_COLORS[i] }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(tally[i] / max) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: EASE }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-faint">Counts releases and on-record shots in this timeline, not a verdict.</p>
          </section>
          {beef.sides.some((s) => s.artist_id) && (
            <section>
              <SectionLabel>In the archive</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {beef.sides.filter((s) => s.artist_id).map((s) => <ArtistChip key={s.artist_id} id={s.artist_id!} />)}
              </div>
            </section>
          )}
          <section>
            <SectionLabel>More beef</SectionLabel>
            <ul className="space-y-1">
              {others.map((b) => (
                <li key={b.id}>
                  <button type="button" onClick={() => navigate('beef', { id: b.id })} className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-2">
                    <span className="truncate font-display text-lg uppercase leading-tight">{b.title}</span>
                    <Heat level={b.heat} className="shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <p className="border-l-2 border-faint pl-3 text-sm text-muted">
            Diss tracks are one side's version of events. Accusations made in them are claims, not established facts.
          </p>
        </aside>
      </div>
    </PageShell>
  )
}

export function BeefPage() {
  const data = useDhhData()
  const { id } = useView()
  const beef = useMemo(() => (id ? data.beefs.find((b) => b.id === id) : undefined), [data.beefs, id])
  if (!id) return <BeefIndex />
  return beef ? <BeefDetail key={beef.id} beef={beef} /> : <PageShell><NotFound what="beef" /></PageShell>
}
