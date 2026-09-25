import { useCallback } from 'react'
import { useView } from './useView'

/** Opening an artist now means going to their page, optionally highlighting one release. */
export function useSelectedArtist() {
  const { view, id, release, navigate } = useView()
  const open = useCallback(
    (artistId: string, opts: { trackId?: string } = {}) => navigate('artist', { id: artistId, release: opts.trackId ?? null }),
    [navigate],
  )
  return { open, artistId: view === 'artist' ? id : null, trackId: view === 'artist' ? release : null }
}
