import { describe, expect, it } from 'vitest'
import { staticRepository } from '../../data/repository'
import { artistCredits, collaborators, producerProfiles } from '../artistStats'
import { EMPTY_FILTERS, filterTracks } from '../filters'
import { formatReleaseDate, indexDataset } from '../indexDataset'
import { DEFAULT_LAYOUT, layoutTimeline } from '../timelineLayout'

const data = indexDataset(await staticRepository.loadDataset())

describe('indexDataset', () => {
  it('sorts the timeline oldest first', () => {
    const dates = data.timeline.map((t) => t.release_date)
    expect(dates).toEqual([...dates].sort())
  })

  it('formats dates according to their precision', () => {
    expect(formatReleaseDate(data.trackById.get('kohinoor')!)).toBe('Oct 2019')
    expect(formatReleaseDate(data.trackById.get('bayaan')!)).toBe('2018')
  })
})

describe('filterTracks', () => {
  it('returns everything with no filters', () => {
    expect(filterTracks(data, EMPTY_FILTERS)).toHaveLength(data.tracks.length)
  })

  it('matches artists on any credit, including production', () => {
    const ids = filterTracks(data, { ...EMPTY_FILTERS, artists: ['sez-on-the-beat'] }).map((t) => t.id)
    expect(ids).toEqual(expect.arrayContaining(['mere-gully-mein', 'class-sikh', 'bayaan']))
  })

  it('ANDs categories and ORs values inside one', () => {
    const delhiHindi = filterTracks(data, { ...EMPTY_FILTERS, regions: ['delhi'], languages: ['hi'] })
    expect(delhiHindi.length).toBeGreaterThan(0)
    for (const t of delhiHindi) {
      expect(t.languages).toContain('hi')
      expect(t.artist_ids.some((a) => data.artistById.get(a)?.region_id === 'delhi')).toBe(true)
    }
    const either = filterTracks(data, { ...EMPTY_FILTERS, regions: ['kerala', 'chennai'] })
    const kerala = filterTracks(data, { ...EMPTY_FILTERS, regions: ['kerala'] })
    const chennai = filterTracks(data, { ...EMPTY_FILTERS, regions: ['chennai'] })
    expect(either).toHaveLength(kerala.length + chennai.length)
  })

  it('treats collectives as membership, labels as the releasing label', () => {
    const mafia = filterTracks(data, { ...EMPTY_FILTERS, labels: ['mafia-mundeer'] })
    expect(mafia.some((t) => t.id === 'dj-waley-babu')).toBe(true)
    const azadi = filterTracks(data, { ...EMPTY_FILTERS, labels: ['azadi-records'] })
    expect(azadi.every((t) => t.label_id === 'azadi-records')).toBe(true)
  })
})

describe('layoutTimeline', () => {
  const layout = layoutTimeline(data.timeline, data.yearRange)

  it('places every release once and keeps years in order', () => {
    expect(layout.items).toHaveLength(data.tracks.length)
    const years = layout.years.map((y) => y.year)
    expect(years[0]).toBe(data.yearRange[0])
    expect(years.at(-1)).toBe(data.yearRange[1])
    for (let i = 1; i < layout.years.length; i++) {
      expect(layout.years[i].x).toBe(layout.years[i - 1].x + layout.years[i - 1].width)
    }
  })

  it('never overlaps two cards in the same lane', () => {
    const byLane = new Map<number, number[]>()
    for (const item of layout.items) byLane.set(item.lane, [...(byLane.get(item.lane) ?? []), item.x])
    for (const xs of byLane.values()) {
      xs.sort((a, b) => a - b)
      for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(DEFAULT_LAYOUT.cardWidth)
    }
  })

  it('keeps each card inside its own year block', () => {
    for (const item of layout.items) {
      const year = Number(item.track.release_date.slice(0, 4))
      const block = layout.years.find((y) => y.year === year)!
      expect(item.x).toBeGreaterThanOrEqual(block.x)
      expect(item.x + DEFAULT_LAYOUT.cardWidth).toBeLessThanOrEqual(block.x + block.width)
    }
  })

  it('compresses empty years', () => {
    const empty = layout.years.filter((y) => y.count === 0)
    expect(empty.length).toBeGreaterThan(0)
    for (const y of empty) expect(y.width).toBe(DEFAULT_LAYOUT.emptyYearWidth)
  })
})

describe('producer profiles', () => {
  const profiles = producerProfiles(data)

  it('includes producers and anyone with a producer credit, busiest first', () => {
    const ids = profiles.map((p) => p.artist.id)
    expect(ids).toEqual(expect.arrayContaining(['sez-on-the-beat', 'karan-kanchan', 'naam-sujal']))
    for (let i = 1; i < profiles.length; i++) {
      expect(profiles[i - 1].productions.length).toBeGreaterThanOrEqual(profiles[i].productions.length)
    }
  })

  it('lists hits and the artists they worked with', () => {
    const umair = profiles.find((p) => p.artist.id === 'umair')!
    expect(umair.productions.map((t) => t.id)).toEqual(['joota-japani', 'hola-amigo'])
    expect(umair.collaborators.map((c) => c.artist.id).sort()).toEqual(['krsna', 'seedhe-maut'])
  })
})

describe('artist stats', () => {
  it('collects every role an artist holds', () => {
    const credits = artistCredits(data, 'naezy')
    expect(credits.map((c) => c.track.id)).toEqual(['aafat', 'mere-gully-mein'])
    expect(credits[1].roles).toEqual(['feature'])
  })

  it('derives collaborators from the credits table', () => {
    const names = collaborators(data, 'sez-on-the-beat').map((c) => c.artist.id)
    expect(names).toEqual(expect.arrayContaining(['divine', 'naezy', 'prabh-deep', 'seedhe-maut']))
  })

  it('counts a shared track once even when the artist holds two roles on it', () => {
    const prathamesh = collaborators(data, 'naam-sujal').find((c) => c.artist.id === 'prathamesh')
    expect(prathamesh?.shared).toBe(1)
  })
})
