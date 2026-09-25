import type { IndexedDataset } from './indexDataset'
import type { Track } from '../types'

export interface FilterState {
  artists: string[]
  labels: string[]
  regions: string[]
  languages: string[]
}

export const EMPTY_FILTERS: FilterState = { artists: [], labels: [], regions: [], languages: [] }

export type FilterKey = keyof FilterState

export function activeFilterCount(f: FilterState): number {
  return f.artists.length + f.labels.length + f.regions.length + f.languages.length
}

/**
 * Values inside one category are OR-ed, categories are AND-ed.
 * - artist: any credit on the track (main, feature or producer)
 * - label: the releasing label, or for collectives, membership of a main artist
 * - region: the scene of any main artist
 * - language: any language on the track
 */
export function trackMatches(track: Track, f: FilterState, data: IndexedDataset): boolean {
  if (f.artists.length) {
    const credits = data.creditsByTrack.get(track.id) ?? []
    if (!credits.some((c) => f.artists.includes(c.artist_id))) return false
  }
  if (f.labels.length) {
    const hit = f.labels.some((labelId) => {
      const label = data.labelById.get(labelId)
      if (!label) return false
      if (label.kind === 'collective') return track.artist_ids.some((a) => label.roster.includes(a))
      return track.label_id === labelId
    })
    if (!hit) return false
  }
  if (f.regions.length) {
    const regions = track.artist_ids.map((a) => data.artistById.get(a)?.region_id)
    if (!regions.some((r) => r && f.regions.includes(r))) return false
  }
  if (f.languages.length) {
    if (!track.languages.some((l) => f.languages.includes(l))) return false
  }
  return true
}

export function filterTracks(data: IndexedDataset, f: FilterState): Track[] {
  if (activeFilterCount(f) === 0) return data.timeline
  return data.timeline.filter((t) => trackMatches(t, f, data))
}
