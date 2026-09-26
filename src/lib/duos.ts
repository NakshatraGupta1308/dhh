import type { IndexedDataset } from './indexDataset'
import type { Artist } from '../types'

export const isDuo = (a: Artist) => a.kind === 'duo'

/** Duos an artist belongs to. */
export function duosOf(data: IndexedDataset, artistId: string): Artist[] {
  return data.artists.filter((a) => isDuo(a) && a.members?.includes(artistId))
}

/** A duo's member artists, in listed order. */
export function membersOf(data: IndexedDataset, duo: Artist): Artist[] {
  return (duo.members ?? []).map((id) => data.artistById.get(id)).filter((a): a is Artist => !!a)
}
