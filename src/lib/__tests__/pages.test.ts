import { describe, expect, it } from 'vitest'
import { staticRepository } from '../../data/repository'
import { indexDataset } from '../indexDataset'
import { artistGenres, genreProfile, sceneProfile } from '../profiles'
import { buildSearchIndex, search } from '../search'

const data = indexDataset(await staticRepository.loadDataset())
const index = buildSearchIndex(data)

describe('search', () => {
  it('finds artists by name, alias and fuzzy letters', () => {
    expect(search(index, 'seedhe maut')[0].id).toBe('seedhe-maut')
    expect(search(index, 'vivian')[0].id).toBe('divine')
    expect(search(index, 'krsna')[0].id).toBe('krsna')
    expect(search(index, 'sdhmt').some((r) => r.id === 'seedhe-maut')).toBe(true)
  })

  it('routes each kind to its own page', () => {
    expect(search(index, 'boom bap')[0]).toMatchObject({ kind: 'genre', view: 'genre', id: 'boom-bap' })
    expect(search(index, 'boombap')[0].id).toBe('boom-bap')
    expect(search(index, 'uk drill')[0]).toMatchObject({ kind: 'genre', id: 'drill' })
    expect(search(index, 'nagpur')[0]).toMatchObject({ kind: 'scene', view: 'scene', id: 'nagpur' })
    expect(search(index, 'bantai').some((r) => r.kind === 'slang' && r.view === 'slang')).toBe(true)
    expect(search(index, 'sez on the beat')[0]).toMatchObject({ kind: 'producer', view: 'artist' })
    const release = search(index, 'kohinoor').find((r) => r.kind === 'release')!
    expect(release).toMatchObject({ view: 'artist', id: 'divine', release: 'kohinoor' })
  })

  it('returns nothing for an empty query', () => {
    expect(search(index, '   ')).toEqual([])
  })
})

describe('scene profiles', () => {
  it('splits artists and producers and lists scene releases', () => {
    const delhi = sceneProfile(data, 'delhi')!
    expect(delhi.artists.map((a) => a.id)).toContain('seedhe-maut')
    expect(delhi.producers.map((a) => a.id)).toContain('sez-on-the-beat')
    expect(delhi.artists.every((a) => a.kind !== 'producer')).toBe(true)
    expect(delhi.releases.some((t) => t.id === 'bayaan')).toBe(true)
    expect(delhi.connections.length).toBeGreaterThan(0)
  })

  it('only lists releases led by the scene, not guest spots elsewhere', () => {
    const gujarat = sceneProfile(data, 'gujarat')!
    const ids = gujarat.releases.map((t) => t.id)
    expect(ids).toContain('sultanate')
    for (const other of ['mamafication', 'vvvv', 'filam']) expect(ids).not.toContain(other)
    expect(sceneProfile(data, 'nagpur')!.releases.map((t) => t.id)).toContain('mamafication')
  })

  it('returns null for an unknown scene', () => {
    expect(sceneProfile(data, 'atlantis')).toBeNull()
  })
})

describe('genre profiles', () => {
  it('ranks the pros and lists tagged songs', () => {
    const bb = genreProfile(data, 'boom-bap')!
    expect(bb.tracks.every((t) => t.genres.includes('boom-bap'))).toBe(true)
    expect(bb.pros[0][1]).toBeGreaterThanOrEqual(bb.pros.at(-1)![1])
    expect(bb.pros.map(([a]) => a.id)).toContain('sez-on-the-beat')
  })

  it('derives an artist sound from their credits', () => {
    expect(artistGenres(data, 'divine').map(([g]) => g)).toContain('gully-rap')
  })
})

describe('listening room', () => {
  it('gives every featured artist something to play', () => {
    for (const id of data.listening.artists) {
      expect(data.listening.songs.some((s) => s.artist_ids.includes(id) || s.feat_ids.includes(id))).toBe(true)
    }
  })

  it('links songs to real archive releases', () => {
    for (const s of data.listening.songs) if (s.track_id) expect(data.trackById.has(s.track_id)).toBe(true)
  })
})

describe('beefs', () => {
  it('only credits rounds to real sides and archive tracks', () => {
    for (const b of data.beefs) {
      for (const r of b.rounds) {
        if (r.by !== null) expect(b.sides[r.by]).toBeDefined()
        for (const t of r.at) expect(b.sides[t]).toBeDefined()
        if (r.track_id) expect(data.trackById.has(r.track_id)).toBe(true)
      }
    }
  })

  it('is searchable by either side and by diss track title', () => {
    expect(search(index, 'makasam').some((r) => r.kind === 'beef' && r.id === 'kalamkaar-emiway-muhfaad')).toBe(true)
    expect(search(index, 'jani')[0]).toMatchObject({ kind: 'beef', id: 'panther-vs-jani' })
  })
})
