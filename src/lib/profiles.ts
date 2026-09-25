import { artistCredits, collaborators } from './artistStats'
import type { IndexedDataset } from './indexDataset'
import type { Artist, Genre, Label, Region, Track } from '../types'

const newestFirst = (a: Track, b: Track) => b.release_date.localeCompare(a.release_date)

function countBy<T>(items: T[], key: (item: T) => string[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const item of items) for (const k of key(item)) counts.set(k, (counts.get(k) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

/** Genres an artist works in, from every release they are credited on. */
export function artistGenres(data: IndexedDataset, artistId: string): [string, number][] {
  return countBy(artistCredits(data, artistId), (c) => c.track.genres)
}

export interface SceneProfile {
  region: Region
  artists: Artist[]
  producers: Artist[]
  releases: Track[]
  genres: [string, number][]
  labels: Label[]
  /** Other scenes this one shares credits with, most connected first. */
  connections: [string, number][]
}

export function sceneProfile(data: IndexedDataset, regionId: string): SceneProfile | null {
  const region = data.regionById.get(regionId)
  if (!region) return null
  const members = data.artists.filter((a) => a.region_id === regionId)
  const memberIds = new Set(members.map((a) => a.id))
  // A release belongs to the scene of its lead artists. Guest spots and
  // productions for other scenes stay on those scenes' pages.
  const releases = data.tracks.filter((t) => t.artist_ids.some((id) => memberIds.has(id))).sort(newestFirst)
  const byActivity = (a: Artist, b: Artist) =>
    (data.creditsByArtist.get(b.id)?.length ?? 0) - (data.creditsByArtist.get(a.id)?.length ?? 0) || a.name.localeCompare(b.name)
  const labels = data.labels.filter(
    (l) => l.roster.some((id) => memberIds.has(id)) || releases.some((t) => t.label_id === l.id),
  )
  const connections = countBy(
    members.flatMap((a) => collaborators(data, a.id)).filter((c) => c.artist.region_id !== regionId),
    (c) => [c.artist.region_id],
  )
  return {
    region,
    artists: members.filter((a) => a.kind !== 'producer').sort(byActivity),
    producers: members.filter((a) => a.kind === 'producer').sort(byActivity),
    releases,
    genres: countBy(releases, (t) => t.genres),
    labels,
    connections,
  }
}

export interface GenreProfile {
  genre: Genre
  tracks: Track[]
  /** Artists and producers ranked by how many of the genre's releases they lead or produce. */
  pros: [Artist, number][]
  related: [string, number][]
  scenes: [string, number][]
}

export function genreProfile(data: IndexedDataset, genreId: string): GenreProfile | null {
  const genre = data.genreById.get(genreId)
  if (!genre) return null
  const tracks = data.tracks.filter((t) => t.genres.includes(genreId)).sort(newestFirst)
  const pros = countBy(tracks, (t) =>
    [...new Set((data.creditsByTrack.get(t.id) ?? []).filter((c) => c.role !== 'feature').map((c) => c.artist_id))],
  )
    .map(([id, n]) => [data.artistById.get(id)!, n] as [Artist, number])
    .filter(([a]) => a)
  return {
    genre,
    tracks,
    pros,
    related: countBy(tracks, (t) => t.genres.filter((g) => g !== genreId)),
    scenes: countBy(tracks, (t) => [data.artistById.get(t.artist_ids[0])?.region_id ?? '']).filter(([id]) => id),
  }
}

export { newestFirst }
