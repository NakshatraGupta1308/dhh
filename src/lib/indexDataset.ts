import type { Artist, Credit, Dataset, Genre, Label, Language, Region, Track } from '../types'

export interface IndexedDataset extends Dataset {
  artistById: Map<string, Artist>
  trackById: Map<string, Track>
  labelById: Map<string, Label>
  regionById: Map<string, Region>
  languageById: Map<string, Language>
  genreById: Map<string, Genre>
  creditsByTrack: Map<string, Credit[]>
  creditsByArtist: Map<string, Credit[]>
  /** Tracks sorted oldest first. */
  timeline: Track[]
  yearRange: [number, number]
}

function group<T>(list: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of list) {
    const k = key(item)
    const bucket = map.get(k)
    if (bucket) bucket.push(item)
    else map.set(k, [item])
  }
  return map
}

export function trackYear(track: Track): number {
  return Number(track.release_date.slice(0, 4))
}

export function indexDataset(data: Dataset): IndexedDataset {
  const timeline = [...data.tracks].sort(
    (a, b) => a.release_date.localeCompare(b.release_date) || a.title.localeCompare(b.title),
  )
  const years = timeline.map(trackYear)
  return {
    ...data,
    artistById: new Map(data.artists.map((a) => [a.id, a])),
    trackById: new Map(data.tracks.map((t) => [t.id, t])),
    labelById: new Map(data.labels.map((l) => [l.id, l])),
    regionById: new Map(data.regions.map((r) => [r.id, r])),
    languageById: new Map(data.languages.map((l) => [l.id, l])),
    genreById: new Map(data.genres.map((g) => [g.id, g])),
    creditsByTrack: group(data.features, (f) => f.track_id),
    creditsByArtist: group(data.features, (f) => f.artist_id),
    timeline,
    yearRange: [Math.min(...years), Math.max(...years)],
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatReleaseDate(track: Track): string {
  const [y, m, d] = track.release_date.split('-').map(Number)
  if (track.date_precision === 'year') return String(y)
  if (track.date_precision === 'month') return `${MONTHS[m - 1]} ${y}`
  return `${d} ${MONTHS[m - 1]} ${y}`
}
