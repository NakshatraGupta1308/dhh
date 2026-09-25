import { motion, useReducedMotion } from 'motion/react'
import type { Region } from '../../types'

/** Looping hero motif: a record whose label is split into every scene's colour. */
export function SceneRecord({ regions, caption }: { regions: Region[]; caption: string }) {
  const reduce = useReducedMotion()
  const R = 100
  const labelR = 34
  const step = (Math.PI * 2) / regions.length

  const arc = (i: number) => {
    const a0 = i * step - Math.PI / 2
    const a1 = a0 + step
    const p = (a: number, r: number) => `${100 + Math.cos(a) * r} ${100 + Math.sin(a) * r}`
    return `M 100 100 L ${p(a0, labelR)} A ${labelR} ${labelR} 0 0 1 ${p(a1, labelR)} Z`
  }

  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="h-full w-full drop-shadow-[0_40px_80px_rgba(0,0,0,0.6)]"
      aria-hidden
      animate={reduce ? undefined : { rotate: 360 }}
      transition={{ duration: 24, ease: 'linear', repeat: Infinity }}
    >
      <defs>
        <radialGradient id="vinyl" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1d1d20" />
          <stop offset="100%" stopColor="#08080a" />
        </radialGradient>
        <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="48%" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="52%" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <path id="caption-path" d="M 100 100 m -42 0 a 42 42 0 1 1 84 0 a 42 42 0 1 1 -84 0" />
      </defs>
      <circle cx="100" cy="100" r={R} fill="url(#vinyl)" />
      {Array.from({ length: 22 }, (_, i) => (
        <circle key={i} cx="100" cy="100" r={48 + i * 2.35} fill="none" stroke="#fff" strokeOpacity={i % 5 === 0 ? 0.07 : 0.03} strokeWidth="0.6" />
      ))}
      <circle cx="100" cy="100" r={R} fill="url(#sheen)" />
      {regions.map((r, i) => (
        <path key={r.id} d={arc(i)} fill={r.color} />
      ))}
      <text fontFamily="Space Mono, monospace" fontSize="5.4" letterSpacing="1.6" fill="#f4f1ea" opacity="0.7">
        <textPath href="#caption-path">{caption}</textPath>
      </text>
      <circle cx="100" cy="100" r="3.2" fill="#0a0a0b" />
    </motion.svg>
  )
}
