import { motion } from 'motion/react'
import { useMemo } from 'react'
import { SectionLabel } from '../components/common/Links'
import { NotFound, PageShell } from '../components/layout/PageShell'
import { useDhhData } from '../hooks/useDhhData'
import { useView } from '../hooks/useView'
import type { HustleContestant, HustlePerson, HustleSeason } from '../types'

const EASE = [0.22, 1, 0.36, 1] as const
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** One colour per season so cards, headers and the index line up. */
const SEASON_COLORS = ['#FFB703', '#4CC9F0', '#FF3B30', '#C77DFF', '#2EC4B6']
/** Results that earn a spot on the podium, in display order. */
const PODIUM = ['Winner', 'Runner-up', 'OG Hustler', '3rd place']

export const seasonColor = (n: number) => SEASON_COLORS[(n - 1) % SEASON_COLORS.length]

function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

function airDates(s: HustleSeason): string {
  return `${formatDay(s.premiere)} to ${s.finale ? formatDay(s.finale) : 'now'}`
}

function winnerOf(s: HustleSeason): HustleContestant | undefined {
  return s.contestants.find((c) => c.result === 'Winner')
}

function AiringPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-accent">
      <motion.span className="size-1.5 rounded-full bg-accent" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
      On air
    </span>
  )
}

/** A name that links to the artist page when the person is in the archive. */
function PersonName({ person, className = '' }: { person: HustlePerson; className?: string }) {
  const { navigate } = useView()
  if (!person.artist_id) return <span className={className}>{person.name}</span>
  return (
    <button type="button" onClick={() => navigate('artist', { id: person.artist_id! })} className={`text-left underline decoration-line decoration-1 underline-offset-4 hover:text-accent hover:decoration-accent ${className}`}>
      {person.name}
    </button>
  )
}

function SeasonCard({ season, index }: { season: HustleSeason; index: number }) {
  const { navigate } = useView()
  const color = seasonColor(season.number)
  const winner = winnerOf(season)
  return (
    <motion.button
      type="button"
      onClick={() => navigate('hustle', { id: String(season.number) })}
      className="group relative flex min-h-80 flex-col justify-between overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface p-6 text-left transition-colors hover:border-ink"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.07, ease: EASE }}
      whileHover={{ y: -4 }}
    >
      <span aria-hidden className="pointer-events-none absolute -right-4 -top-12 font-display text-[13rem] leading-none opacity-15 transition-opacity group-hover:opacity-40" style={{ color }}>
        {season.number}
      </span>
      <div className="relative flex items-center justify-between gap-3">
        <span className="kicker">
          Season {season.number} / {season.year}
        </span>
        {season.status === 'airing' && <AiringPill />}
      </div>
      <div className="relative mt-10">
        <div className="font-display text-3xl uppercase leading-[0.9] sm:text-4xl">{season.title}</div>
        <div className="mt-5 kicker">Winner</div>
        <div className="font-display text-4xl uppercase leading-none sm:text-5xl" style={{ color }}>
          {winner ? winner.name : 'TBA'}
        </div>
      </div>
      <div className="relative mt-6 flex items-center justify-between gap-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
        <span className="truncate">Judge: {season.judges.map((j) => j.name).join(', ')}</span>
        <span className="shrink-0">Open →</span>
      </div>
    </motion.button>
  )
}

