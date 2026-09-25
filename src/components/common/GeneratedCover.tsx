import { hash } from '../../lib/hash'

interface Props {
  seed: string
  label: string
  color: string
  size?: number
  className?: string
  /** Albums, EPs and mixtapes get a record-sleeve treatment. */
  long?: boolean
}

/**
 * Deterministic typographic artwork. Used wherever real cover art or press
 * photos are not available, so the UI never shows an empty grey box.
 */
export function GeneratedCover({ seed, label, color, size = 96, className, long }: Props) {
  const h = hash(seed)
  const variant = h % 4
  const rot = (h >> 3) % 360
  const id = `c${h.toString(36)}`

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Artwork for ${label}`}
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect width="100" height="100" rx="6" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <rect width="100" height="100" fill="#141416" />
        {variant === 0 &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx="78" cy="22" r={12 + i * 14} fill="none" stroke={color} strokeOpacity={0.9 - i * 0.13} strokeWidth="3" />
          ))}
        {variant === 1 && (
          <g transform={`rotate(${rot} 50 50)`}>
            {Array.from({ length: 12 }, (_, i) => (
              <rect key={i} x={-40 + i * 16} y="-40" width="7" height="180" fill={color} opacity={i % 3 === 0 ? 0.95 : 0.35} />
            ))}
          </g>
        )}
        {variant === 2 &&
          Array.from({ length: 49 }, (_, i) => {
            const x = (i % 7) * 14 + 8
            const y = Math.floor(i / 7) * 14 + 8
            const on = (hash(seed + i) & 3) !== 0
            return <circle key={i} cx={x} cy={y} r={on ? 4.2 : 1.6} fill={color} opacity={on ? 0.9 : 0.35} />
          })}
        {variant === 3 && (
          <>
            <rect x="0" y={30 + (h % 30)} width="100" height="100" fill={color} />
            <rect x={10 + (h % 50)} y="0" width="14" height="100" fill="#0a0a0b" opacity="0.85" />
          </>
        )}
        {long && <circle cx="50" cy="50" r="30" fill="#0a0a0b" opacity="0.55" />}
      </g>
    </svg>
  )
}
