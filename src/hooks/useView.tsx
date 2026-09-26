import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type View = 'home' | 'producers' | 'artist' | 'scene' | 'genre' | 'genres' | 'slang' | 'listen' | 'beef'

export interface Route {
  view: View
  /** Artist, scene, genre or slang id, depending on the view. */
  id: string | null
  /** Release to highlight on an artist page. */
  release: string | null
}

interface NavigateOptions {
  id?: string | null
  release?: string | null
  /** Section id to scroll to once the page renders. */
  anchor?: string
}

interface ViewApi extends Route {
  navigate: (view: View, opts?: NavigateOptions) => void
}

const VIEWS: View[] = ['home', 'producers', 'artist', 'scene', 'genre', 'genres', 'slang', 'listen', 'beef']
const ViewContext = createContext<ViewApi | null>(null)

function readRoute(): Route {
  const params = new URLSearchParams(window.location.search)
  // Older links used ?artist=divine&release=kohinoor for the artist overlay.
  const legacyArtist = params.get('artist')
  const raw = params.get('view') as View | null
  const view: View = raw && VIEWS.includes(raw) ? raw : legacyArtist ? 'artist' : 'home'
  return { view, id: params.get('id') ?? legacyArtist, release: params.get('release') }
}

function routeUrl(view: View, id: string | null, release: string | null): string {
  const params = new URLSearchParams()
  if (view !== 'home') params.set('view', view)
  if (id) params.set('id', id)
  if (release) params.set('release', release)
  const qs = params.toString()
  return `${window.location.pathname}${qs ? `?${qs}` : ''}`
}

function afterRender(fn: () => void) {
  // Two frames: one for React to commit the new page, one for layout.
  requestAnimationFrame(() => requestAnimationFrame(fn))
}

/**
 * Query-string router (?view=artist&id=divine). It needs no server rewrites, so
 * it works on any static host, and it restores scroll position on Back.
 */
export function ViewProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(readRoute)

  useEffect(() => {
    window.history.scrollRestoration = 'manual'
    const onPop = (e: PopStateEvent) => {
      setRoute(readRoute())
      const y = (e.state as { scrollY?: number } | null)?.scrollY ?? 0
      afterRender(() => window.scrollTo({ top: y }))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((view: View, opts: NavigateOptions = {}) => {
    const id = opts.id ?? null
    const release = opts.release ?? null
    const url = routeUrl(view, id, release)
    if (url !== `${window.location.pathname}${window.location.search}`) {
      // Remember where we were so Back lands on the same spot.
      window.history.replaceState({ scrollY: window.scrollY }, '', window.location.href)
      window.history.pushState({ scrollY: 0 }, '', url)
      setRoute({ view, id, release })
    }
    afterRender(() => {
      const el = opts.anchor ? document.getElementById(opts.anchor) : null
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      else if (!release) window.scrollTo({ top: 0 })
    })
  }, [])

  const api = useMemo(() => ({ ...route, navigate }), [route, navigate])
  return <ViewContext.Provider value={api}>{children}</ViewContext.Provider>
}

export function useView(): ViewApi {
  const api = useContext(ViewContext)
  if (!api) throw new Error('useView must be used inside <ViewProvider>')
  return api
}
