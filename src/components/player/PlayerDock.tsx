import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useDhhData } from '../../hooks/useDhhData'
import { usePlayer } from '../../hooks/usePlayer'
import { useView } from '../../hooks/useView'
import { formatTime, loadYouTubeApi, watchUrl, YT_STATE, type YTPlayer } from '../../lib/youtube'

const ICON = 'size-5'

function Icon({ name }: { name: 'play' | 'pause' | 'next' | 'prev' | 'shuffle' | 'close' | 'expand' }) {
  const paths: Record<string, string> = {
    play: 'M7 5v14l12-7z',
    pause: 'M7 5h4v14H7zM13 5h4v14h-4z',
    next: 'M6 5l9 7-9 7zM16 5h2v14h-2z',
    prev: 'M18 5l-9 7 9 7zM6 5h2v14H6z',
    shuffle: 'M4 7h3l10 10h3M17 4l3 3-3 3M4 17h3l3-3M14 10l3-3h3M17 14l3 3-3 3',
    close: 'M6 6l12 12M18 6L6 18',
    expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  }
  const filled = name === 'play' || name === 'pause' || name === 'next' || name === 'prev'
  return (
    <svg viewBox="0 0 24 24" className={ICON} fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name]} />
    </svg>
  )
}

/** Persistent bottom player. The YouTube embed lives here so playback survives page changes. */
export function PlayerDock() {
  const data = useDhhData()
  const { navigate } = useView()
  const { current, queue, index, isPlaying, shuffle, toggle, next, prev, toggleShuffle, close, setPlaying, markUnavailable } = usePlayer()
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const readyRef = useRef(false)
  const [time, setTime] = useState({ now: 0, total: 0 })
  const [big, setBig] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Keep latest callbacks for the player's event handlers without recreating it.
  const handlers = useRef({ next, setPlaying, markUnavailable, currentId: current?.id })
  handlers.current = { next, setPlaying, markUnavailable, currentId: current?.id }

  const videoId = current?.youtube_id

  // Create the player the first time a song is chosen, then reuse it.
  useEffect(() => {
    if (!videoId) return
    if (playerRef.current) {
      if (readyRef.current) playerRef.current.loadVideoById(videoId)
      return
    }
    let cancelled = false
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !hostRef.current) return
        const mount = document.createElement('div')
        hostRef.current.appendChild(mount)
        playerRef.current = new YT.Player(mount, {
          host: 'https://www.youtube-nocookie.com',
          videoId,
          width: '100%',
          height: '100%',
          playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
          events: {
            onReady: (e) => {
              readyRef.current = true
              e.target.playVideo()
            },
            onStateChange: (e) => {
              if (e.data === YT_STATE.PLAYING) {
                setError(null)
                handlers.current.setPlaying(true)
              } else if (e.data === YT_STATE.PAUSED) handlers.current.setPlaying(false)
              else if (e.data === YT_STATE.ENDED) handlers.current.next()
            },
            onError: () => {
              const id = handlers.current.currentId
              if (id) handlers.current.markUnavailable(id)
              setError('This video cannot be played here. Skipping.')
              setTimeout(() => handlers.current.next(), 1200)
            },
          },
        })
      })
      .catch(() => setError('Could not load the YouTube player.'))
    return () => {
      cancelled = true
    }
  }, [videoId])

  // Mirror play and pause from our controls into the embed.
  useEffect(() => {
    const p = playerRef.current
    if (!p || !readyRef.current) return
    const state = p.getPlayerState()
    if (isPlaying && state !== YT_STATE.PLAYING && state !== YT_STATE.BUFFERING) p.playVideo()
    if (!isPlaying && state === YT_STATE.PLAYING) p.pauseVideo()
  }, [isPlaying])

  useEffect(() => {
    if (!current) return
    const t = setInterval(() => {
      const p = playerRef.current
      if (p && readyRef.current) setTime({ now: p.getCurrentTime() || 0, total: p.getDuration() || 0 })
    }, 500)
    return () => clearInterval(t)
  }, [current])

  // Leave room at the bottom of the page so the dock never covers content.
  useEffect(() => {
    document.body.style.paddingBottom = current ? '96px' : ''
    return () => {
      document.body.style.paddingBottom = ''
    }
  }, [current])

  // Stop the video when the dock closes, keep the player for next time.
  useEffect(() => {
    if (!current && playerRef.current && readyRef.current) playerRef.current.pauseVideo()
  }, [current])

  const upNext = queue.length > 1 ? data.listening.songs.find((s) => s.id === queue[(index + 1) % queue.length]) : undefined
  const names = (ids: string[]) =>
    ids.map((id, i) => (
      <span key={id}>
        {i > 0 && ', '}
        <button type="button" onClick={() => navigate('artist', { id })} className="hover:text-ink hover:underline">
          {data.artistById.get(id)?.name}
        </button>
      </span>
    ))
  const lead = current ? data.artistById.get(current.artist_ids[0]) : undefined
  const color = (lead && data.regionById.get(lead.region_id)?.color) ?? '#ff3b30'
  const progress = time.total ? (time.now / time.total) * 100 : 0

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const p = playerRef.current
    if (p && time.total) p.seekTo(((e.clientX - rect.left) / rect.width) * time.total, true)
  }

  return (
    // Always mounted so the YouTube embed survives closing and reopening; it just slides away.
    <motion.div
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-bg/95 backdrop-blur-md"
      style={{ ['--scene' as string]: color }}
      initial={false}
      animate={{ y: current ? 0 : '110%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      role="region"
      aria-label="Now playing"
      aria-hidden={!current}
    >
          <div className="group h-1.5 cursor-pointer bg-line" onClick={seek} role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={Math.round(time.total)} aria-valuenow={Math.round(time.now)} tabIndex={-1}>
            <div className="h-full transition-[width] duration-500 ease-linear" style={{ width: `${progress}%`, background: color }} />
          </div>
          <div className="mx-auto flex h-[88px] max-w-[1600px] items-center gap-3 px-3 sm:gap-5 sm:px-8">
            <div
              className={`shrink-0 overflow-hidden rounded-md bg-black transition-all duration-300 ${
                big && current ? 'fixed bottom-[100px] right-3 z-[61] aspect-video w-[min(560px,calc(100vw-24px))] shadow-2xl shadow-black/70 sm:right-8' : 'relative h-[54px] w-24 sm:h-[68px] sm:w-[120px]'
              }`}
            >
              <div ref={hostRef} className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full" />
            </div>

            {current && (
            <>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-lg uppercase leading-tight sm:text-2xl">{current.title}</div>
              <div className="truncate text-xs text-muted sm:text-sm">
                {names(current.artist_ids)}
                {current.feat_ids.length > 0 && <span className="text-faint"> feat. </span>}
                {names(current.feat_ids)}
              </div>
              <div className="mt-0.5 hidden truncate font-mono text-[0.6rem] uppercase tracking-[0.14em] text-faint sm:block">
                {error ?? (upNext ? `Up next: ${upNext.title}` : `${formatTime(time.now)} / ${formatTime(time.total)}`)}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <button type="button" onClick={toggleShuffle} aria-pressed={shuffle} aria-label="Shuffle" className={`hidden rounded-full p-2 sm:block ${shuffle ? 'text-[var(--scene)]' : 'text-muted hover:text-ink'}`}>
                <Icon name="shuffle" />
              </button>
              <button type="button" onClick={prev} aria-label="Previous" className="rounded-full p-2 text-muted hover:text-ink">
                <Icon name="prev" />
              </button>
              <button type="button" onClick={toggle} aria-label={isPlaying ? 'Pause' : 'Play'} className="grid size-11 place-items-center rounded-full text-bg transition-transform hover:scale-105" style={{ background: color }}>
                <Icon name={isPlaying ? 'pause' : 'play'} />
              </button>
              <button type="button" onClick={next} aria-label="Next" className="rounded-full p-2 text-muted hover:text-ink">
                <Icon name="next" />
              </button>
              <span className="hidden w-24 text-center font-mono text-[0.65rem] tabular-nums text-muted lg:block">
                {formatTime(time.now)} / {formatTime(time.total)}
              </span>
              <button type="button" onClick={() => setBig((b) => !b)} aria-pressed={big} aria-label="Toggle video size" className="hidden rounded-full p-2 text-muted hover:text-ink sm:block">
                <Icon name="expand" />
              </button>
              <a href={watchUrl(current.youtube_id)} target="_blank" rel="noreferrer" className="kicker hidden px-1 hover:text-ink md:block">
                YouTube ↗
              </a>
              <button type="button" onClick={() => { setBig(false); close() }} aria-label="Close player" className="rounded-full p-2 text-muted hover:text-ink">
                <Icon name="close" />
              </button>
            </div>
            </>
            )}
          </div>
          <span className="sr-only" aria-live="polite">
            {current ? (isPlaying ? `Playing ${current.title}` : 'Paused') : ''}
          </span>
    </motion.div>
  )
}
