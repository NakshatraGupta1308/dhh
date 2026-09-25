import type { Track } from '../types'
import { trackYear } from './indexDataset'

export interface LayoutOptions {
  lanes: number
  cardWidth: number
  gap: number
  /** Width of a year that has no releases after filtering. */
  emptyYearWidth: number
  /** Minimum width of a year that has at least one release. */
  minYearWidth: number
  yearPadding: number
  /** Space before the first year and after the last one. */
  edgePadding: number
}

export interface PlacedItem {
  track: Track
  x: number
  lane: number
}

export interface YearBlock {
  year: number
  x: number
  width: number
  count: number
}

export interface TimelineLayout {
  items: PlacedItem[]
  years: YearBlock[]
  width: number
}

export const DEFAULT_LAYOUT: LayoutOptions = {
  lanes: 4,
  cardWidth: 272,
  gap: 28,
  emptyYearWidth: 96,
  minYearWidth: 360,
  yearPadding: 92,
  edgePadding: 160,
}

/**
 * Lays releases out on a piecewise time axis: every year gets exactly the
 * width it needs, so busy eras breathe and quiet eras compress, while the
 * order of years (and releases inside a year) is always preserved.
 */
export function layoutTimeline(
  tracks: Track[],
  yearRange: [number, number],
  opts: LayoutOptions = DEFAULT_LAYOUT,
): TimelineLayout {
  const byYear = new Map<number, Track[]>()
  for (const t of tracks) {
    const y = trackYear(t)
    const list = byYear.get(y)
    if (list) list.push(t)
    else byYear.set(y, [t])
  }

  const items: PlacedItem[] = []
  const years: YearBlock[] = []
  let cursor = opts.edgePadding

  for (let year = yearRange[0]; year <= yearRange[1]; year++) {
    const list = (byYear.get(year) ?? []).sort((a, b) => a.release_date.localeCompare(b.release_date))
    if (list.length === 0) {
      years.push({ year, x: cursor, width: opts.emptyYearWidth, count: 0 })
      cursor += opts.emptyYearWidth
      continue
    }
    const cols = Math.ceil(list.length / opts.lanes)
    const contentWidth = cols * opts.cardWidth + (cols - 1) * opts.gap
    const width = Math.max(opts.minYearWidth, contentWidth + opts.yearPadding * 2)
    // Rotate the starting lane per year so sparse years do not all stack on
    // the same side of the axis.
    const laneOffset = year % opts.lanes
    list.forEach((track, i) => {
      const col = Math.floor(i / opts.lanes)
      items.push({
        track,
        x: cursor + opts.yearPadding + col * (opts.cardWidth + opts.gap),
        lane: (i + laneOffset) % opts.lanes,
      })
    })
    years.push({ year, x: cursor, width, count: list.length })
    cursor += width
  }

  return { items, years, width: cursor + opts.edgePadding }
}
