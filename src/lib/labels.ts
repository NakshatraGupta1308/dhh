import type { CreditRole, ReleaseType } from '../types'

export const RELEASE_TYPE_LABEL: Record<ReleaseType, string> = {
  single: 'Single',
  album: 'Album',
  ep: 'EP',
  mixtape: 'Mixtape',
  track: 'Album cut',
  soundtrack: 'Soundtrack',
  collection: 'Collection',
}

export const ROLE_LABEL: Record<CreditRole, string> = {
  main: 'Lead',
  feature: 'Feature',
  producer: 'Producer',
}

export function isLongForm(type: ReleaseType): boolean {
  return type === 'album' || type === 'ep' || type === 'mixtape' || type === 'collection'
}

/** Search links used until real Spotify and YouTube ids are seeded. */
export function listenLinks(
  title: string,
  artistNames: string[],
  ids: { spotify: string | null; youtube: string | null },
  longForm = false,
) {
  const q = encodeURIComponent(`${title} ${artistNames.join(' ')}`)
  return {
    youtube: ids.youtube ? `https://www.youtube.com/watch?v=${ids.youtube}` : `https://www.youtube.com/results?search_query=${q}`,
    spotify: ids.spotify ? `https://open.spotify.com/${longForm ? 'album' : 'track'}/${ids.spotify}` : `https://open.spotify.com/search/${q}`,
  }
}