function HustleIndex() {
  const { hustle } = useDhhData()
  const { show, seasons } = hustle
  const contestants = seasons.reduce((n, s) => n + s.contestants.length, 0)
  const judges = new Set(seasons.flatMap((s) => s.judges.map((j) => j.name))).size

  return (
    <PageShell>
      <section className="relative overflow-hidden pt-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,183,3,0.14),transparent_60%)]" />
        <div className="relative mx-auto max-w-[1600px] px-4 pb-12 sm:px-8">
          <motion.p className="kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="text-accent">●</span> {show.network} / since {seasons[0].year}
          </motion.p>
          <h1 className="relative mt-3 font-display text-[clamp(4.5rem,21vw,17rem)] uppercase leading-[0.8]" aria-label={show.name}>
            <span className="mb-3 block font-mono text-[clamp(1rem,2.5vw,1.6rem)] leading-none tracking-[0.4em] text-muted">MTV</span>
            <span className="flex overflow-hidden" aria-hidden>
              {'HUSTLE'.split('').map((ch, i) => (
                <motion.span key={i} initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.8, ease: EASE }} style={{ color: i % 2 ? undefined : '#FFB703' }}>
                  {ch}
                </motion.span>
              ))}
            </span>
          </h1>
          <p className="mt-6 max-w-2xl font-display text-2xl uppercase leading-tight text-accent sm:text-3xl">{show.tagline}</p>
          <p className="mt-4 max-w-2xl text-lg text-muted">{show.about}</p>
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-5">
            {[
              [seasons.length, 'Seasons'],
              [contestants, 'Contestants on record'],
              [judges, 'Judges'],
              [seasons.filter((s) => winnerOf(s)).length, 'Champions crowned'],
            ].map(([n, label]) => (
              <div key={label}>
                <div className="font-display text-4xl leading-none sm:text-5xl">{n}</div>
                <div className="kicker mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-8">
        <SectionLabel>Every season</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {seasons.map((s, i) => (
            <SeasonCard key={s.number} season={s} index={i} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-8">
        <SectionLabel>How the show works</SectionLabel>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {show.format.map((f, i) => (
            <motion.li
              key={f.step}
              className="rounded-[var(--radius-card)] border border-line p-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.06, ease: EASE }}
            >
              <div className="font-mono text-xs text-faint">{String(i + 1).padStart(2, '0')}</div>
              <h3 className="mt-1 font-display text-2xl uppercase leading-tight">{f.step}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-8">
        <SectionLabel>Season by season</SectionLabel>
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="kicker border-b border-line">
              <tr>
                {['Season', 'Aired', 'Host', 'Judge', 'Squad bosses', 'Winner'].map((h) => (
                  <th key={h} className="px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seasons.map((s) => (
                <tr key={s.number} className="border-b border-line last:border-0 align-top">
                  <td className="px-4 py-3 font-display text-xl" style={{ color: seasonColor(s.number) }}>
                    S{s.number}
                  </td>
                  <td className="px-4 py-3 text-muted">{airDates(s)}</td>
                  <td className="px-4 py-3">{s.hosts.map((h) => h.name).join(', ') || 'Not yet known'}</td>
                  <td className="px-4 py-3">{s.judges.map((j) => j.name).join(', ')}</td>
                  <td className="px-4 py-3">{s.squad_bosses.map((b) => b.name).join(', ') || 'None (no squads)'}</td>
                  <td className="px-4 py-3 font-display text-lg uppercase">{winnerOf(s)?.name ?? 'TBA'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1600px] gap-8 px-4 pb-24 sm:px-8 md:grid-cols-2">
        <div>
          <SectionLabel>Where to watch</SectionLabel>
          <p className="text-muted">
            Airs on <span className="text-ink">{show.network}</span> in {show.language}. Streams on {show.streaming.join(', ')}.
          </p>
        </div>
        <div>
          <SectionLabel>Spin-offs</SectionLabel>
          {show.spinoffs.map((s) => (
            <div key={s.name}>
              <h3 className="font-display text-2xl uppercase">{s.name}</h3>
              <p className="mt-1 text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  )
}

function Podium({ season }: { season: HustleSeason }) {
  const color = seasonColor(season.number)
  const places = PODIUM.map((r) => season.contestants.find((c) => c.result === r)).filter((c): c is HustleContestant => !!c)
  if (places.length === 0) return null
  return (
    <section>
      <SectionLabel>Results</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        {places.map((c, i) => (
          <motion.div
            key={c.name}
            className={`min-w-0 rounded-[var(--radius-card)] border p-5 ${i === 0 ? 'sm:col-span-full' : ''}`}
            style={{ borderColor: i === 0 ? color : 'var(--color-line)', background: i === 0 ? `${color}1f` : undefined }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
          >
            <div className="kicker" style={i === 0 ? { color } : undefined}>
              {c.result}
            </div>
            <PersonName person={c} className={`mt-2 block break-words font-display uppercase leading-none ${i === 0 ? 'text-5xl sm:text-7xl' : 'text-3xl'}`} />
            {(c.real_name || c.from) && <p className="mt-2 text-sm text-muted">{[c.real_name, c.from].filter(Boolean).join(' / ')}</p>}
            {c.squad && <p className="kicker mt-2">{c.squad}</p>}
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function CrewBlock({ label, people }: { label: string; people: (HustlePerson & { squad?: string | null; note?: string | null })[] }) {
  if (people.length === 0) return null
  return (
    <section>
      <SectionLabel>{label}</SectionLabel>
      <ul className="space-y-3">
        {people.map((p) => (
          <li key={p.name}>
            <PersonName person={p} className="font-display text-2xl uppercase leading-tight" />
            {p.squad && <div className="kicker mt-0.5">Squad: {p.squad}</div>}
            {p.note && <p className="mt-0.5 text-sm text-muted">{p.note}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}

function SeasonDetail({ season }: { season: HustleSeason }) {
  const { hustle } = useDhhData()
  const { navigate } = useView()
  const color = seasonColor(season.number)
  const prev = hustle.seasons.find((s) => s.number === season.number - 1)
  const next = hustle.seasons.find((s) => s.number === season.number + 1)

  return (
    <PageShell>
      <header className="relative overflow-hidden pt-14" style={{ background: `linear-gradient(170deg, ${color}40, transparent 65%)` }}>
        <span aria-hidden className="pointer-events-none absolute -right-6 top-6 font-display text-[clamp(12rem,40vw,34rem)] leading-none opacity-15" style={{ color }}>
          {season.number}
        </span>
        <div className="relative mx-auto max-w-[1600px] px-4 pb-10 pt-12 sm:px-8">
          <div className="kicker relative z-10 flex flex-wrap items-center gap-x-3 gap-y-1">
            <button type="button" onClick={() => navigate('hustle')} className="text-accent hover:text-ink">
              ● MTV Hustle
            </button>
            <span>Season {season.number}</span>
            <span>{airDates(season)}</span>
            {season.status === 'airing' && <AiringPill />}
          </div>
          <motion.h1
            className="mt-3 max-w-5xl break-words font-display text-[clamp(2.8rem,9vw,8rem)] uppercase leading-[0.85]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            {season.title}
          </motion.h1>
          {season.full_title !== season.title && <p className="mt-3 text-muted">Full title: {season.full_title}</p>}
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-5">
            {[
              [season.year, 'Year'],
              [season.contestants.length, season.roster_complete ? 'Contestants' : 'Contestants on record'],
              [season.judges.length, season.judges.length === 1 ? 'Judge' : 'Judges'],
              [season.squad_bosses.length || 'None', 'Squad bosses'],
            ].map(([n, label]) => (
              <div key={label}>
                <div className="font-display text-4xl leading-none">{n}</div>
                <div className="kicker mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-12 px-4 pb-16 pt-8 sm:px-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-12">
          {season.status === 'airing' && !winnerOf(season) ? (
            <section className="rounded-[var(--radius-card)] border border-accent/60 p-5">
              <SectionLabel>Results</SectionLabel>
              <p className="text-muted">This season is still on air. The winner will be crowned at the grand finale.</p>
            </section>
          ) : (
            <Podium season={season} />
          )}

          <section>
            <SectionLabel>Season highlights</SectionLabel>
            <ul className="space-y-3">
              {season.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-lg leading-relaxed text-ink/90">
                  <span className="mt-3 size-1.5 shrink-0 rounded-full" style={{ background: color }} />
                  {h}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionLabel>Contestants</SectionLabel>
            <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="kicker border-b border-line">
                  <tr>
                    {['#', 'Stage name', 'Real name', 'From', ...(season.squad_bosses.length ? ['Squad'] : []), 'Result'].map((h) => (
                      <th key={h} className="px-4 py-3 font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {season.contestants.map((c, i) => (
                    <tr key={c.name} className="border-b border-line align-top last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-faint">{String(i + 1).padStart(2, '0')}</td>
                      <td className="px-4 py-3">
                        <PersonName person={c} className="font-display text-lg uppercase leading-tight" />
                      </td>
                      <td className="px-4 py-3 text-muted">{c.real_name ?? '?'}</td>
                      <td className="px-4 py-3 text-muted">{c.from ?? '?'}</td>
                      {season.squad_bosses.length > 0 && <td className="px-4 py-3 text-muted">{c.squad ?? '?'}</td>}
                      <td className="px-4 py-3">
                        <span className={c.result === 'Winner' ? 'font-semibold' : ''} style={PODIUM.includes(c.result) ? { color } : undefined}>
                          {c.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!season.roster_complete && (
              <p className="mt-3 text-sm text-faint">
                {season.status === 'airing'
                  ? 'The season is still airing, so this list grows as contestants are revealed.'
                  : 'Partial roster: only contestants we could verify are listed. A ? marks details we could not confirm.'}
              </p>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-10 lg:sticky lg:top-20 lg:self-start">
          <CrewBlock label={season.judges.length === 1 ? 'Judge' : 'Judges'} people={season.judges} />
          <CrewBlock label="Squad bosses" people={season.squad_bosses} />
          <CrewBlock label={season.hosts.length === 1 ? 'Host' : 'Hosts'} people={season.hosts} />
          <CrewBlock label="Guests" people={season.guests} />
          {season.prize && (
            <section>
              <SectionLabel>Prize</SectionLabel>
              <p className="text-muted">{season.prize}</p>
            </section>
          )}
        </aside>
      </div>

      <nav className="mx-auto grid max-w-[1600px] gap-3 px-4 pb-24 sm:grid-cols-2 sm:px-8" aria-label="Other seasons">
        {prev ? (
          <button type="button" onClick={() => navigate('hustle', { id: String(prev.number) })} className="rounded-[var(--radius-card)] border border-line p-5 text-left transition-colors hover:border-ink">
            <div className="kicker">← Season {prev.number}</div>
            <div className="mt-1 font-display text-2xl uppercase leading-tight">{prev.title}</div>
          </button>
        ) : (
          <span />
        )}
        {next && (
          <button type="button" onClick={() => navigate('hustle', { id: String(next.number) })} className="rounded-[var(--radius-card)] border border-line p-5 text-left transition-colors hover:border-ink sm:text-right">
            <div className="kicker">Season {next.number} →</div>
            <div className="mt-1 font-display text-2xl uppercase leading-tight">{next.title}</div>
          </button>
        )}
      </nav>
    </PageShell>
  )
}

export function HustlePage() {
  const { hustle } = useDhhData()
  const { id } = useView()
  const season = useMemo(() => (id ? hustle.seasons.find((s) => String(s.number) === id) : undefined), [hustle.seasons, id])
  if (!id) return <HustleIndex />
  return season ? <SeasonDetail key={season.number} season={season} /> : <PageShell><NotFound what="season" /></PageShell>
}
