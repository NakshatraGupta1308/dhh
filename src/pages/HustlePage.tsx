import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { SectionLabel } from '../components/common/Links'
import { NotFound, PageShell } from '../components/layout/PageShell'
import { useDhhData } from '../hooks/useDhhData'
import { useView } from '../hooks/useView'
import type { HustleBlock, HustleContestant, HustlePerson, HustleSeason, HustleTable } from '../types'

const EASE = [0.22, 1, 0.36, 1] as const
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** One colour per season so cards, headers and the index line up. */
const SEASON_COLORS = ['#FFB703', '#4CC9F0', '#FF3B30', '#C77DFF', '#2EC4B6']

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
              [contestants, 'Contestants'],
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
          <p className="mt-2 text-muted">
            Produced by <span className="text-ink">{show.production_company}</span> in {show.country}, with {show.episodes} episodes so far.
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

/** Colour for a result word so eliminations, danger and wins read at a glance. */
function tone(text: string, color: string): { color?: string; background?: string; fontWeight?: number } | undefined {
  const t = text.toLowerCase()
  if (!t || t === '-') return undefined
  if (/^winner\b/.test(t)) return { color, background: `${color}26`, fontWeight: 600 }
  if (/elim/.test(t)) return { color: '#FF3B30', background: 'rgba(255,59,48,0.12)' }
  if (/bottom|btm|danger|unsafe|^low$/.test(t)) return { color: '#FFB703', background: 'rgba(255,183,3,0.1)' }
  if (/runner|3rd|finalist|top \d|qualified|advanced|immune|saved|survived|best|radio ready|sealed|high|og hustler|^selected$|^top 15$/.test(t))
    return { color: 'var(--color-ink)', background: 'var(--color-surface-2)' }
  return undefined
}

function slug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Cells that exactly match an archive artist become links. */
function useArtistLookup(season: HustleSeason) {
  const data = useDhhData()
  return useMemo(() => {
    const map = new Map<string, string>()
    for (const a of data.artists) {
      map.set(a.name.toLowerCase(), a.id)
      for (const alias of a.aliases) map.set(alias.toLowerCase(), a.id)
    }
    for (const c of season.contestants) if (c.artist_id) map.set(c.name.toLowerCase(), c.artist_id)
    return map
  }, [data.artists, season.contestants])
}

