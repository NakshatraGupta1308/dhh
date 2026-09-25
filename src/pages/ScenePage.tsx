import { motion } from 'motion/react'
import { GeneratedCover } from '../components/common/GeneratedCover'
import { GenreChip, SceneChip, SectionLabel } from '../components/common/Links'
import { ReleaseRow } from '../components/common/ReleaseRow'
import { NotFound, PageHero, PageShell, StatRow } from '../components/layout/PageShell'
import { useDhhData } from '../hooks/useDhhData'
import { useFilters } from '../hooks/useFilters'
import { useView } from '../hooks/useView'
import { sceneProfile } from '../lib/profiles'
import type { Artist } from '../types'

function PersonCard({ artist, index }: { artist: Artist; index: number }) {
  const data = useDhhData()
  const { navigate } = useView()
  const color = data.regionById.get(artist.region_id)?.color ?? '#ff3b30'
  const credits = data.creditsByArtist.get(artist.id) ?? []
  const produced = credits.filter((c) => c.role === 'producer').length
  return (
    <motion.button
      type="button"
      onClick={() => navigate('artist', { id: artist.id })}
      className="group flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-3 text-left transition-colors hover:border-[var(--scene)]"
      style={{ ['--scene' as string]: color }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 6) * 0.04 }}
    >
      <GeneratedCover seed={artist.id} label={artist.name} color={color} size={56} className="shrink-0 rounded-full" />
      <span className="min-w-0">
        <span className="block truncate font-display text-2xl uppercase leading-none group-hover:text-[var(--scene)]">{artist.name}</span>
        <span className="kicker mt-1 block">
          {artist.kind === 'producer' ? `${produced} productions` : `${credits.length} credits`} / since {artist.active_from}
        </span>
      </span>
    </motion.button>
  )
}

export function ScenePage() {
  const data = useDhhData()
  const { id, navigate } = useView()
  const { set, clear } = useFilters()
  const profile = id ? sceneProfile(data, id) : null
  if (!profile) return <PageShell><NotFound what="scene" /></PageShell>
  const { region, artists, producers, releases, genres, labels, connections } = profile

  const replay = () => {
    clear()
    set('regions', [region.id])
    navigate('home', { anchor: 'timeline' })
  }

  return (
    <PageShell>
      <div style={{ ['--scene' as string]: region.color }}>
        <PageHero
          color={region.color}
          title={region.name}
          kicker={
            <>
              <span style={{ color: region.color }}>● Scene</span>
              <span>{releases.length} releases in the archive</span>
            </>
          }
        >
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/85">{region.description}</p>
          <StatRow
            stats={[
              [artists.length, 'Artists'],
              [producers.length, 'Producers'],
              [releases.length, 'Releases'],
              [labels.length, 'Labels and crews'],
            ]}
          />
          <button
            type="button"
            onClick={replay}
            className="mt-6 rounded-full px-5 py-2.5 font-mono text-xs uppercase tracking-[0.16em] text-bg transition-transform hover:-translate-y-0.5"
            style={{ background: region.color }}
          >
            Replay this scene on the timeline →
          </button>
        </PageHero>

        <div className="mx-auto grid max-w-[1600px] gap-12 px-4 pb-24 pt-10 sm:px-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-12">
            <section>
              <SectionLabel>The artists running it</SectionLabel>
              {artists.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {artists.map((a, i) => (
                    <PersonCard key={a.id} artist={a} index={i} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No artists from this scene yet.</p>
              )}
            </section>
            <section>
              <SectionLabel>Behind the boards</SectionLabel>
              {producers.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {producers.map((a, i) => (
                    <PersonCard key={a.id} artist={a} index={i} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No producers from this scene in the archive yet.</p>
              )}
            </section>
            <section>
              <SectionLabel>Releases</SectionLabel>
              <ul className="space-y-2">
                {releases.map((t) => (
                  <ReleaseRow key={t.id} track={t} />
                ))}
              </ul>
            </section>
          </div>
          <aside className="min-w-0 space-y-10 lg:sticky lg:top-20 lg:self-start">
            {genres.length > 0 && (
              <section>
                <SectionLabel>Sound of the scene</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {genres.map(([g, n]) => (
                    <GenreChip key={g} id={g} suffix={n} />
                  ))}
                </div>
              </section>
            )}
            {connections.length > 0 && (
              <section>
                <SectionLabel>Connected scenes</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {connections.map(([rid, n]) => (
                    <SceneChip key={rid} id={rid} suffix={`${n} link${n === 1 ? '' : 's'}`} />
                  ))}
                </div>
              </section>
            )}
            {labels.length > 0 && (
              <section>
                <SectionLabel>Labels and crews</SectionLabel>
                <ul className="space-y-2">
                  {labels.map((l) => (
                    <li key={l.id} className="rounded-[var(--radius-card)] border border-line px-4 py-3">
                      <div className="font-display text-lg uppercase leading-none">{l.name}</div>
                      <div className="kicker mt-1">
                        {l.kind}
                        {l.founded_year ? ` / est. ${l.founded_year}` : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </PageShell>
  )
}
