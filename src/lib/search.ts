import type { View } from '../hooks/useView'
import type { IndexedDataset } from './indexDataset'

export type ResultKind = 'artist' | 'producer' | 'scene' | 'genre' | 'beef' | 'hustle' | 'slang' | 'release' | 'page'

export interface SearchEntry {
  kind: ResultKind
  key: string
  title: string
  subtitle: string
  color: string
  /** Extra strings that should match: aliases, languages, and so on. */
  keywords: string[]
  view: View
  id?: string
  release?: string
}

export interface SearchResult extends SearchEntry {
  score: number
}

export const KIND_LABEL: Record<ResultKind, string> = {
  artist: 'Artists',
  producer: 'Producers',
  scene: 'Scenes',
  genre: 'Genres',
  beef: 'Beef',
  hustle: 'MTV Hustle',
  slang: 'Slang and terms',
  release: 'Releases',
  page: 'Pages',
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\$/g, 's')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function buildSearchIndex(data: IndexedDataset): SearchEntry[] {
  const entries: SearchEntry[] = []
  const regionColor = (id: string) => data.regionById.get(id)?.color ?? '#ff3b30'

  for (const a of data.artists) {
    const producer = a.kind === 'producer'
    entries.push({
      kind: producer ? 'producer' : 'artist',
      key: `a:${a.id}`,
      title: a.name,
      subtitle: `${producer ? 'Producer' : a.kind === 'group' ? 'Group' : 'Artist'} / ${data.regionById.get(a.region_id)?.name ?? ''}`,
      color: regionColor(a.region_id),
      keywords: a.aliases,
      view: 'artist',
      id: a.id,
    })
  }
  for (const r of data.regions) {
    entries.push({ kind: 'scene', key: `r:${r.id}`, title: r.name, subtitle: 'Scene', color: r.color, keywords: [`${r.name} hip hop`, `${r.name} rap`], view: 'scene', id: r.id })
  }
  for (const g of data.genres) {
    entries.push({ kind: 'genre', key: `g:${g.id}`, title: g.name, subtitle: g.tagline, color: g.color, keywords: g.aliases, view: 'genre', id: g.id })
  }
  for (const b of data.beefs) {
    entries.push({
      kind: 'beef',
      key: `b:${b.id}`,
      title: b.title,
      subtitle: `${b.years} / ${b.rounds.filter((r) => r.by !== null).length} rounds`,
      color: '#ff3b30',
      keywords: [...b.sides.map((s) => s.name), ...b.rounds.map((r) => r.title), 'diss', 'beef'],
      view: 'beef',
      id: b.id,
    })
  }
  for (const s of data.hustle.seasons) {
    const winner = s.contestants.find((c) => c.result === 'Winner')
    entries.push({
      kind: 'hustle',
      key: `h:${s.number}`,
      title: `MTV Hustle season ${s.number}`,
      subtitle: `${s.title} / ${s.year}${winner ? ` / won by ${winner.name}` : ''}`,
      color: '#ffb703',
      keywords: [s.title, s.full_title, `hustle ${s.number}`, `hustle s${s.number}`, ...s.contestants.map((c) => c.name), ...s.judges.map((j) => j.name), ...s.hosts.map((h) => h.name)],
      view: 'hustle',
      id: String(s.number),
    })
  }
  for (const s of data.slang) {
    entries.push({ kind: 'slang', key: `s:${s.id}`, title: s.term, subtitle: s.meaning, color: '#ff3b30', keywords: s.aliases, view: 'slang', id: s.id })
  }
  for (const t of data.tracks) {
    const names = t.artist_ids.map((id) => data.artistById.get(id)?.name ?? id)
    const lead = data.artistById.get(t.artist_ids[0])
    entries.push({
      kind: 'release',
      key: `t:${t.id}`,
      title: t.title,
      subtitle: `${names.join(' & ')} / ${t.release_date.slice(0, 4)}`,
      color: lead ? regionColor(lead.region_id) : '#ff3b30',
      keywords: t.album_or_ep ? [t.album_or_ep] : [],
      view: 'artist',
      id: t.artist_ids[0],
      release: t.id,
    })
  }
  const pages: [string, string, View, string[]][] = [
    ['Timeline', 'Every release, year by year', 'home', ['home', 'releases', 'discography']],
    ['Producers', 'Everyone behind the beats', 'producers', ['beatmakers', 'beats']],
    ['Genres', 'Every sound in the archive', 'genres', ['styles', 'sounds']],
    ['Slang and terms', 'The DHH glossary', 'slang', ['glossary', 'dictionary', 'words', 'terminology', 'lingo']],
    ['Beef', 'Every famous feud, round by round', 'beef', ['beefs', 'diss tracks', 'feuds', 'disses']],
    ['MTV Hustle', 'The rap reality show, all five seasons', 'hustle', ['hustle', 'mtv', 'reality show', 'contestants', 'judges']],
    ['Listen', 'Play DHH songs right here', 'listen', ['listening room', 'play', 'music', 'player', 'songs', 'radio']],
  ]
  for (const [title, subtitle, view, keywords] of pages) {
    entries.push({ kind: 'page', key: `p:${view}`, title, subtitle, color: '#f4f1ea', keywords, view })
  }
  return entries
}

/** Scores one entry against a query: exact beats prefix beats word prefix beats substring beats fuzzy. */
function scoreText(q: string, text: string): number {
  const t = normalize(text)
  if (!t) return 0
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.split(' ').some((w) => w.startsWith(q))) return 65
  if (t.includes(q)) return 45
  // Letters in order (so "sdhmt" finds "Seedhe Maut"), only for 3+ characters.
  if (q.length >= 3) {
    let i = 0
    for (const ch of t.replace(/ /g, '')) if (ch === q[i]) i++
    if (i === q.replace(/ /g, '').length) return 15
  }
  return 0
}

const KIND_BOOST: Record<ResultKind, number> = { artist: 6, producer: 6, scene: 5, genre: 5, beef: 4, hustle: 3, page: 4, slang: 3, release: 0 }

export function search(index: SearchEntry[], query: string, limit = 24): SearchResult[] {
  const q = normalize(query)
  if (!q) return []
  const results: SearchResult[] = []
  for (const e of index) {
    const best = Math.max(scoreText(q, e.title), ...e.keywords.map((k) => scoreText(q, k) - 5))
    if (best > 0) results.push({ ...e, score: best + KIND_BOOST[e.kind] })
  }
  // Fuzzy letter matches are a fallback: drop them once anything matches for real.
  const FUZZY_MAX = 15 + Math.max(...Object.values(KIND_BOOST))
  const hasReal = results.some((r) => r.score > FUZZY_MAX)
  return (hasReal ? results.filter((r) => r.score > FUZZY_MAX) : results).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit)
}
