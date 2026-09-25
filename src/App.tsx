import { LayoutGroup } from 'motion/react'
import { staticRepository } from './data/repository'
import { DataProvider } from './hooks/useDhhData'
import { FiltersProvider } from './hooks/useFilters'
import { SelectionProvider } from './hooks/useSelectedArtist'
import { ExplorerPage } from './pages/ExplorerPage'

function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <span className="font-display text-5xl text-accent">DHH</span>
    </div>
  )
}

export default function App() {
  return (
    <DataProvider repository={staticRepository} fallback={<Loading />}>
      <FiltersProvider>
        <SelectionProvider>
          <LayoutGroup>
            <ExplorerPage />
          </LayoutGroup>
        </SelectionProvider>
      </FiltersProvider>
    </DataProvider>
  )
}
