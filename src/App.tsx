import { LayoutGroup } from 'motion/react'
import { staticRepository } from './data/repository'
import { DataProvider } from './hooks/useDhhData'
import { FiltersProvider } from './hooks/useFilters'
import { SelectionProvider } from './hooks/useSelectedArtist'
import { useView, ViewProvider } from './hooks/useView'
import { ExplorerPage } from './pages/ExplorerPage'
import { ProducersPage } from './pages/ProducersPage'

function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <span className="font-display text-5xl text-accent">DHH</span>
    </div>
  )
}

function CurrentPage() {
  const { view } = useView()
  return view === 'producers' ? <ProducersPage /> : <ExplorerPage />
}

export default function App() {
  return (
    <DataProvider repository={staticRepository} fallback={<Loading />}>
      <FiltersProvider>
        <SelectionProvider>
          <ViewProvider>
            <LayoutGroup>
              <CurrentPage />
            </LayoutGroup>
          </ViewProvider>
        </SelectionProvider>
      </FiltersProvider>
    </DataProvider>
  )
}
