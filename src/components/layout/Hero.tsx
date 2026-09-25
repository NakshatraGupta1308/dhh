import { animate, motion, useInView, useMotionValue, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useDhhData } from '../../hooks/useDhhData'
import { useSelectedArtist } from '../../hooks/useSelectedArtist'
import { Marquee } from './Marquee'
import { SceneRecord } from './SceneRecord'

const EASE = [0.22, 1, 0.36, 1] as const

function StaggerWord({ word, delay, outline = false }: { word: string; delay: number; outline?: boolean }) {
  return (
    <span className="flex overflow-hidden pb-[0.04em]" aria-hidden>
      {word.split('').map((ch, i) => (
        <motion.span
          key={i}
          className={`inline-block ${outline ? 'text-outline' : ''}`}
          initial={{ y: '105%', rotate: 6 }}
          animate={{ y: '0%', rotate: 0 }}
          transition={{ delay: delay + i * 0.045, duration: 0.9, ease: EASE }}
        >
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </span>
  )
}

function Counter({ to, label }: { to: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const value = useMotionValue(0)
  const [shown, setShown] = useState(0)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setShown(to)
      return
    }
    const controls = animate(value, to, { duration: 1.6, delay: 1.2, ease: EASE, onUpdate: (v) => setShown(Math.round(v)) })
    return () => controls.stop()
  }, [inView, to, value, reduce])

  return (
    <div ref={ref} className="flex flex-col">
      <span className="font-display text-4xl leading-none tabular-nums sm:text-5xl">{shown}</span>
      <span className="kicker mt-1">{label}</span>
    </div>
  )
}

export function Hero() {
  const data = useDhhData()
  const { open } = useSelectedArtist()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const titleScale = useTransform(scrollYProgress, [0, 1], [1, 0.86])
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const recordY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])

  const [from, to] = data.yearRange
  const names = [...data.artists].sort((a, b) => a.active_from - b.active_from)

  return (
    <section ref={ref} id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden pt-20">
      {/* Scene colour strip, one segment per region. */}
      <div className="absolute inset-x-0 top-0 flex h-1" aria-hidden>
        {data.regions.map((r, i) => (
          <motion.span
            key={r.id}
            className="h-full flex-1 origin-left"
            style={{ background: r.color }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2 + i * 0.06, duration: 0.8, ease: EASE }}
          />
        ))}
      </div>

      <motion.div
        className="pointer-events-none absolute right-[-4vw] top-24 hidden aspect-square w-[min(36vw,500px)] lg:block"
        style={{ y: recordY, opacity: fade }}
      >
        <motion.div
          className="h-full w-full"
          initial={{ opacity: 0, scale: 0.6, rotate: -40 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.6, duration: 1.4, ease: EASE }}
        >
          <SceneRecord regions={data.regions} caption={`DHH EXPLORER  /  ${from} TO ${to}  /  ${data.regions.length} SCENES  /  `} />
        </motion.div>
      </motion.div>

      <motion.div style={{ opacity: fade }} className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 sm:px-8">
        <motion.p
          className="kicker flex flex-wrap items-center gap-x-3 gap-y-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <span className="text-accent">●</span> An interactive archive <span className="text-faint">/</span> {from} to {to}
        </motion.p>

        <motion.h1
          style={{ scale: titleScale, y: titleY }}
          className="mt-6 origin-top-left font-display text-mega uppercase"
          aria-label="Desi Hip Hop"
        >
          <StaggerWord word="Desi" delay={0.35} />
          <StaggerWord word="Hip Hop" delay={0.55} outline />
        </motion.h1>

        <div className="mt-8 grid gap-10 pb-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <motion.p
            className="max-w-xl text-lg leading-relaxed text-muted sm:text-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8, ease: EASE }}
          >
            From Punjabi rap's first diaspora tapes to the gullies of Kurla and the studios of Delhi, Ahmedabad, Kerala and Chennai.{' '}
            <span className="text-ink">Scroll through two decades of releases, scene by scene.</span>
          </motion.p>
          <div className="grid grid-cols-4 gap-4 border-t border-line pt-5">
            <Counter to={data.artists.length} label="Artists" />
            <Counter to={data.tracks.length} label="Releases" />
            <Counter to={data.regions.length} label="Scenes" />
            <Counter to={to - from + 1} label="Years" />
          </div>
        </div>
      </motion.div>

      <div className="relative space-y-1 pb-6 font-display text-5xl uppercase leading-none text-faint sm:text-7xl">
        <Marquee duration={60}>
          {names.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => open(a.id)}
              tabIndex={-1}
              className="text-outline px-6 uppercase [--outline:var(--color-faint)] hover:[--outline:var(--c)]"
              style={{ ['--c' as string]: data.regionById.get(a.region_id)?.color }}
            >
              {a.name}
            </button>
          ))}
        </Marquee>
        <Marquee reverse duration={75}>
          {data.regions.map((r) => (
            <span key={r.id} className="flex items-center px-6" style={{ color: r.color }}>
              {r.name}
              <span className="ml-12 text-faint">✦</span>
            </span>
          ))}
        </Marquee>
      </div>

      <motion.a
        href="#timeline"
        className="kicker absolute bottom-40 right-4 hidden items-center gap-3 sm:right-8 md:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        Scroll to rewind the tape
        <span className="relative block h-10 w-px overflow-hidden bg-line">
          <motion.span
            className="absolute inset-x-0 top-0 h-1/2 bg-accent"
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
      </motion.a>
    </section>
  )
}
