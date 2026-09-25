import type { ReactNode } from 'react'
import { useDhhData } from '../../hooks/useDhhData'
import { useView } from '../../hooks/useView'

const CHIP = 'inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 transition-colors hover:border-ink'

export function ArtistChip({ id, suffix }: { id: string; suffix?: ReactNode }) {
  const data = useDhhData()
  const { navigate } = useView()
  const artist = data.artistById.get(id)
  if (!artist) return null
  return (
    <button type="button" onClick={() => navigate('artist', { id })} className={CHIP}>
      <span className="size-2 rounded-full" style={{ background: data.regionById.get(artist.region_id)?.color }} />
      <span className="font-display text-base uppercase leading-none">{artist.name}</span>
      {suffix && <span className="font-mono text-[0.6rem] text-muted">{suffix}</span>}
    </button>
  )
}

export function GenreChip({ id, suffix }: { id: string; suffix?: ReactNode }) {
  const data = useDhhData()
  const { navigate } = useView()
  const genre = data.genreById.get(id)
  if (!genre) return null
  return (
    <button type="button" onClick={() => navigate('genre', { id })} className={CHIP}>
      <span className="size-2 rotate-45" style={{ background: genre.color }} />
      <span className="text-sm">{genre.name}</span>
      {suffix && <span className="font-mono text-[0.6rem] text-muted">{suffix}</span>}
    </button>
  )
}

export function SceneChip({ id, suffix }: { id: string; suffix?: ReactNode }) {
  const data = useDhhData()
  const { navigate } = useView()
  const region = data.regionById.get(id)
  if (!region) return null
  return (
    <button type="button" onClick={() => navigate('scene', { id })} className={CHIP}>
      <span className="size-2 rounded-full" style={{ background: region.color }} />
      <span className="text-sm">{region.name}</span>
      {suffix && <span className="font-mono text-[0.6rem] text-muted">{suffix}</span>}
    </button>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="kicker mb-4">{children}</h2>
}
