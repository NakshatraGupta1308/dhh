import { motion } from 'motion/react'
import { useMemo } from 'react'
import { ArtistChip, GenreChip, SceneChip, SectionLabel } from '../components/common/Links'
import { ReleaseRow } from '../components/common/ReleaseRow'
import { NotFound, PageHero, PageShell, StatRow } from '../components/layout/PageShell'
import { useDhhData } from '../hooks/useDhhData'
import { usePlayer } from '../hooks/usePlayer'
import { useView } from '../hooks/useView'
import { artistCredits, collaborators } from '../lib/artistStats'
import { isDuo, membersOf } from '../lib/duos'
import { trackYear } from '../lib/indexDataset'
import { artistGenres } from '../lib/profiles'
import type { Artist } from '../types'

const EASE = [0.22, 1, 0.36, 1] as const

function DuoCard({ duo, index }: { duo: Artist; index: number }) {
  const data = useDhhData()
  const { navigate } = useView()
  const color = data.regionById.get(duo.region_id)?.color ?? '#ff3b30'
  const members = membersOf(data, duo)
  const releases = (data.creditsByArtist.get(duo.id) ?? []).filter((c) => c.role === 'main').length
  return (
    <motion.button
      type="button"
      onClick={() => navigate('duos', { id: duo.id })}
      className="group relative flex min-h-64 flex-col justify-between overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface p-6 text-left transition-colors hover:border-[var(--scene)]"
      style={{ ['--scene' as string]: color }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.07, ease: EASE }}
      whileHover={{ y: -4 }}
    >
      <span aria-hidden className="pointer-events-none absolute -right-3 -top-8 font-display text-[9rem] leading-none opacity-10 transition-opacity group-hover:opacity-25" style={{ color }}>
        2
      </span>
      <div className="relative kicker flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: color }} />
        {data.regionById.get(duo.region_id)?.name} / since {duo.active_from}
      </div>
      <div className="relative mt-8">
        <div className="font-display text-4xl uppercase leading-[0.9] transition-colors group-hover:text-[var(--scene)] sm:text-5xl">{duo.name}</div>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 font-display text-xl uppercase leading-tight text-muted">
          {members.map((m, i) => (
            <span key={m.id}>
              {i > 0 && <span className="mr-2 font-mono text-sm text-faint">+</span>}
              {m.name}
            </span>
          ))}
        </div>
      </div>
      <div className="relative mt-6 flex justify-between font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
        <span>
          {releases} release{releases === 1 ? '' : 's'} together
        </span>
        <span>Open →</span>
      </div>
    </motion.button>
  )
}

function DuoIndex() {
  const data = useDhhData()
  const duos = useMemo(() => data.artists.filter(isDuo).sort((a, b) => a.active_from - b.active_from || a.name.localeCompare(b.name)), [data.artists])
  const together = duos.reduce((n, d) => n + (data.creditsByArtist.get(d.id) ?? []).filter((c) => c.role === 'main').length, 0)
  return (
    <PageShell>
      <section className="relative overflow-hidden pt-24">
        <div className="relative mx-auto max-w-[1600px] px-4 pb-12 sm:px-8">
          <motion.p className="kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="text-accent">●</span> Two voices, one name
          </motion.p>
          <h1 className="mt-3 font-display text-[clamp(5rem,24vw,19rem)] uppercase leading-[0.8]" aria-label="Duos">
            <span className="flex overflow-hidden" aria-hidden>
              {'DUOS'.split('').map((ch, i) => (
                <motion.span key={i} className={i % 2 ? 'text-outline [--outline:var(--color-accent)]' : 'text-accent'} initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ delay: 0.1 + i * 0.06, duration: 0.8, ease: EASE }}>
                  {ch}
                </motion.span>
              ))}
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            The pairs who make music as one act. Each duo has its own page with the songs they made together, and each member keeps an artist page for their solo work and features.
          </p>
          <StatRow
            stats={[
              [duos.length, 'Duos'],
              [duos.length * 2, 'Members'],
              [together, 'Releases together'],
            ]}
          />
        </div>
      </section>
      <section className="mx-auto max-w-[1600px] px-4 pb-24 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {duos.map((d, i) => (
            <DuoCard key={d.id} duo={d} index={i} />
          ))}
        </div>
      </section>
    </PageShell>
  )
}

