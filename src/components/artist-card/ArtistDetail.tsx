import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import { useDhhData } from '../../hooks/useDhhData'
import { useSelectedArtist } from '../../hooks/useSelectedArtist'
import { artistCredits, collaborators } from '../../lib/artistStats'
import { formatReleaseDate, trackYear } from '../../lib/indexDataset'
import { isLongForm, listenLinks, RELEASE_TYPE_LABEL, ROLE_LABEL } from '../../lib/labels'
import type { Artist } from '../../types'
import { GeneratedCover } from '../common/GeneratedCover'
import { CareerArc } from './CareerArc'

const EASE = [0.22, 1, 0.36, 1] as const
const KIND_LABEL: Record<Artist['kind'], string> = { rapper: 'Rapper', group: 'Group', producer: 'Producer', singer: 'Singer' }

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <div className="font-display text-4xl leading-none">{value}</div>
      <div className="kicker mt-1">{label}</div>
    </div>
  )
}

function ArtistBody({ artist }: { artist: Artist }) {
  const data = useDhhData()
  const { open, trackId } = useSelectedArtist()
  const region = data.regionById.get(artist.region_id)
  const color = region?.color ?? '#ff3b30'
  const credits = useMemo(() => artistCredits(data, artist.id), [data, artist.id])
  const collabs = useMemo(() => collaborators(data, artist.id), [data, artist.id])
  const lead = credits.filter((c) => c.roles.includes('main')).length
  const guest = credits.filter((c) => c.roles.includes('feature')).length
  const produced = credits.filter((c) => c.roles.includes('producer')).length
  const highlightRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    const t = setTimeout(() => highlightRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 700)
    return () => clearTimeout(t)
  }, [artist.id, trackId])

  const years = [...new Set(credits.map((c) => trackYear(c.track)))]

  return (
    <>
      <header className="relative overflow-hidden px-6 pb-8 pt-16 sm:px-10" style={{ background: `linear-gradient(160deg, ${color}33, transparent 60%)` }}>
        <motion.p className="kicker flex flex-wrap gap-x-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <span style={{ color }}>● {region?.name}</span>
          <span>{KIND_LABEL[artist.kind]}</span>
          <span>
            {artist.active_from} to {artist.active_to ?? 'now'}
          </span>
        </motion.p>
        <h2 className="mt-3 overflow-hidden font-display text-[clamp(3.2rem,11vw,8rem)] uppercase leading-[0.85]">
          <motion.span className="block" initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}>
            {artist.name}
          </motion.span>
        </h2>
        {artist.aliases.length > 0 && <p className="mt-3 text-sm text-muted">Also known as {artist.aliases.join(', ')}</p>}
        <motion.div
          className="mt-8 grid grid-cols-4 gap-4 border-t border-line pt-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: EASE }}
        >
          <Stat value={lead} label="Lead" />
          <Stat value={guest} label="Features" />
          <Stat value={produced} label="Produced" />
          <Stat value={collabs.length} label="Collaborators" />
        </motion.div>
      </header>

      <div className="space-y-12 px-6 pb-16 sm:px-10">
        <motion.p className="max-w-2xl text-lg leading-relaxed text-ink/90" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
          {artist.bio}
        </motion.p>

        <section>
          <h3 className="kicker mb-3">Career arc</h3>
          <div className="rounded-[var(--radius-card)] border border-line bg-bg/60 p-3">
            <CareerArc artist={artist} credits={credits} yearRange={data.yearRange} color={color} highlightTrackId={trackId} />
            <div className="mt-2 flex flex-wrap gap-4 px-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[2px]" style={{ background: color }} /> Lead
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full border-2" style={{ borderColor: color }} /> Feature
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rotate-45 bg-ink" /> Producer
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-4 rounded-full" style={{ background: color }} /> Active years
              </span>
            </div>
          </div>
        </section>

        <section>
          <h3 className="kicker mb-4">Catalog in this archive</h3>
          <div className="space-y-8">
            {years.map((year) => (
              <div key={year} className="grid gap-3 sm:grid-cols-[88px_1fr]">
                <div className="font-display text-3xl leading-none text-muted">{year}</div>
                <ul className="space-y-2">
                  {credits
                    .filter((c) => trackYear(c.track) === year)
                    .map(({ track, roles }) => {
                      const hl = track.id === trackId
                      const names = track.artist_ids.map((id) => data.artistById.get(id)?.name ?? id)
                      const links = listenLinks(track.title, names, track.external_links, isLongForm(track.type))
                      const others = (data.creditsByTrack.get(track.id) ?? []).filter((c) => c.artist_id !== artist.id)
                      const label = track.label_id ? data.labelById.get(track.label_id) : undefined
                      return (
                        <li
                          key={track.id}
                          ref={hl ? highlightRef : undefined}
                          className={`flex gap-4 rounded-[var(--radius-card)] border p-3 transition-colors ${hl ? 'border-ink bg-surface-2' : 'border-line bg-surface'}`}
                        >
                          <GeneratedCover seed={track.id} label={track.title} color={color} size={64} long={isLongForm(track.type)} className="shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                              <span>{RELEASE_TYPE_LABEL[track.type]}</span>
                              <span>{formatReleaseDate(track)}</span>
                              {roles.map((r) => (
                                <span key={r} className="rounded-full px-2 py-0.5 text-bg" style={{ background: r === 'main' ? color : 'var(--color-ink)' }}>
                                  {ROLE_LABEL[r]}
                                </span>
                              ))}
                              {track.confidence === 'low' && (
                                <span className="text-faint" title="Details for this entry are still being verified">
                                  Unverified
                                </span>
                              )}
                            </div>
                            <div className="mt-1 font-display text-2xl uppercase leading-tight">{track.title}</div>
                            {track.album_or_ep && <div className="text-sm text-muted">From {track.album_or_ep}</div>}
                            {others.length > 0 && (
                              <div className="mt-1 text-sm text-muted">
                                With{' '}
                                {others.map((o, i) => (
                                  <span key={o.artist_id + o.role}>
                                    {i > 0 && ', '}
                                    <button type="button" className="text-ink underline-offset-4 hover:underline" onClick={() => open(o.artist_id, { trackId: track.id })}>
                                      {data.artistById.get(o.artist_id)?.name}
                                    </button>
                                    <span className="text-faint"> ({ROLE_LABEL[o.role].toLowerCase()})</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            {track.note && <div className="mt-1 text-sm text-muted">{track.note}</div>}
                            <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[0.62rem] uppercase tracking-[0.14em]">
                              {label && <span className="text-muted">{label.name}</span>}
                              <a href={links.youtube} target="_blank" rel="noreferrer" className="text-ink hover:text-[var(--scene)]">
                                YouTube ↗
                              </a>
                              <a href={links.spotify} target="_blank" rel="noreferrer" className="text-ink hover:text-[var(--scene)]">
                                Spotify ↗
                              </a>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {collabs.length > 0 && (
          <section>
            <h3 className="kicker mb-3">Connected to</h3>
            <div className="flex flex-wrap gap-2">
              {collabs.map(({ artist: other, shared }) => {
                const c = data.regionById.get(other.region_id)?.color
                return (
                  <button
                    key={other.id}
                    type="button"
                    onClick={() => open(other.id)}
                    className="flex items-center gap-2 rounded-full border border-line px-4 py-2 transition-colors hover:border-ink"
                  >
                    <span className="size-2 rounded-full" style={{ background: c }} />
                    <span className="font-display text-lg uppercase leading-none">{other.name}</span>
                    <span className="font-mono text-[0.62rem] text-muted">×{shared}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {artist.label_ids.length > 0 && (
          <section>
            <h3 className="kicker mb-3">Labels and crews</h3>
            <ul className="flex flex-wrap gap-2">
              {artist.label_ids.map((id) => {
                const l = data.labelById.get(id)
                if (!l) return null
                return (
                  <li key={id} className="rounded-[var(--radius-card)] border border-line px-4 py-3">
                    <div className="font-display text-lg uppercase leading-none">{l.name}</div>
                    <div className="kicker mt-1">
                      {l.kind}
                      {l.founded_year ? ` / est. ${l.founded_year}` : ''}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {artist.confidence !== 'high' && (
          <p className="border-l-2 border-faint pl-3 text-sm text-muted">
            Some details on this artist are still being verified against primary sources.
          </p>
        )}
      </div>
    </>
  )
}

/** Full artist view. Expands out of the roster card when opened from there, slides in otherwise. */
export function ArtistDetail() {
  const data = useDhhData()
  const { artistId, origin, close } = useSelectedArtist()
  const artist = artistId ? data.artistById.get(artistId) : undefined
  const scrollRef = useRef<HTMLDivElement>(null)
  const shared = origin === 'roster'

  useEffect(() => {
    if (!artist) return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [artist, close])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [artistId])

  const color = artist ? data.regionById.get(artist.region_id)?.color : undefined

  return (
    <AnimatePresence>
      {artist && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={artist.name}>
          <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.div
            layoutId={shared ? `artist-card-${artist.id}` : undefined}
            className="relative h-full w-full overflow-hidden border-l border-line bg-surface lg:w-[min(920px,72vw)]"
            style={{ ['--scene' as string]: color, borderRadius: 0 }}
            initial={shared ? undefined : { x: '100%' }}
            animate={shared ? undefined : { x: 0 }}
            exit={shared ? { opacity: 0 } : { x: '100%' }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full border border-line bg-bg/80 text-xl backdrop-blur transition-transform hover:rotate-90"
              aria-label="Close artist view"
            >
              ×
            </button>
            <div ref={scrollRef} className="h-full overflow-y-auto overscroll-contain">
              <ArtistBody key={artist.id} artist={artist} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
