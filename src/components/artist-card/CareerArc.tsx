import { motion } from 'motion/react'
import { useMemo } from 'react'
import { releasesPerYear, type ArtistCredit } from '../../lib/artistStats'
import type { Artist } from '../../types'

interface Props {
  artist: Artist
  credits: ArtistCredit[]
  yearRange: [number, number]
  color: string
  highlightTrackId?: string | null
}

/**
 * A career at a glance: the active span as a band across the scene's full
 * history, with one mark per credit. Filled squares are lead releases,
 * rings are features, diamonds are production credits.
 */
export function CareerArc({ artist, credits, yearRange, color, highlightTrackId }: Props) {
  const [start, end] = yearRange
  const span = end - start + 1
  const W = 1000
  const H = 150
  const pad = 20
  const col = (W - pad * 2) / span
  const xOf = (year: number) => pad + (year - start) * col
  const perYear = useMemo(() => releasesPerYear(credits), [credits])
  const activeEnd = artist.active_to ?? end
  const base = H - 34

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${artist.name} career timeline`}>
      <motion.rect
        x={xOf(Math.max(start, artist.active_from))}
        y={base + 6}
        height={6}
        rx={3}
        fill={color}
        initial={{ width: 0 }}
        animate={{ width: Math.max(col, xOf(activeEnd + 1) - xOf(Math.max(start, artist.active_from))) }}
        transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />
      <line x1={pad} x2={W - pad} y1={base + 9} y2={base + 9} stroke="var(--color-line)" strokeWidth={1} />
      {Array.from({ length: span }, (_, i) => start + i).map((year) => (
        <g key={year}>
          {(year % 5 === 0 || year === start || year === end) && (
            <text x={xOf(year) + col / 2} y={H - 4} textAnchor="middle" fontSize="13" fill="var(--color-muted)" fontFamily="Space Mono, monospace">
              {`'${String(year).slice(2)}`}
            </text>
          )}
          {(perYear.get(year) ?? []).map((c, i) => {
            const cx = xOf(year) + col / 2
            const cy = base - 10 - i * 18
            const role = c.roles.includes('main') ? 'main' : c.roles.includes('feature') ? 'feature' : 'producer'
            const hl = c.track.id === highlightTrackId
            const delay = 0.5 + (year - start) * 0.03 + i * 0.05
            return (
              <motion.g
                key={c.track.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay, type: 'spring', stiffness: 300, damping: 18 }}
              >
                <title>{c.track.title}</title>
                {hl && <circle cx={cx} cy={cy} r={13} fill="none" stroke="var(--color-ink)" strokeWidth={2} />}
                {role === 'main' && <rect x={cx - 7} y={cy - 7} width={14} height={14} rx={2} fill={color} />}
                {role === 'feature' && <circle cx={cx} cy={cy} r={6.5} fill="none" stroke={color} strokeWidth={3} />}
                {role === 'producer' && <rect x={cx - 6} y={cy - 6} width={12} height={12} fill="var(--color-ink)" transform={`rotate(45 ${cx} ${cy})`} />}
              </motion.g>
            )
          })}
        </g>
      ))}
    </svg>
  )
}