export function DuoDetail({ duo }: { duo: Artist }) {
  const data = useDhhData()
  const { navigate, release } = useView()
  const { play } = usePlayer()
  const region = data.regionById.get(duo.region_id)
  const color = region?.color ?? '#ff3b30'
  const members = membersOf(data, duo)
  const credits = useMemo(() => artistCredits(data, duo.id), [data, duo.id])
  const together = credits.filter((c) => c.roles.includes('main')).reverse()
  const guest = credits.filter((c) => !c.roles.includes('main')).reverse()
  const genres = useMemo(() => artistGenres(data, duo.id), [data, duo.id])
  const collabs = useMemo(() => collaborators(data, duo.id).filter((c) => !duo.members?.includes(c.artist.id)), [data, duo.id, duo.members])
  const beefs = data.beefs.filter((b) => b.sides.some((s) => s.artist_id === duo.id))
  const playable = data.listening.songs.filter((s) => s.artist_ids.includes(duo.id) || s.feat_ids.includes(duo.id))
  const labels = duo.label_ids.map((id) => data.labelById.get(id)).filter((l) => !!l)

  const byYear = (items: typeof credits) => {
    const years = [...new Set(items.map((c) => trackYear(c.track)))]
    return (
      <div className="space-y-8">
        {years.map((year) => (
          <div key={year} className="grid gap-3 sm:grid-cols-[88px_1fr]">
            <div className="font-display text-3xl leading-none text-muted">{year}</div>
            <ul className="min-w-0 space-y-2">
              {items
                .filter((c) => trackYear(c.track) === year)
                .map(({ track, roles }) => (
                  <ReleaseRow key={track.id} track={track} roles={roles} selfId={duo.id} highlight={track.id === release} />
                ))}
            </ul>
          </div>
        ))}
      </div>
    )
  }

  return (
    <PageShell>
      <div style={{ ['--scene' as string]: color }}>
        <PageHero
          color={color}
          title={duo.name}
          kicker={
            <>
              <button type="button" onClick={() => navigate('duos')} className="text-accent hover:text-ink">
                ● Duos
              </button>
              <button type="button" onClick={() => navigate('scene', { id: duo.region_id })} className="hover:text-ink" style={{ color }}>
                {region?.name} scene
              </button>
              <span>
                {duo.active_from} to {duo.active_to ?? 'now'}
              </span>
            </>
          }
        >
          <div className="mt-6 grid max-w-3xl gap-3 sm:grid-cols-2">
            {members.map((m, i) => (
              <motion.button
                key={m.id}
                type="button"
                onClick={() => navigate('artist', { id: m.id })}
                className="group rounded-[var(--radius-card)] border border-line bg-bg/60 p-4 text-left transition-colors hover:border-[var(--scene)]"
                initial={{ opacity: 0, x: i ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: EASE }}
              >
                <div className="kicker">Member {i + 1}</div>
                <div className="mt-1 font-display text-3xl uppercase leading-none group-hover:text-[var(--scene)]">{m.name}</div>
                <div className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                  {m.aliases[0] ? `${m.aliases[0]} / ` : ''}Solo page →
                </div>
              </motion.button>
            ))}
          </div>
          {playable.length > 0 && (
            <button
              type="button"
              onClick={() => play(playable[0].id, playable.map((s) => s.id))}
              className="mt-6 rounded-full px-5 py-2.5 font-mono text-xs uppercase tracking-[0.16em] text-bg transition-transform hover:-translate-y-0.5"
              style={{ background: color }}
            >
              ▶ Play {playable.length} song{playable.length === 1 ? '' : 's'}
            </button>
          )}
          <StatRow
            stats={[
              [together.length, 'Releases together'],
              [guest.length, 'Guest spots'],
              [collabs.length, 'Collaborators'],
            ]}
          />
        </PageHero>

        <div className="mx-auto grid max-w-[1600px] gap-12 px-4 pb-24 pt-10 sm:px-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-12">
            <p className="max-w-2xl text-lg leading-relaxed text-ink/90">{duo.bio}</p>
            <section>
              <SectionLabel>Made together</SectionLabel>
              {together.length ? byYear(together) : <p className="text-sm text-muted">No joint releases in the archive yet.</p>}
            </section>
            {guest.length > 0 && (
              <section>
                <SectionLabel>Guest spots as a duo</SectionLabel>
                {byYear(guest)}
              </section>
            )}
          </div>
          <aside className="min-w-0 space-y-10 lg:sticky lg:top-20 lg:self-start">
            <section>
              <SectionLabel>Members</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <ArtistChip key={m.id} id={m.id} />
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">Solo releases and features live on each member's own page.</p>
            </section>
            {collabs.length > 0 && (
              <section>
                <SectionLabel>Connected to</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {collabs.map((c) => (
                    <ArtistChip key={c.artist.id} id={c.artist.id} suffix={`×${c.shared}`} />
                  ))}
                </div>
              </section>
            )}
            {genres.length > 0 && (
              <section>
                <SectionLabel>Sound</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {genres.map(([g, n]) => (
                    <GenreChip key={g} id={g} suffix={n} />
                  ))}
                </div>
              </section>
            )}
            {beefs.length > 0 && (
              <section>
                <SectionLabel>Beefs</SectionLabel>
                <ul className="space-y-1">
                  {beefs.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => navigate('beef', { id: b.id })}
                        className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line px-4 py-3 text-left transition-colors hover:border-accent"
                      >
                        <span className="font-display text-lg uppercase leading-tight">{b.title}</span>
                        <span className="kicker shrink-0">{b.years}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section>
              <SectionLabel>Scene</SectionLabel>
              <SceneChip id={duo.region_id} />
            </section>
            {labels.length > 0 && (
              <section>
                <SectionLabel>Labels and crews</SectionLabel>
                <p className="text-muted">{labels.map((l) => l!.name).join(', ')}</p>
              </section>
            )}
          </aside>
        </div>
      </div>
    </PageShell>
  )
}

export function DuosPage() {
  const data = useDhhData()
  const { id } = useView()
  const duo = id ? data.artistById.get(id) : undefined
  if (!id) return <DuoIndex />
  return duo && isDuo(duo) ? <DuoDetail key={duo.id} duo={duo} /> : <PageShell><NotFound what="duo" /></PageShell>
}
