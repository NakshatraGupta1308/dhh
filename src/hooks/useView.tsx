import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type View = 'home' | 'producers'

interface ViewApi {
  view: View
  /** Switch page, optionally scrolling to a section id once it renders. */
  navigate: (view: View, anchor?: string) => void
}

const ViewContext = createContext<ViewApi | null>(null)

function readView(): View {
  return new URLSearchParams(window.location.search).get('view') === 'producers' ? 'producers' : 'home'
}

function scrollToAnchor(anchor?: string) {
  // Two frames: one for React to commit the new page, one for layout.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const el = anchor ? document.getElementById(anchor) : null
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      else window.scrollTo({ top: 0 })
    }),
  )
}

/** Tiny page router kept in the query string (?view=producers) so it works on static hosting. */
export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>(readView)

  useEffect(() => {
    const onPop = () => setView(readView())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((next: View, anchor?: string) => {
    if (next !== readView()) {
      const params = new URLSearchParams(window.location.search)
      if (next === 'home') params.delete('view')
      else params.set('view', next)
      const qs = params.toString()
      window.history.pushState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
      setView(next)
    }
    scrollToAnchor(anchor)
  }, [])

  const api = useMemo(() => ({ view, navigate }), [view, navigate])
  return <ViewContext.Provider value={api}>{children}</ViewContext.Provider>
}

export function useView(): ViewApi {
  const api = useContext(ViewContext)
  if (!api) throw new Error('useView must be used inside <ViewProvider>')
  return api
}
