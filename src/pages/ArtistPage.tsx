import { motion } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import { CareerArc } from '../components/artist-card/CareerArc'
import { ArtistChip, GenreChip, SceneChip, SectionLabel } from '../components/common/Links'
import { ReleaseRow } from '../components/common/ReleaseRow'
import { NotFound, PageHero, PageShell, StatRow } from '../components/layout/PageShell'
import { useDhhData } from '../hooks/useDhhData'
import { usePlayer } from '../hooks/usePlayer'
import { useView } from '../hooks/useView'
import { artistCredits, collaborators } from '../lib/artistStats'
import { distinctAliases } from '../lib/hash'
import { trackYear } from '../lib/indexDataset'
import { artistGenres } from '../lib/profiles'
import { hustleRoles } from '../lib/hustle'
import type { Artist } from '../types'

const KIND_LABEL: Record<Artist['kind'], string> = { rapper: 'Rapper', group: 'Group', producer: 'Producer', singer: 'Singer' }

function ArtistView({ artist }: { artist: Artist }) {
  const data = useDhhData()
  const { navigate, release } = useView()
  const region = data.regionById.get(artist.region_id)
  const color = region?.color ?? '#ff3b30'
  const credits = useMemo(() => artistCredits(data, artist.id), [data, artist.id])
  const collabs = useMemo(() => collaborators(data, artist.id), [data, artist.id])
  const genres = useMemo(() => artistGenres(data, artist.id), [data, artist.id])
  const hustle = useMemo(() => hustleRoles(data.hustle, artist.id), [data.hustle, artist.id])
  const productions = credits.filter((c) => c.roles.includes('producer'))
  const isProducer = artist.kind === 'producer' || productions.length > 0
  const lead = credits.filter((c) => c.roles.includes('main')).length
  const guest = credits.filter((c) => c.roles.includes('feature')).length
  const aliases = distinctAliases(artist.name, artist.aliases)
  const highlightRef = useRef<HTMLLIElement>(null)
  const { play } = usePlayer()
  // Their own songs first, then the ones they feature on.
  const playable = [
    ...data.listening.songs.filter((s) => s.artist_ids.includes(artist.id)),
    ...data.listening.songs.filter((s) => !s.artist_ids.includes(artist.id) && s.feat_ids.includes(artist.id)),
  ]

  useEffect(() => {
    if (!release) return
    const t = setTimeout(() => highlightRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 400)
    return () => clearTimeout(t)
  }, [artist.id, release])

  // Producers lead with what they made for others; everyone gets the full catalog.
  const sections = [
    ...(isProducer && productions.length > 0 ? [{ title: 'Productions', items: [...productions].reverse() }] : []),
    { title: isProducer ? 'Full catalog in the archive' : 'Discography', items: [...credits].reverse() },
  ]

  return (
    <PageShell>
      <div style={{ ['--scene' as string]: color }}>
        <PageHero
          color={color}
          title={artist.name}
          kicker={
            <>
              <button type="button" onClick={() => navigate('scene', { id: artist.region_id })} className="hover:text-ink" style={{ color }}>
                ● {region?.name} scene
              </button>
              <span>{KIND_LABEL[artist.kind]}</span>
              <span>
                {artist.active_from} to {artist.active_to ?? 'now'}
              </span>
            </>
          }
        >
          {aliases.length > 0 && <p className="mt-3 text-sm text-muted">Also known as {aliases.join(', ')}</p>}
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
            stats={
              isProducer
                ? [
                    [productions.length, 'Productions'],
                    [collabs.length, 'Artists worked with'],
                    [lead, 'Own releases'],
                    [guest, 'Features'],
                  ]
                : [
                    [lead, 'Lead releases'],
                    [guest, 'Features'],
                    [productions.length, 'Produced'],
                    [collabs.length, 'Collaborators'],
                  ]
            }
          />
        </PageHero>

        <div className="mx-auto grid max-w-[1600px] gap-12 px-4 pb-24 pt-10 sm:px-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-12">
            <motion.p className="max-w-2xl text-lg leading-relaxed text-ink/90" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {artist.bio}
            </motion.p>

            <section>
              <SectionLabel>Career arc</SectionLabel>
              <div className="rounded-[var(--radius-card)] border border-line bg-bg/60 p-3">
                <CareerArc artist={artist} credits={credits} yearRange={data.yearRange} color={color} highlightTrackId={release} />
              </div>
            </section>

            {sections.map((s) => {
              const years = [...new Set(s.items.map((c) => trackYear(c.track)))]
              return (
                <section key={s.title}>
                  <SectionLabel>{s.title}</SectionLabel>
                  <div className="space-y-8">
                    {years.map((year) => (
                      <div key={year} className="grid gap-3 sm:grid-cols-[88px_1fr]">
                        <div className="font-display text-3xl leading-none text-muted">{year}</div>
                        <ul className="min-w-0 space-y-2">
                          {s.items
                            .filter((c) => trackYear(c.track) === year)
                            .map(({ track, roles }) => {
                              const hl = track.id === release && s === sections[sections.length - 1]
                              return <ReleaseRow key={track.id} ref={hl ? highlightRef : undefined} track={track} roles={roles} selfId={artist.id} highlight={hl} />
                            })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>

          <aside className="min-w-0 space-y-10 lg:sticky lg:top-20 lg:self-start">
            {collabs.length > 0 && (
              <section>
                <SectionLabel>{isProducer ? 'Artists worked with' : 'Connected to'}</SectionLabel>
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
            {hustle.length > 0 && (
              <section>
                <SectionLabel>MTV Hustle</SectionLabel>
                <ul className="space-y-1">
                  {hustle.map((h) => (
                    <li key={`${h.season}-${h.role}`}>
                      <button
                        type="button"
                        onClick={() => navigate('hustle', { id: String(h.season) })}
                        className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line px-4 py-3 text-left transition-colors hover:border-accent"
                      >
                        <span className="font-display text-lg uppercase leading-tight">{h.role}</span>
                        <span className="kicker shrink-0">
                          Season {h.season} / {h.year}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {data.beefs.some((b) => b.sides.some((s) => s.artist_id === artist.id)) && (
              <section>
                <SectionLabel>Beefs</SectionLabel>
                <ul className="space-y-1">
                  {data.beefs
                    .filter((b) => b.sides.some((s) => s.artist_id === artist.id))
                    .map((b) => (
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
              <SceneChip id={artist.region_id} />
            </section>
            {artist.label_ids.length > 0 && (
              <section>
                <SectionLabel>Labels and crews</SectionLabel>
                <ul className="space-y-2">
                  {artist.label_ids.map((id) => {
                    const l = data.labelById.get(id)
                    return (
                      l && (
                        <li key={id} className="rounded-[var(--radius-card)] border border-line px-4 py-3">
                          <div className="font-display text-lg uppercase leading-none">{l.name}</div>
                          <div className="kicker mt-1">
                            {l.kind}
                            {l.founded_year ? ` / est. ${l.founded_year}` : ''}
                          </div>
                        </li>
                      )
                    )
                  })}
                </ul>
              </section>
            )}
            {artist.confidence !== 'high' && (
              <p className="border-l-2 border-faint pl-3 text-sm text-muted">Some details on this artist are still being verified against primary sources.</p>
            )}
          </aside>
        </div>
      </div>
    </PageShell>
  )
}

export function ArtistPage() {
  const data = useDhhData()
  const { id } = useView()
  const artist = id ? data.artistById.get(id) : undefined
  return artist ? <ArtistView key={artist.id} artist={artist} /> : <PageShell><NotFound what="artist" /></PageShell>
}
