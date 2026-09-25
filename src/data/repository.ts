import type { Dataset } from '../types'
import artists from './artists.json'
import tracks from './tracks.json'
import labels from './labels.json'
import regions from './regions.json'
import languages from './languages.json'
import features from './features.json'

/**
 * The only place the UI learns where data comes from. Phase 1 reads bundled
 * JSON; a later phase can provide an API-backed repository with the same
 * shape and nothing in the component tree has to change.
 */
export interface DhhRepository {
  loadDataset(): Promise<Dataset>
}

export const staticRepository: DhhRepository = {
  async loadDataset() {
    return { artists, tracks, labels, regions, languages, features } as Dataset
  },
}