function DataTable({ table, color, lookup }: { table: HustleTable; color: string; lookup: Map<string, string> }) {
  const { navigate } = useView()
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line">
          <tr>
            {table.columns.map((h, i) => (
              <th key={i} className="kicker whitespace-nowrap px-3 py-2.5 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r, i) => (
            <tr key={i} className="border-b border-line/60 align-top last:border-0">
              {r.map((cell, j) => {
                const id = lookup.get(cell.toLowerCase())
                const style = tone(cell, color)
                return (
                  <td key={j} className="px-3 py-2">
                    {id ? (
                      <button type="button" onClick={() => navigate('artist', { id })} className="whitespace-nowrap underline decoration-line underline-offset-4 hover:text-accent hover:decoration-accent">
                        {cell}
                      </button>
                    ) : style ? (
                      <span className="inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs" style={style}>
                        {cell}
                      </span>
                    ) : (
                      <span className={/^(Order|Battle No\.)$/.test(table.columns[j]) ? 'font-mono text-xs text-faint' : 'text-ink/85'}>{cell}</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Blocks({ blocks, color, lookup }: { blocks: HustleBlock[]; color: string; lookup: Map<string, string> }) {
  return (
    <div className="space-y-4">
      {blocks.map((b, i) =>
        b.type === 'table' ? (
          <DataTable key={i} table={b} color={color} lookup={lookup} />
        ) : b.type === 'heading' ? (
          <h4 key={i} className="pt-2 font-display text-xl uppercase leading-tight" style={{ color }}>
            {b.text}
          </h4>
        ) : (
          <p key={i} className="max-w-3xl text-sm leading-relaxed text-muted">
            {b.text}
          </p>
        ),
      )}
    </div>
  )
}

function parseWeek(title: string) {
  const m = title.match(/^(Week [\d-]+(?: Semi Final| Final)?) \((Episodes? [\d-]+)\)(?:: (.*))?$/)
  return m ? { label: m[1], episodes: m[2], theme: m[3] ?? null } : { label: title, episodes: null, theme: null }
}

/** Theme line and the rappers who went home, pulled from a week's notes and tables. */
function weekSummary(w: HustleSeason['weeks'][number]) {
  const theme = w.blocks.find((b) => b.type !== 'table' && /^Theme/.test(b.text))
  const out: string[] = []
  for (const b of w.blocks) {
    if (b.type !== 'table') continue
    const rapper = b.columns.findIndex((c) => /^Rapper/.test(c))
    const elimCol = b.columns.indexOf('Eliminated')
    for (const r of b.rows) {
      if (elimCol >= 0) out.push(...r[elimCol].split(/ & | \/ /).filter(Boolean))
      else if (rapper >= 0 && r.some((c, j) => j !== rapper && /eliminated/i.test(c))) out.push(...r[rapper].split(/ vs\.? /).map((n) => n.replace(/ \(.*\)$/, '')))
    }
  }
  return {
    theme: theme && theme.type !== 'table' ? theme.text.replace(/^Theme( #1)?: /, '').split(' - ')[0] : null,
    out: [...new Set(out)],
    listed: w.blocks.some((b) => b.type === 'table'),
  }
}

function Weeks({ season, color, lookup }: { season: HustleSeason; color: string; lookup: Map<string, string> }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set())
  const all = open.size === season.weeks.length
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  return (
    <section id="week-by-week" className="scroll-mt-20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SectionLabel>Week by week</SectionLabel>
        <button type="button" onClick={() => setOpen(all ? new Set() : new Set(season.weeks.map((_, i) => i)))} className="kicker -mt-4 hover:text-ink">
          {all ? 'Collapse all' : 'Expand all'}
        </button>
      </div>
      <ol className="space-y-2">
        {season.weeks.map((w, i) => {
          const parsed = parseWeek(w.title)
          const { label, episodes } = parsed
          const summary = weekSummary(w)
          const theme = parsed.theme ?? summary.theme
          const outLine = summary.out.length ? `Out: ${summary.out.join(', ')}` : summary.listed ? 'No elimination' : 'Results not listed yet'
          const isOpen = open.has(i)
          return (
            <li key={w.title} className="rounded-[var(--radius-card)] border border-line" style={isOpen ? { borderColor: `${color}80` } : undefined}>
              <button type="button" onClick={() => toggle(i)} aria-expanded={isOpen} className="flex w-full items-center gap-4 px-4 py-3 text-left sm:px-5">
                <span className="w-24 shrink-0 font-display text-2xl uppercase leading-none sm:w-32" style={{ color }}>
                  {label.replace('Week ', 'Wk ')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg uppercase leading-tight">{theme ?? outLine}</span>
                  <span className="kicker block truncate">
                    {[episodes, theme ? outLine : null].filter(Boolean).join(' / ')}
                  </span>
                </span>
                <span aria-hidden className="shrink-0 font-mono text-lg text-muted transition-transform" style={{ transform: isOpen ? 'rotate(45deg)' : undefined }}>
                  +
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-line px-4 py-5 sm:px-5">
                  <Blocks blocks={w.blocks} color={color} lookup={lookup} />
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {season.status === 'airing' && <p className="mt-3 text-sm text-faint">More weeks will appear here as the season airs.</p>}
    </section>
  )
}

function Podium({ season }: { season: HustleSeason }) {
  const color = seasonColor(season.number)
  const cards: { label: string; c: HustleContestant }[] = []
  for (const r of ['Winner', 'Runner-up', '3rd place']) {
    const c = season.contestants.find((x) => x.result === r)
    if (c) cards.push({ label: r, c })
  }
  const og = season.contestants.find((c) => c.og_hustler)
  if (og) {
    const same = cards.find((x) => x.c === og)
    if (same) same.label += ' and OG Hustler'
    else cards.push({ label: 'OG Hustler', c: og })
  }
  if (cards.length === 0) return null
  return (
    <section>
      <SectionLabel>Results</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(({ label, c }, i) => (
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
              {label}
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

function CrewBlock({ label, people }: { label: string; people: (HustlePerson & { squad?: string | null })[] }) {
  if (people.length === 0) return null
  return (
    <section>
      <SectionLabel>{label}</SectionLabel>
      <ul className="space-y-3">
        {people.map((p) => (
          <li key={p.name}>
            <PersonName person={p} className="font-display text-2xl uppercase leading-tight" />
            {p.squad && <div className="kicker mt-0.5">Squad: {p.squad}</div>}
          </li>
        ))}
      </ul>
    </section>
  )
}

function GuestBlock({ season }: { season: HustleSeason }) {
  const data = useDhhData()
  const { navigate } = useView()
  if (season.guests.length === 0) return null
  return (
    <>
      {(['Guest judge', 'Guest'] as const).map((role) => {
        const list = season.guests.filter((g) => g.role === role)
        if (list.length === 0) return null
        return (
          <section key={role}>
            <SectionLabel>{role === 'Guest' ? 'Guest appearances' : 'Guest judges'}</SectionLabel>
            <ul className="space-y-2">
              {list.map((g, i) => (
                <li key={`${g.name}-${i}`} className="flex gap-3 text-sm">
                  <span className="w-16 shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-faint">Wk {g.week.replace(' (Auditions)', '').replace(' (Final)', '')}</span>
                  <span className="min-w-0">
                    <span className="text-ink/90">{g.name}</span>
                    {g.artist_ids.length > 0 && (
                      <span className="mt-1 flex flex-wrap gap-x-3">
                        {g.artist_ids.map((id) => (
                          <button key={id} type="button" onClick={() => navigate('artist', { id })} className="kicker hover:text-accent">
                            {data.artistById.get(id)?.name} →
                          </button>
                        ))}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}

function ContestantTable({ season, color }: { season: HustleSeason; color: string }) {
  const hasFrom = season.contestants.some((c) => c.from)
  const hasSquad = season.contestants.some((c) => c.squad)
  const hasEntered = season.contestants.some((c) => c.entered)
  const heads = ['#', 'Stage name', 'Real name', ...(hasFrom ? ['From'] : []), ...(hasSquad ? ['Squad'] : []), ...(hasEntered ? ['Entered'] : []), 'Place', 'Result']
  return (
    <section id="contestants" className="scroll-mt-20">
      <SectionLabel>Contestants</SectionLabel>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line">
            <tr>
              {heads.map((h) => (
                <th key={h} className="kicker whitespace-nowrap px-3 py-2.5 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {season.contestants.map((c, i) => (
              <tr key={c.name} className="border-b border-line/60 align-top last:border-0">
                <td className="px-3 py-2.5 font-mono text-xs text-faint">{String(i + 1).padStart(2, '0')}</td>
                <td className="px-3 py-2.5">
                  <PersonName person={c} className="whitespace-nowrap font-display text-lg uppercase leading-tight" />
                  {c.og_hustler && (
                    <span className="ml-2 rounded px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.1em]" style={{ color, background: `${color}22` }}>
                      OG Hustler
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-muted">{c.real_name ?? ''}</td>
                {hasFrom && <td className="px-3 py-2.5 text-muted">{c.from ?? ''}</td>}
                {hasSquad && <td className="whitespace-nowrap px-3 py-2.5 text-muted">{c.squad ?? ''}</td>}
                {hasEntered && <td className="whitespace-nowrap px-3 py-2.5 text-muted">{c.entered ?? ''}</td>}
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted">{c.place ?? ''}</td>
                <td className="px-3 py-2.5">
                  <span className="inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs" style={tone(c.result, color)}>
                    {c.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {season.status === 'airing' && <p className="mt-3 text-sm text-faint">The season is still airing, so results fill in as it goes.</p>}
    </section>
  )
}

function SeasonDetail({ season }: { season: HustleSeason }) {
  const { hustle } = useDhhData()
  const { navigate } = useView()
  const color = seasonColor(season.number)
  const lookup = useArtistLookup(season)
  const prev = hustle.seasons.find((s) => s.number === season.number - 1)
  const next = hustle.seasons.find((s) => s.number === season.number + 1)
  const grid = season.sections.findIndex((s) => s.title === 'Week by week results')
  const before = grid < 0 ? season.sections : season.sections.slice(0, grid + 1)
  const after = grid < 0 ? [] : season.sections.slice(grid + 1)
  const jumps = [
    ['contestants', 'Contestants'],
    ...before.map((s) => [slug(s.title), s.title]),
    ...(season.weeks.length ? [['week-by-week', 'Week by week']] : []),
    ...after.map((s) => [slug(s.title), s.title]),
  ]
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const renderSection = (s: HustleSeason['sections'][number]) => (
    <section key={s.title} id={slug(s.title)} className="scroll-mt-20">
      <SectionLabel>{s.title}</SectionLabel>
      <Blocks blocks={s.blocks} color={color} lookup={lookup} />
    </section>
  )

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
              [season.contestants.length, 'Contestants'],
              [season.weeks.length, season.status === 'airing' ? 'Weeks so far' : 'Weeks'],
              [season.squad_bosses.length || 'None', 'Squad bosses'],
              [season.guests.length, 'Guest spots'],
            ].map(([n, label]) => (
              <div key={label}>
                <div className="font-display text-4xl leading-none">{n}</div>
                <div className="kicker mt-1">{label}</div>
              </div>
            ))}
          </div>
          <nav className="mt-6 flex flex-wrap gap-2" aria-label="On this page">
            {jumps.map(([id, label]) => (
              <button key={id} type="button" onClick={() => jump(id)} className="rounded-full border border-line px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted transition-colors hover:border-ink hover:text-ink">
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-12 px-4 pb-12 pt-8 sm:px-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-12">
          {season.status === 'airing' && !winnerOf(season) ? (
            <section className="rounded-[var(--radius-card)] border border-accent/60 p-5">
              <SectionLabel>Results</SectionLabel>
              <p className="text-muted">This season is still on air. The winner will be crowned at the grand finale.</p>
            </section>
          ) : (
            <Podium season={season} />
          )}
          {season.about.length > 0 && (
            <section>
              <SectionLabel>About the season</SectionLabel>
              <div className="max-w-2xl space-y-3 text-lg leading-relaxed text-ink/90">
                {season.about.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          )}
          <section>
            <SectionLabel>Season highlights</SectionLabel>
            <ul className="space-y-3">
              {season.highlights.map((h) => (
                <li key={h} className="flex gap-3 leading-relaxed text-ink/90">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full" style={{ background: color }} />
                  {h}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="min-w-0 space-y-10">
          <CrewBlock label={season.judges.length === 1 ? 'Judge' : 'Judges'} people={season.judges} />
          <CrewBlock label="Squad bosses" people={season.squad_bosses} />
          <CrewBlock label={season.hosts.length === 1 ? 'Host' : 'Hosts'} people={season.hosts} />
          {season.prize && (
            <section>
              <SectionLabel>Prize</SectionLabel>
              <p className="text-muted">{season.prize}</p>
            </section>
          )}
          <GuestBlock season={season} />
        </aside>
      </div>

      <div className="mx-auto max-w-[1600px] space-y-14 overflow-x-clip px-4 pb-16 sm:px-8">
        <ContestantTable season={season} color={color} />
        {before.map(renderSection)}
        {season.weeks.length > 0 && <Weeks season={season} color={color} lookup={lookup} />}
        {after.map(renderSection)}
        <p className="text-sm text-faint">Source: the MTV Hustle article on Wikipedia. Colour-only details from the original tables (such as which judge gave a Radio Hit) are not shown.</p>
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
