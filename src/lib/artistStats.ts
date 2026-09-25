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
