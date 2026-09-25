import { forwardRef } from 'react'
import { useDhhData } from '../../hooks/useDhhData'
import { useView } from '../../hooks/useView'
import { formatReleaseDate } from '../../lib/indexDataset'
import { isLongForm, listenLinks, RELEASE_TYPE_LABEL, ROLE_LABEL } from '../../lib/labels'
import type { CreditRole, Track } from '../../types'
import { GeneratedCover } from './GeneratedCover'

interface Props {
  track: Track
  /** Roles held by the artist whose page this row sits on. */
  roles?: CreditRole[]
  /** Hide this artist from the "with" line (it is their own page). */
  selfId?: string
  highlight?: boolean
}

/** A release in a list: artwork, credits (all clickable), notes, genres and listening links. */
export const ReleaseRow = forwardRef<HTMLLIElement, Props>(function ReleaseRow({ track, roles, selfId, highlight }, ref) {
  const data = useDhhData()
  const { navigate } = useView()
  const lead = data.artistById.get(track.artist_ids[0])
  const color = (lead && data.regionById.get(lead.region_id)?.color) ?? '#ff3b30'
  const names = track.artist_ids.map((id) => data.artistById.get(id)?.name ?? id)
  const links = listenLinks(track.title, names, track.external_links, isLongForm(track.type))
  const credits = (data.creditsByTrack.get(track.id) ?? []).filter((c) => c.artist_id !== selfId)
  const label = track.label_id ? data.labelById.get(track.label_id) : undefined
  const goArtist = (id: string) => navigate('artist', { id, release: track.id })

  return (
    <li
      ref={ref}
      className={`flex gap-4 rounded-[var(--radius-card)] border p-3 transition-colors ${highlight ? 'border-ink bg-surface-2' : 'border-line bg-surface'}`}
      style={{ ['--scene' as string]: color }}
    >
      <GeneratedCover seed={track.id} label={track.title} color={color} size={64} long={isLongForm(track.type)} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
          <span>{RELEASE_TYPE_LABEL[track.type]}</span>
          <span>{formatReleaseDate(track)}</span>
          {roles?.map((r) => (
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
        {credits.length > 0 && (
          <div className="mt-1 text-sm text-muted">
            {selfId ? 'With ' : ''}
            {credits.map((c, i) => (
              <span key={c.artist_id + c.role}>
                {i > 0 && ', '}
                <button type="button" className="text-ink underline-offset-4 hover:underline" onClick={() => goArtist(c.artist_id)}>
                  {data.artistById.get(c.artist_id)?.name}
                </button>
                {c.role !== 'main' && <span className="text-faint"> ({ROLE_LABEL[c.role].toLowerCase()})</span>}
              </span>
            ))}
          </div>
        )}
        {track.album_or_ep && <div className="text-sm text-muted">From {track.album_or_ep}</div>}
        {track.note && <div className="mt-1 text-sm text-muted">{track.note}</div>}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.62rem] uppercase tracking-[0.14em]">
          {track.genres.map((g) => {
            const genre = data.genreById.get(g)
            return (
              genre && (
                <button key={g} type="button" onClick={() => navigate('genre', { id: g })} className="flex items-center gap-1 text-muted hover:text-ink">
                  <span className="size-1.5 rotate-45" style={{ background: genre.color }} />
                  {genre.name}
                </button>
              )
            )
          })}
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
})
