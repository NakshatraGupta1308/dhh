import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { DhhRepository } from '../data/repository'
import { indexDataset, type IndexedDataset } from '../lib/indexDataset'

const DataContext = createContext<IndexedDataset | null>(null)

export function DataProvider({ repository, fallback, children }: { repository: DhhRepository; fallback: ReactNode; children: ReactNode }) {
  const [data, setData] = useState<IndexedDataset | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    repository
      .loadDataset()
      .then((raw) => !cancelled && setData(indexDataset(raw)))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e : new Error(String(e))))
    return () => {
      cancelled = true
    }
  }, [repository])

  if (error) throw error
  if (!data) return <>{fallback}</>
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>
}

export function useDhhData(): IndexedDataset {
  const data = useContext(DataContext)
  if (!data) throw new Error('useDhhData must be used inside <DataProvider>')
  return data
}
