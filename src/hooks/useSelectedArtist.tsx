import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export type SelectionOrigin = 'roster' | 'elsewhere'

interface Selection {
  artistId: string | null
  /** Where the open was triggered from, so the roster can run a shared layout transition. */
  origin: SelectionOrigin
  /** Optional release to highlight inside the artist view. */
  trackId: string | null
}

interface SelectionApi extends Selection {
  open: (artistId: string, opts?: { origin?: SelectionOrigin; trackId?: string }) => void
  close: () => void
}

const SelectionContext = createContext<SelectionApi | null>(null)

function readUrl(): Selection {
  const params = new URLSearchParams(window.location.search)
  return { artistId: params.get('artist'), trackId: params.get('release'), origin: 'elsewhere' }
}

function writeUrl(artistId: string | null, trackId: string | null, replace: boolean) {
  const params = new URLSearchParams(window.location.search)
  if (artistId) params.set('artist', artistId)
  else params.delete('artist')
  if (trackId) params.set('release', trackId)
  else params.delete('release')
  const qs = params.toString()
  const url = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
  if (replace) window.history.replaceState(null, '', url)
  else window.history.pushState(null, '', url)
}

/** Selected artist, mirrored into the URL (?artist=) so views are shareable and the back button closes them. */
export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Selection>(readUrl)

  useEffect(() => {
    const onPop = () => {
      pushed.current = false
      setSelection(readUrl())
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const current = useRef(selection)
  // True when our own open() added a history entry, so close() can pop it.
  const pushed = useRef(false)
  current.current = selection

  const open = useCallback<SelectionApi['open']>((artistId, opts = {}) => {
    const trackId = opts.trackId ?? null
    // Hopping between artists replaces the entry so Back always returns to the page.
    const replace = current.current.artistId !== null
    writeUrl(artistId, trackId, replace)
    if (!replace) pushed.current = true
    setSelection({ artistId, origin: opts.origin ?? 'elsewhere', trackId })
  }, [])

  const close = useCallback(() => {
    if (pushed.current) {
      pushed.current = false
      window.history.back()
    } else {
      writeUrl(null, null, true)
    }
    setSelection((prev) => ({ ...prev, artistId: null, trackId: null }))
  }, [])

  const api = useMemo(() => ({ ...selection, open, close }), [selection, open, close])
  return <SelectionContext.Provider value={api}>{children}</SelectionContext.Provider>
}

export function useSelectedArtist(): SelectionApi {
  const api = useContext(SelectionContext)
  if (!api) throw new Error('useSelectedArtist must be used inside <SelectionProvider>')
  return api
}
