import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, type MotionValue } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useDhhData } from '../../hooks/useDhhData'
import { useElementSize } from '../../hooks/useElementSize'
import { useFilters } from '../../hooks/useFilters'
import { useWindowSize } from '../../hooks/useWindowSize'
import { DEFAULT_LAYOUT, layoutTimeline, type PlacedItem, type TimelineLayout } from '../../lib/timelineLayout'
import { FilterBar } from '../filters/FilterBar'
import { ReleaseCard, useTrackScene } from './ReleaseCard'
import { YearScrubber } from './YearScrubber'

const CARD_HEIGHT = 114
const AXIS_GAP = 34

function laneTop(lane: number, center: number, laneHeight: number) {
  const tier = Math.floor(lane / 2)
  return lane % 2 === 0 ? center - AXIS_GAP - CARD_HEIGHT - tier * laneHeight : center + AXIS_GAP + tier * laneHeight
}

function TimelineItem({ item, center, laneHeight }: { item: PlacedItem; center: number; laneHeight: number }) {
  const { color } = useTrackScene(item.track)
  const above = item.lane % 2 === 0
  const top = laneTop(item.lane, center, laneHeight)
  const stemTop = above ? top + CARD_HEIGHT : center
  const stemHeight = above ? center - stemTop : top - center

  return (
    <motion.div
      className="absolute left-0 top-0"
      style={{ width: DEFAULT_LAYOUT.cardWidth }}
      initial={{ x: item.x, y: top, opacity: 0 }}
      animate={{ x: item.x, y: top, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
    >
      <motion.div
        initial={{ opacity: 0, y: above ? -28 : 28, filter: 'blur(6px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <ReleaseCard track={item.track} />
      </motion.div>
      {/* Stem connecting the card to its moment on the axis. */}
      <motion.span
        aria-hidden
        className="absolute left-6 w-px origin-bottom"
        style={{ top: stemTop - top, height: stemHeight, background: `linear-gradient(${above ? '180deg' : '0deg'}, transparent, ${color})` }}
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
      <span
        aria-hidden
        className="absolute left-6 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-bg"
        style={{ top: center - top, background: color }}
      />
    </motion.div>
  )
}

function YearAxis({ layout, center }: { layout: TimelineLayout; center: number }) {
  return (
    <>
      <div aria-hidden className="absolute inset-x-0 h-px bg-line" style={{ top: center }} />
      {layout.years.map((y) => (
        <div key={y.year} className="absolute" style={{ left: y.x, top: center }} aria-hidden>
          <span className="absolute -top-3 h-6 w-px bg-faint" />
          <span
            className={`absolute left-2 -translate-y-1/2 bg-bg pr-2 font-display leading-none ${
              y.count ? 'text-3xl text-ink' : 'text-lg text-faint'
            }`}
          >
            {y.year}
            {y.count > 0 && <sup className="ml-1 font-mono text-[0.6rem] text-muted">{y.count}</sup>}
          </span>
        </div>
      ))}
    </>
  )
}

function useDragToScroll(onScrollTo: (y: number) => void) {
  const state = useRef<{ startX: number; startScroll: number; moved: boolean; lastX: number; lastT: number; v: number } | null>(null)
  const momentum = useRef<number>(0)

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      cancelAnimationFrame(momentum.current)
      state.current = { startX: e.clientX, startScroll: window.scrollY, moved: false, lastX: e.clientX, lastT: performance.now(), v: 0 }

      const move = (ev: PointerEvent) => {
        const s = state.current
        if (!s) return
        const dx = ev.clientX - s.startX
        if (!s.moved && Math.abs(dx) > 5) s.moved = true
        if (!s.moved) return
        const now = performance.now()
        s.v = (ev.clientX - s.lastX) / Math.max(1, now - s.lastT)
        s.lastX = ev.clientX
        s.lastT = now
        onScrollTo(s.startScroll - dx)
      }
      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', up)
        const s = state.current
        state.current = null
        if (!s?.moved) return
        // Swallow the click that follows a drag so cards do not open.
        const swallow = (ce: MouseEvent) => {
          ce.stopPropagation()
          ce.preventDefault()
        }
        window.addEventListener('click', swallow, { capture: true, once: true })
        setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 50)
        // Glide a little after release.
        let v = s.v * 16
        const glide = () => {
          if (Math.abs(v) < 0.5) return
          onScrollTo(window.scrollY - v)
          v *= 0.92
          momentum.current = requestAnimationFrame(glide)
        }
        momentum.current = requestAnimationFrame(glide)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
    },
    [onScrollTo],
  )

  useEffect(() => () => cancelAnimationFrame(momentum.current), [])
  return onPointerDown
}

export function HorizontalTimeline() {
  const data = useDhhData()
  const { results } = useFilters()
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const { width: vw, height: vh } = useWindowSize()
  const stage = useElementSize(stageRef)

  const lanes = stage.height >= 640 ? 4 : 2
  const layout = useMemo(
    () => layoutTimeline(results, data.yearRange, { ...DEFAULT_LAYOUT, lanes }),
    [results, data.yearRange, lanes],
  )
  const center = Math.round(stage.height / 2)
  const laneHeight = lanes === 4 ? Math.min(150, (stage.height / 2 - AXIS_GAP - CARD_HEIGHT) - 8) : 0
  const distance = Math.max(0, layout.width - vw)

  const x = useMotionValue(0)
  const smoothX = useSpring(x, { stiffness: 260, damping: 38, mass: 0.35 })
  const renderX: MotionValue<number> = reduce ? x : smoothX
  const [activeYear, setActiveYear] = useState(data.yearRange[0])

  const sync = useCallback(() => {
    const el = sectionRef.current
    if (!el) return
    const progressPx = Math.min(distance, Math.max(0, -el.getBoundingClientRect().top))
    x.set(-progressPx)
    const mid = progressPx + vw / 2
    const block = layout.years.find((y) => mid >= y.x && mid < y.x + y.width)
    const year = block?.year ?? (mid < (layout.years[0]?.x ?? 0) ? data.yearRange[0] : data.yearRange[1])
    setActiveYear((prev) => (prev === year ? prev : year))
  }, [distance, layout, vw, x, data.yearRange])

  useEffect(() => {
    sync()
    window.addEventListener('scroll', sync, { passive: true })
    return () => window.removeEventListener('scroll', sync)
  }, [sync])

  const sectionTop = () => (sectionRef.current ? sectionRef.current.getBoundingClientRect().top + window.scrollY : 0)
  const scrollToWorldX = useCallback(
    (worldX: number, smooth = true) => {
      const target = sectionTop() + Math.min(distance, Math.max(0, worldX - vw / 2))
      window.scrollTo({ top: target, behavior: smooth && !reduce ? 'smooth' : 'auto' })
    },
    [distance, vw, reduce],
  )
  const onPointerDown = useDragToScroll(useCallback((y: number) => window.scrollTo(0, y), []))

  return (
    <section
      ref={sectionRef}
      id="timeline"
      aria-label="Release timeline"
      className="relative"
      style={{ height: distance + vh }}
    >
      <div className="sticky top-0 flex h-[100dvh] flex-col overflow-hidden pt-14">
        <FilterBar />
        <div
          ref={stageRef}
          className="relative flex-1 cursor-grab touch-pan-y select-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onWheel={(e) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) window.scrollBy(0, e.deltaX)
          }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') window.scrollBy({ top: 420, behavior: 'smooth' })
            if (e.key === 'ArrowLeft') window.scrollBy({ top: -420, behavior: 'smooth' })
          }}
        >
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={activeYear}
                className="text-outline font-display leading-none [--outline:var(--color-line)]"
                style={{ fontSize: 'min(52vh, 34vw)' }}
                initial={{ y: '30%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                exit={{ y: '-30%', opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {activeYear}
              </motion.span>
            </AnimatePresence>
          </div>

          {stage.height > 0 && (
            <motion.div className="absolute inset-y-0 left-0" style={{ x: renderX, width: layout.width }}>
              <YearAxis layout={layout} center={center} />
              <AnimatePresence>
                {layout.items.map((item) => (
                  <TimelineItem key={item.track.id} item={item} center={center} laneHeight={laneHeight} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {results.length === 0 && (
            <div className="absolute inset-0 grid place-items-center">
              <p className="rounded-full border border-line bg-surface px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-muted">
                No releases match these filters
              </p>
            </div>
          )}
        </div>
        <YearScrubber layout={layout} x={renderX} viewportWidth={vw} onSeek={scrollToWorldX} />
      </div>
    </section>
  )
}

