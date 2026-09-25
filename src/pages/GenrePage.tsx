import { motion } from 'motion/react'
import { ArtistChip, GenreChip, SceneChip, SectionLabel } from '../components/common/Links'
import { ReleaseRow } from '../components/common/ReleaseRow'
import { NotFound, PageHero, PageShell, StatRow } from '../components/layout/PageShell'
import { useDhhData } from '../hooks/useDhhData'
import { useView } from '../hooks/useView'
import { genreProfile } from '../lib/profiles'

export function GenrePage() {
  const data = useDhhData()
  const { id, navigate } = useView()
  const profile = id ? genreProfile(data, id) : null
  if (!profile) return <PageShell><NotFound what="genre" /></PageShell>
  const { genre, tracks, pros, related, scenes } = profile
  const top = pros.slice(0, 8)

  return (
    <PageShell>
      <PageHero
        color={genre.color}
        title={genre.name}
        kicker={
          <>
            <button type="button" onClick={() => navigate('genres')} className="hover:text-ink" style={{ color: genre.color }}>
              ◆ Genres
            </button>
            <span>{tracks.length} releases tagged</span>
          </>
        }
      >
        <p className="mt-4 font-display text-2xl uppercase leading-tight sm:text-3xl" style={{ color: genre.color }}>
          {genre.tagline}
        </p>
        <StatRow
          stats={[
            [tracks.length, 'Releases'],
            [pros.length, 'Artists and producers'],
            [scenes.length, 'Scenes'],
          ]}
        />
      </PageHero>

      <div className="mx-auto grid max-w-[1600px] gap-12 px-4 pb-24 pt-10 sm:px-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-12">
          <section>
            <SectionLabel>What it is</SectionLabel>
            <p className="max-w-2xl text-lg leading-relaxed text-ink/90">{genre.description}</p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
              <span className="kicker mr-2 !text-ink">Origins</span>
              {genre.origins}
            </p>
          </section>

          <section>
            <SectionLabel>How it sounds</SectionLabel>
            <ul className="grid gap-2 sm:grid-cols-3">
              {genre.sound.map((s, i) => (
                <motion.li
                  key={s}
                  className="rounded-[var(--radius-card)] border border-line bg-surface p-4 text-sm leading-relaxed"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <span className="mb-2 block font-display text-3xl leading-none" style={{ color: genre.color }}>
                    0{i + 1}
                  </span>
                  {s}
                </motion.li>
              ))}
            </ul>
          </section>

          <section>
            <SectionLabel>The pros</SectionLabel>
            <div className="grid gap-2 sm:grid-cols-2">
              {top.map(([artist, n], i) => {
                const color = data.regionById.get(artist.region_id)?.color
                return (
                  <motion.button
                    key={artist.id}
                    type="button"
                    onClick={() => navigate('artist', { id: artist.id })}
                    className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-ink"
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, '0')}</span>
                      <span className="truncate font-display text-2xl uppercase leading-none">{artist.name}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[0.62rem] uppercase tracking-[0.12em]" style={{ color }}>
                      {n} release{n === 1 ? '' : 's'}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </section>

          <section>
            <SectionLabel>Songs and projects</SectionLabel>
            <ul className="space-y-2">
              {tracks.map((t) => (
                <ReleaseRow key={t.id} track={t} />
              ))}
            </ul>
          </section>
        </div>

        <aside className="min-w-0 space-y-10 lg:sticky lg:top-20 lg:self-start">
          {pros.length > top.length && (
            <section>
              <SectionLabel>Also in this lane</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {pros.slice(top.length).map(([a]) => (
                  <ArtistChip key={a.id} id={a.id} />
                ))}
              </div>
            </section>
          )}
          {scenes.length > 0 && (
            <section>
              <SectionLabel>Where it lives</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {scenes.map(([rid, n]) => (
                  <SceneChip key={rid} id={rid} suffix={n} />
                ))}
              </div>
            </section>
          )}
          {related.length > 0 && (
            <section>
              <SectionLabel>Often mixed with</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {related.map(([g, n]) => (
                  <GenreChip key={g} id={g} suffix={n} />
                ))}
              </div>
            </section>
          )}
          <p className="border-l-2 border-faint pl-3 text-sm text-muted">
            Genre tags are editorial: they describe the sound of each release, and most releases sit in more than one lane.
          </p>
        </aside>
      </div>
    </PageShell>
  )
}
