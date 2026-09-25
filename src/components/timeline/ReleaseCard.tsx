import { useDhhData } from '../../hooks/useDhhData'
import { useSelectedArtist } from '../../hooks/useSelectedArtist'
import { formatReleaseDate } from '../../lib/indexDataset'
import { isLongForm, RELEASE_TYPE_LABEL } from '../../lib/labels'
import type { Track } from '../../types'
import { GeneratedCover } from '../common/GeneratedCover'

interface Props {
  track: Track
  /** Compact is the horizontal desktop card, wide is the mobile list card. */
  variant?: 'compact' | 'wide'
}

export function useTrackScene(track: Track) {
  const data = useDhhData()
  const lead = data.artistById.get(track.artist_ids[0])
  const region = lead ? data.regionById.get(lead.region_id) : undefined
  return { lead, region, color: region?.color ?? '#ff3b30' }
}

export function ReleaseCard({ track, variant = 'compact' }: Props) {
  const data = useDhhData()
  const { open } = useSelectedArtist()
  const { region, color } = useTrackScene(track)
  const credits = data.creditsByTrack.get(track.id) ?? []
  const guests = credits
    .filter((c) => c.role !== 'main')
    .sort((a, b) => (a.role === b.role ? 0 : a.role === 'feature' ? -1 : 1))
  const long = isLongForm(track.type)
  const coverSize = variant === 'compact' ? 84 : 76

  return (
    <article
      className="group relative flex gap-3 rounded-[var(--radius-card)] border border-line bg-surface/90 p-3 backdrop-blur-sm transition-[border-color,transform,box-shadow] duration-300 ease-[var(--ease-snap)] hover:-translate-y-1 hover:border-[var(--scene)] hover:shadow-[0_18px_50px_-20px_var(--scene)]"
      style={{ ['--scene' as string]: color }}
    >
      <button
        type="button"
        onClick={() => open(track.artist_ids[0], { trackId: track.id })}
        className="shrink-0 overflow-hidden rounded-md"
        aria-label={`Open ${track.title}`}
      >
        {track.cover_art_url ? (
          <img src={track.cover_art_url} alt="" width={coverSize} height={coverSize} className="rounded-md object-cover" />
        ) : (
          <GeneratedCover
            seed={track.id}
            label={track.title}
            color={color}
            size={coverSize}
            long={long}
            className="transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full" style={{ background: color }} aria-hidden />
            {RELEASE_TYPE_LABEL[track.type]}
          </span>
          <span>{formatReleaseDate(track)}</span>
        </div>
        <h3
          className={`mt-1 truncate font-display uppercase leading-tight tracking-wide text-ink ${variant === 'compact' ? 'text-lg' : 'text-xl'}`}
          title={track.title}
        >
          {track.title}
        </h3>
        <p className="truncate text-sm text-ink/85">
          {track.artist_ids.map((id, i) => (
            <span key={id}>
              {i > 0 && <span className="text-muted"> & </span>}
              <button
                type="button"
                onClick={() => open(id, { trackId: track.id })}
                className="underline-offset-4 hover:text-[var(--scene)] hover:underline"
              >
                {data.artistById.get(id)?.name}
              </button>
            </span>
          ))}
        </p>
        {guests.length > 0 && (
          <p className="truncate text-xs text-muted">
            {guests.map((c, i) => (
              <span key={c.artist_id + c.role}>
                {i > 0 && ', '}
                {/* Only label the role when it changes, so it reads "feat. A, B, prod. C". */}
                {(i === 0 || guests[i - 1].role !== c.role) && (c.role === 'producer' ? 'prod. ' : 'feat. ')}
                <button
                  type="button"
                  onClick={() => open(c.artist_id, { trackId: track.id })}
                  className="underline-offset-4 hover:text-ink hover:underline"
                >
                  {data.artistById.get(c.artist_id)?.name}
                </button>
              </span>
            ))}
          </p>
        )}
        {variant === 'wide' && region && (
          <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.14em]" style={{ color }}>
            {region.name}
            {track.label_id && <span className="text-muted"> / {data.labelById.get(track.label_id)?.name}</span>}
          </p>
        )}
      </div>
    </article>
  )
}
