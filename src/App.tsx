import { SearchPalette } from './components/search/SearchPalette'
import { staticRepository } from './data/repository'
import { DataProvider } from './hooks/useDhhData'
import { FiltersProvider } from './hooks/useFilters'
import { SearchProvider } from './hooks/useSearch'
import { useView, ViewProvider } from './hooks/useView'
import { ArtistPage } from './pages/ArtistPage'
import { ExplorerPage } from './pages/ExplorerPage'
import { GenrePage } from './pages/GenrePage'
import { GenresPage } from './pages/GenresPage'
import { ProducersPage } from './pages/ProducersPage'
import { ScenePage } from './pages/ScenePage'
import { SlangPage } from './pages/SlangPage'

function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <span className="font-display text-5xl text-accent">DHH</span>
    </div>
  )
}

function CurrentPage() {
  const { view } = useView()
  switch (view) {
    case 'artist':
      return <ArtistPage />
    case 'scene':
      return <ScenePage />
    case 'genre':
      return <GenrePage />
    case 'genres':
      return <GenresPage />
    case 'slang':
      return <SlangPage />
    case 'producers':
      return <ProducersPage />
    default:
      return <ExplorerPage />
  }
}

export default function App() {
  return (
    <DataProvider repository={staticRepository} fallback={<Loading />}>
      <FiltersProvider>
        <ViewProvider>
          <SearchProvider>
            <CurrentPage />
            <SearchPalette />
          </SearchProvider>
        </ViewProvider>
      </FiltersProvider>
    </DataProvider>
  )
}
