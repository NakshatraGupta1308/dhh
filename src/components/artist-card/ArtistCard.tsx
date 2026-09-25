import { motion } from 'motion/react'
import { useDhhData } from '../../hooks/useDhhData'
import { useSelectedArtist } from '../../hooks/useSelectedArtist'
import type { Artist } from '../../types'
import { GeneratedCover } from '../common/GeneratedCover'

export function ArtistCard({ artist, index }: { artist: Artist; index: number }) {
  const data = useDhhData()
  const { open, artistId } = useSelectedArtist()
  const region = data.regionById.get(artist.region_id)
  const color = region?.color ?? '#ff3b30'
  const releases = (data.creditsByArtist.get(artist.id) ?? []).length
  const isOpen = artistId === artist.id

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.button
        type="button"
        layoutId={`artist-card-${artist.id}`}
        onClick={() => open(artist.id, { origin: 'roster' })}
        className="group relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface p-4 text-left"
        style={{ ['--scene' as string]: color, visibility: isOpen ? 'hidden' : 'visible' }}
        whileHover="hover"
        whileTap={{ scale: 0.98 }}
      >
        {/* Colour flood on hover. */}
        <motion.span
          aria-hidden
          className="absolute inset-0 origin-bottom"
          style={{ background: color }}
          initial={{ scaleY: 0 }}
          variants={{ hover: { scaleY: 1 } }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="relative flex items-start justify-between">
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted transition-colors group-hover:text-bg">
            {region?.name}
          </span>
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted transition-colors group-hover:text-bg">
            {artist.active_from}
          </span>
        </div>
        <div className="relative mx-auto opacity-90 transition-opacity group-hover:opacity-0">
          {artist.image_url ? (
            <img src={artist.image_url} alt="" className="size-28 rounded-full object-cover" />
          ) : (
            <GeneratedCover seed={artist.id} label={artist.name} color={color} size={112} className="rounded-full" showInitials={false} />
          )}
        </div>
        <div className="relative">
          <div className="font-display text-3xl uppercase leading-[0.9] transition-colors group-hover:text-bg sm:text-4xl">{artist.name}</div>
          <div className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted transition-colors group-hover:text-bg/70">
            {artist.kind} / {releases} credit{releases === 1 ? '' : 's'}
          </div>
        </div>
      </motion.button>
    </motion.div>
  )
}
