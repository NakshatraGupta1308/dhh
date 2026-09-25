import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { EMPTY_FILTERS, filterTracks, type FilterKey, type FilterState } from '../lib/filters'
import type { Track } from '../types'
import { useDhhData } from './useDhhData'

interface FiltersApi {
  filters: FilterState
  results: Track[]
  toggle: (key: FilterKey, value: string) => void
  set: (key: FilterKey, values: string[]) => void
  clear: () => void
}

const FiltersContext = createContext<FiltersApi | null>(null)

export function FiltersProvider({ children }: { children: ReactNode }) {
  const data = useDhhData()
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)

  const toggle = useCallback((key: FilterKey, value: string) => {
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }))
  }, [])
  const set = useCallback((key: FilterKey, values: string[]) => setFilters((f) => ({ ...f, [key]: values })), [])
  const clear = useCallback(() => setFilters(EMPTY_FILTERS), [])
  const results = useMemo(() => filterTracks(data, filters), [data, filters])

  const api = useMemo(() => ({ filters, results, toggle, set, clear }), [filters, results, toggle, set, clear])
  return <FiltersContext.Provider value={api}>{children}</FiltersContext.Provider>
}

export function useFilters(): FiltersApi {
  const api = useContext(FiltersContext)
  if (!api) throw new Error('useFilters must be used inside <FiltersProvider>')
  return api
}
