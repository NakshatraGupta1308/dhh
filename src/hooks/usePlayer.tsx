import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { ListeningSong } from '../types'
import { useDhhData } from './useDhhData'

interface PlayerApi {
  current: ListeningSong | null
  /** Song ids in play order. */
  queue: string[]
  index: number
  isPlaying: boolean
  shuffle: boolean
  /** Songs YouTube refused to embed; they are skipped from then on. */
  unavailable: Set<string>
  play: (songId: string, queue?: string[]) => void
  toggle: () => void
  next: () => void
  prev: () => void
  toggleShuffle: () => void
  close: () => void
  /** Called by the dock when the embedded player changes state. */
  setPlaying: (playing: boolean) => void
  markUnavailable: (songId: string) => void
}

const PlayerContext = createContext<PlayerApi | null>(null)

function shuffled<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const data = useDhhData()
  const songById = useMemo(() => new Map(data.listening.songs.map((s) => [s.id, s])), [data.listening.songs])
  const [baseQueue, setBaseQueue] = useState<string[]>([])
  const [queue, setQueue] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [isPlaying, setPlaying] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set())

  const current = queue.length ? songById.get(queue[index]) ?? null : null

  const play = useCallback(
    (songId: string, list?: string[]) => {
      if (current?.id === songId && !list) {
        setPlaying((p) => !p)
        return
      }
      const base = list && list.includes(songId) ? list : [songId]
      setBaseQueue(base)
      // With shuffle on, the chosen song plays first and the rest are shuffled after it.
      const order = shuffle ? [songId, ...shuffled(base.filter((id) => id !== songId))] : base
      setQueue(order)
      setIndex(order.indexOf(songId))
      setPlaying(true)
    },
    [current, shuffle],
  )

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!queue.length) return
      for (let i = 1; i <= queue.length; i++) {
        const candidate = (index + dir * i + queue.length) % queue.length
        if (!unavailable.has(queue[candidate])) {
          setIndex(candidate)
          setPlaying(true)
          return
        }
      }
      setPlaying(false)
    },
    [queue, index, unavailable],
  )

  const toggleShuffle = useCallback(() => {
    const next = !shuffle
    setShuffle(next)
    if (current) {
      const order = next ? [current.id, ...shuffled(baseQueue.filter((id) => id !== current.id))] : baseQueue
      setQueue(order)
      setIndex(Math.max(0, order.indexOf(current.id)))
    }
  }, [shuffle, current, baseQueue])

  const api = useMemo<PlayerApi>(
    () => ({
      current,
      queue,
      index,
      isPlaying,
      shuffle,
      unavailable,
      play,
      toggle: () => setPlaying((p) => !p),
      next: () => step(1),
      prev: () => step(-1),
      toggleShuffle,
      close: () => {
        setPlaying(false)
        setQueue([])
        setIndex(0)
      },
      setPlaying,
      markUnavailable: (id: string) => setUnavailable((s) => new Set(s).add(id)),
    }),
    [current, queue, index, isPlaying, shuffle, unavailable, play, step, toggleShuffle],
  )

  return <PlayerContext.Provider value={api}>{children}</PlayerContext.Provider>
}

export function usePlayer(): PlayerApi {
  const api = useContext(PlayerContext)
  if (!api) throw new Error('usePlayer must be used inside <PlayerProvider>')
  return api
}
