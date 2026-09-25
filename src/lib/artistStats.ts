import type { IndexedDataset } from './indexDataset'
import { trackYear } from './indexDataset'
import type { Artist, CreditRole, Track } from '../types'

export interface ArtistCredit {
  track: Track
  roles: CreditRole[]
}

export interface Collaborator {
  artist: Artist
  shared: number
}

export function artistCredits(data: IndexedDataset, artistId: string): ArtistCredit[] {
  const byTrack = new Map<string, CreditRole[]>()
  for (const c of data.creditsByArtist.get(artistId) ?? []) {
    const roles = byTrack.get(c.track_id) ?? []
    roles.push(c.role)
    byTrack.set(c.track_id, roles)
  }
  return [...byTrack]
    .map(([trackId, roles]) => ({ track: data.trackById.get(trackId)!, roles }))
    .filter((c) => c.track)
    .sort((a, b) => a.track.release_date.localeCompare(b.track.release_date))
}

/** Everyone who shares a credit with this artist, most frequent first. Seed of the phase 5 graph. */
export function collaborators(data: IndexedDataset, artistId: string): Collaborator[] {
  const counts = new Map<string, number>()
  // One artist can hold several roles on a track, so count each shared track once.
  const trackIds = new Set((data.creditsByArtist.get(artistId) ?? []).map((c) => c.track_id))
  for (const trackId of trackIds) {
    const others = new Set((data.creditsByTrack.get(trackId) ?? []).map((o) => o.artist_id))
    others.delete(artistId)
    for (const o of others) counts.set(o, (counts.get(o) ?? 0) + 1)
  }
  return [...counts]
    .map(([id, shared]) => ({ artist: data.artistById.get(id)!, shared }))
    .filter((c) => c.artist)
    .sort((a, b) => b.shared - a.shared || a.artist.name.localeCompare(b.artist.name))
}

export function releasesPerYear(credits: ArtistCredit[]): Map<number, ArtistCredit[]> {
  const map = new Map<number, ArtistCredit[]>()
  for (const c of credits) {
    const y = trackYear(c.track)
    const list = map.get(y) ?? []
    list.push(c)
    map.set(y, list)
  }
  return map
}

export interface ProducerProfile {
  artist: Artist
  /** Releases they produced, newest first. */
  productions: Track[]
  /** Releases they led themselves, newest first. */
  ownReleases: Track[]
  collaborators: Collaborator[]
}

/**
 * Everyone who makes beats: artists whose kind is producer, plus anyone
 * holding at least one producer credit. Busiest producers come first.
 */
export function producerProfiles(data: IndexedDataset): ProducerProfile[] {
  const newestFirst = (a: Track, b: Track) => b.release_date.localeCompare(a.release_date)
  return data.artists
    .filter((a) => a.kind === 'producer' || (data.creditsByArtist.get(a.id) ?? []).some((c) => c.role === 'producer'))
    .map((artist) => {
      const credits = artistCredits(data, artist.id)
      return {
        artist,
        productions: credits.filter((c) => c.roles.includes('producer')).map((c) => c.track).sort(newestFirst),
        ownReleases: credits.filter((c) => c.roles.includes('main') && !c.roles.includes('producer')).map((c) => c.track).sort(newestFirst),
        collaborators: collaborators(data, artist.id),
      }
    })
    .sort((a, b) => b.productions.length - a.productions.length || b.collaborators.length - a.collaborators.length || a.artist.name.localeCompare(b.artist.name))
}
