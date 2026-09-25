import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface SearchApi {
  isOpen: boolean
  openSearch: () => void
  closeSearch: () => void
}

const SearchContext = createContext<SearchApi | null>(null)

/** Owns the search panel's open state and the global shortcuts (Ctrl or Cmd + K, and /). */
export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const openSearch = useCallback(() => setOpen(true), [])
  const closeSearch = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing = target?.closest('input, textarea, [contenteditable="true"]')
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const api = useMemo(() => ({ isOpen, openSearch, closeSearch }), [isOpen, openSearch, closeSearch])
  return <SearchContext.Provider value={api}>{children}</SearchContext.Provider>
}

export function useSearch(): SearchApi {
  const api = useContext(SearchContext)
  if (!api) throw new Error('useSearch must be used inside <SearchProvider>')
  return api
}
