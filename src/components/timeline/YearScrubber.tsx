import { motion, useTransform, type MotionValue } from 'motion/react'
import { useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { useDhhData } from '../../hooks/useDhhData'
import type { TimelineLayout } from '../../lib/timelineLayout'

interface Props {
  layout: TimelineLayout
  x: MotionValue<number>
  viewportWidth: number
  onSeek: (worldX: number, smooth?: boolean) => void
}

/** Minimap of the whole timeline. Bars are stacked by scene colour, drag or tap to jump. */
export function YearScrubber({ layout, x, viewportWidth, onSeek }: Props) {
  const data = useDhhData()
  const ref = useRef<HTMLDivElement>(null)

  const stacks = useMemo(() => {
    const byYear = new Map<number, Map<string, number>>()
    for (const item of layout.items) {
      const year = Number(item.track.release_date.slice(0, 4))
      const region = data.artistById.get(item.track.artist_ids[0])?.region_id ?? 'unknown'
      const m = byYear.get(year) ?? new Map<string, number>()
      m.set(region, (m.get(region) ?? 0) + 1)
      byYear.set(year, m)
    }
    return byYear
  }, [layout.items, data.artistById])
  const maxCount = Math.max(1, ...layout.years.map((y) => y.count))

  const windowLeft = useTransform(x, (v) => `${(-v / layout.width) * 100}%`)
  const windowWidth = `${Math.min(100, (viewportWidth / layout.width) * 100)}%`

  const seekFromPointer = (clientX: number, smooth: boolean) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    onSeek(fraction * layout.width, smooth)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    seekFromPointer(e.clientX, true)
  }

  return (
    <div className="border-t border-line bg-bg/90 px-4 pb-4 pt-3 backdrop-blur sm:px-8">
      <div className="mb-2 flex items-center justify-between">
        <span className="kicker">Drag the timeline, scroll, or scrub here</span>
        <span className="kicker">{layout.items.length} releases</span>
      </div>
      <div
        ref={ref}
        role="slider"
        aria-label="Timeline position"
        aria-valuemin={layout.years[0]?.year}
        aria-valuemax={layout.years.at(-1)?.year}
        tabIndex={-1}
        className="relative h-12 cursor-ew-resize touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={(e) => e.buttons === 1 && seekFromPointer(e.clientX, false)}
      >
        <div className="absolute inset-0 flex items-end">
          {layout.years.map((y) => {
            const regions = stacks.get(y.year)
            return (
              <div key={y.year} className="relative flex h-full flex-col justify-end" style={{ width: `${(y.width / layout.width) * 100}%` }}>
                <div className="mx-[1px] flex flex-col-reverse overflow-hidden rounded-[2px]" style={{ height: `${(y.count / maxCount) * 70}%` }}>
                  {regions &&
                    [...regions].map(([rid, n]) => (
                      <span key={rid} style={{ flex: n, background: data.regionById.get(rid)?.color ?? '#555' }} />
                    ))}
                </div>
                {y.year % 5 === 0 && <span className="absolute -bottom-0.5 left-0 translate-y-full font-mono text-[0.55rem] text-muted">{y.year}</span>}
              </div>
            )
          })}
        </div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 rounded-sm border border-ink/70 bg-ink/5"
          style={{ left: windowLeft, width: windowWidth }}
        />
      </div>
    </div>
  )
}
