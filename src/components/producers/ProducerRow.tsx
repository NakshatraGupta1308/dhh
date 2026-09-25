import { motion } from 'motion/react'
import { useDhhData } from '../../hooks/useDhhData'
import { useSelectedArtist } from '../../hooks/useSelectedArtist'
import type { ProducerProfile } from '../../lib/artistStats'
import { distinctAliases } from '../../lib/hash'
import { formatReleaseDate } from '../../lib/indexDataset'
import { isLongForm, RELEASE_TYPE_LABEL } from '../../lib/labels'
import type { Track } from '../../types'
import { GeneratedCover } from '../common/GeneratedCover'

const EASE = [0.22, 1, 0.36, 1] as const

function HitRow({ track, tag }: { track: Track; tag: string }) {
  const data = useDhhData()
  const { open } = useSelectedArtist()
  const lead = data.artistById.get(track.artist_ids[0])
  const color = (lead && data.regionById.get(lead.region_id)?.color) ?? '#ff3b30'
  return (
    <li>
      <button
        type="button"
        onClick={() => open(track.artist_ids[0], { trackId: track.id })}
        className="group/hit flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-surface-2"
      >
        <GeneratedCover seed={track.id} label={track.title} color={color} size={44} long={isLongForm(track.type)} className="shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-lg uppercase leading-tight group-hover/hit:text-[var(--scene)]">{track.title}</span>
          <span className="block truncate text-xs text-muted">
            {track.artist_ids.map((id) => data.artistById.get(id)?.name).join(' & ')} / {RELEASE_TYPE_LABEL[track.type]}
          </span>
        </span>
        <span className="shrink-0 text-right font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted">
          <span className="block">{formatReleaseDate(track)}</span>
          <span className="block text-faint">{tag}</span>
        </span>
      </button>
    </li>
  )
}

export function ProducerRow({ profile, index }: { profile: ProducerProfile; index: number }) {
  const data = useDhhData()
  const { open } = useSelectedArtist()
  const { artist, productions, ownReleases, collaborators } = profile
  const region = data.regionById.get(artist.region_id)
  const color = region?.color ?? '#ff3b30'
  const aliases = distinctAliases(artist.name, artist.aliases)
  const hits = productions.slice(0, 6)
  const own = ownReleases.slice(0, Math.max(0, 6 - hits.length))

  return (
    <motion.article
      className="grid grid-cols-[minmax(0,1fr)] gap-8 border-t border-line py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-10"
      style={{ ['--scene' as string]: color }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <div>
        <div className="flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted">
          <span className="text-faint">{String(index + 1).padStart(2, '0')}</span>
          <span className="flex items-center gap-1.5" style={{ color }}>
            <span className="size-2 rounded-full" style={{ background: color }} />
            {region?.name}
          </span>
          <span>Since {artist.active_from}</span>
        </div>
        <h2 className="mt-3">
          <button
            type="button"
            onClick={() => open(artist.id)}
            className="break-words text-left font-display text-[clamp(2.6rem,6vw,5rem)] uppercase leading-[0.85] transition-colors hover:text-[var(--scene)]"
          >
            {artist.name}
          </button>
        </h2>
        {aliases.length > 0 && <p className="mt-2 text-sm text-muted">aka {aliases.join(', ')}</p>}
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/85">{artist.bio}</p>
        <div className="mt-6 flex gap-8">
          <div>
            <div className="font-display text-4xl leading-none" style={{ color }}>
              {productions.length}
            </div>
            <div className="kicker mt-1">Productions</div>
          </div>
          <div>
            <div className="font-display text-4xl leading-none">{collaborators.length}</div>
            <div className="kicker mt-1">Artists</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="kicker mb-3">Hits in the archive</h3>
        {hits.length + own.length === 0 ? (
          <p className="text-sm text-muted">No releases in the archive yet.</p>
        ) : (
          <ul className="space-y-1">
            {hits.map((t) => (
              <HitRow key={t.id} track={t} tag="Produced" />
            ))}
            {own.map((t) => (
              <HitRow key={t.id} track={t} tag="Own release" />
            ))}
          </ul>
        )}
        {productions.length > hits.length && (
          <button type="button" onClick={() => open(artist.id)} className="kicker mt-3 hover:text-ink">
            + {productions.length - hits.length} more in full profile
          </button>
        )}
      </div>

      <div>
        <h3 className="kicker mb-3">Worked with</h3>
        {collaborators.length === 0 ? (
          <p className="text-sm text-muted">No collaborators in the archive yet.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {collaborators.map(({ artist: other, shared }) => (
              <button
                key={other.id}
                type="button"
                onClick={() => open(other.id)}
                className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 transition-colors hover:border-ink"
              >
                <span className="size-2 rounded-full" style={{ background: data.regionById.get(other.region_id)?.color }} />
                <span className="font-display text-base uppercase leading-none">{other.name}</span>
                <span className="font-mono text-[0.6rem] text-muted">×{shared}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  )
}
