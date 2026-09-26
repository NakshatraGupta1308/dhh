import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { GeneratedCover } from '../components/common/GeneratedCover'
import { PageShell } from '../components/layout/PageShell'
import { BeatBars } from '../components/producers/BeatBars'
import { useDhhData } from '../hooks/useDhhData'
import { usePlayer } from '../hooks/usePlayer'
import { useView } from '../hooks/useView'
import { thumbnail, watchUrl } from '../lib/youtube'
import type { ListeningSong } from '../types'

const EASE = [0.22, 1, 0.36, 1] as const

function Playing() {
  return (
    <span className="flex h-4 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-sm bg-[var(--scene)]"
          animate={{ height: ['30%', '100%', '45%', '80%', '30%'] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  )
}

function SongRow({ song, index, list }: { song: ListeningSong; index: number; list: string[] }) {
  const data = useDhhData()
  const { navigate } = useView()
  const { current, isPlaying, play, unavailable } = usePlayer()
  const lead = data.artistById.get(song.artist_ids[0])
  const color = (lead && data.regionById.get(lead.region_id)?.color) ?? '#ff3b30'
  const active = current?.id === song.id
  const dead = unavailable.has(song.id)
  const release = song.track_id ? data.trackById.get(song.track_id) : undefined
  const artistLinks = (ids: string[]) =>
    ids.map((id, i) => (
      <span key={id}>
        {i > 0 && ', '}
        <button type="button" onClick={() => navigate('artist', { id })} className="hover:text-ink hover:underline">
          {data.artistById.get(id)?.name}
        </button>
      </span>
    ))

  return (
    <motion.li
      className={`group flex items-center gap-3 rounded-[var(--radius-card)] border p-2 pr-3 transition-colors sm:gap-4 ${
        active ? 'border-[var(--scene)] bg-surface-2' : 'border-transparent hover:border-line hover:bg-surface'
      } ${dead ? 'opacity-50' : ''}`}
      style={{ ['--scene' as string]: color }}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.03 }}
    >
      <span className="hidden w-6 text-right font-mono text-xs text-faint sm:block">{active && isPlaying ? <Playing /> : String(index + 1).padStart(2, '0')}</span>
      <button
        type="button"
        onClick={() => !dead && play(song.id, list)}
        disabled={dead}
        className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-surface-2 sm:w-32"
        aria-label={active && isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
      >
        <img src={thumbnail(song.youtube_id)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className={`absolute inset-0 grid place-items-center bg-black/40 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <span className="grid size-9 place-items-center rounded-full text-bg" style={{ background: color }}>
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
              <path d={active && isPlaying ? 'M7 5h4v14H7zM13 5h4v14h-4z' : 'M7 5v14l12-7z'} />
            </svg>
          </span>
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={() => !dead && play(song.id, list)} className="block max-w-full truncate text-left font-display text-xl uppercase leading-tight hover:text-[var(--scene)] sm:text-2xl">
          {song.title}
        </button>
        <div className="truncate text-sm text-muted">
          {artistLinks(song.artist_ids)}
          {song.feat_ids.length > 0 && <span className="text-faint"> feat. </span>}
          {artistLinks(song.feat_ids)}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-faint">
          {song.year && <span>{song.year}</span>}
          {release && release.title !== song.title && (
            <button type="button" onClick={() => navigate('artist', { id: release.artist_ids[0], release: release.id })} className="hover:text-ink">
              From {release.title}
            </button>
          )}
          {song.note && <span className="normal-case tracking-normal">{song.note}</span>}
          {dead && (
            <a href={watchUrl(song.youtube_id)} target="_blank" rel="noreferrer" className="text-accent">
              Unavailable here, open on YouTube ↗
            </a>
          )}
        </div>
      </div>
    </motion.li>
  )
}

export function ListenPage() {
  const data = useDhhData()
  const { play, shuffle, toggleShuffle } = usePlayer()
  const [artistId, setArtistId] = useState<string | null>(null)
  const { artists: featured, songs } = data.listening

  const byArtist = useMemo(() => {
    const m = new Map<string, ListeningSong[]>()
    for (const id of featured) m.set(id, songs.filter((s) => s.artist_ids.includes(id) || s.feat_ids.includes(id)))
    return m
  }, [featured, songs])

  // "Everyone" follows the rail order: each featured artist's own songs in turn.
  const everyone = useMemo(() => {
    const rank = (s: ListeningSong) => Math.min(...s.artist_ids.map((id) => (featured.includes(id) ? featured.indexOf(id) : Infinity)))
    return songs.filter((s) => Number.isFinite(rank(s))).sort((a, b) => rank(a) - rank(b))
  }, [songs, featured])
  const list = artistId ? byArtist.get(artistId) ?? [] : everyone
  const ids = list.map((s) => s.id)
  const colors = featured.map((id) => data.regionById.get(data.artistById.get(id)?.region_id ?? '')?.color ?? '#ff3b30')

  const playAll = (shuffled: boolean) => {
    if (!ids.length) return
    if (shuffled !== shuffle) toggleShuffle()
    const first = shuffled ? ids[Math.floor(Math.random() * ids.length)] : ids[0]
    play(first, ids)
  }

  return (
    <PageShell>
      <section className="relative overflow-hidden pt-24">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] opacity-15 [mask-image:linear-gradient(to_top,black_40%,transparent)]">
          <BeatBars colors={colors} bars={56} />
        </div>
        <div className="relative mx-auto max-w-[1600px] px-4 pb-12 sm:px-8">
          <motion.p className="kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="text-accent">●</span> Press play
          </motion.p>
          <h1 className="mt-3 font-display text-[clamp(4.5rem,20vw,16rem)] uppercase leading-[0.82]" aria-label="Listen">
            <span className="flex overflow-hidden" aria-hidden>
              <motion.span initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}>
                Listen
              </motion.span>
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            The listening room. Hand-picked records from {featured.length} artists, played right here while you keep exploring.{' '}
            <span className="text-ink">The player follows you across the whole site.</span>
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => playAll(false)} className="rounded-full bg-accent px-6 py-3 font-mono text-xs uppercase tracking-[0.16em] text-bg transition-transform hover:-translate-y-0.5">
              ▶ Play {artistId ? data.artistById.get(artistId)?.name : 'all'}
            </button>
            <button type="button" onClick={() => playAll(true)} className="rounded-full border border-line px-6 py-3 font-mono text-xs uppercase tracking-[0.16em] transition-colors hover:border-ink">
              Shuffle
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 pb-24 sm:px-8">
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <button
            type="button"
            onClick={() => setArtistId(null)}
            className={`flex w-28 shrink-0 flex-col items-center gap-2 rounded-[var(--radius-card)] border p-3 transition-colors ${!artistId ? 'border-ink bg-surface-2' : 'border-line hover:border-muted'}`}
          >
            <span className="grid size-16 place-items-center rounded-full bg-accent font-display text-2xl text-bg">ALL</span>
            <span className="font-display text-base uppercase leading-none">Everyone</span>
            <span className="kicker">{songs.length} songs</span>
          </button>
          {featured.map((id) => {
            const a = data.artistById.get(id)!
            const color = data.regionById.get(a.region_id)?.color ?? '#ff3b30'
            const on = artistId === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setArtistId(on ? null : id)}
                className="flex w-28 shrink-0 flex-col items-center gap-2 rounded-[var(--radius-card)] border p-3 text-center transition-colors"
                style={{ borderColor: on ? color : 'var(--color-line)', background: on ? 'var(--color-surface-2)' : undefined }}
                aria-pressed={on}
              >
                <GeneratedCover seed={a.id} label={a.name} color={color} size={64} className="rounded-full" />
                <span className="w-full truncate font-display text-base uppercase leading-none">{a.name}</span>
                <span className="kicker">{byArtist.get(id)?.length} songs</span>
              </button>
            )
          })}
        </div>

        <ul className="mt-6 space-y-1">
          {list.map((s, i) => (
            <SongRow key={s.id} song={s} index={i} list={ids} />
          ))}
        </ul>
        <p className="mt-10 max-w-xl text-xs text-faint">
          Songs stream from YouTube through the official embedded player, so every play counts for the artist. If a video cannot be embedded, it is skipped and
          linked instead.
        </p>
      </section>
    </PageShell>
  )
}
