// Validates the static dataset in src/data. Run with `npm run validate-data`.
// Exits non-zero on any integrity problem so broken data never ships.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data')
const load = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, `${name}.json`), 'utf8'))

const artists = load('artists')
const tracks = load('tracks')
const labels = load('labels')
const regions = load('regions')
const languages = load('languages')
const features = load('features')
const genres = load('genres')
const slang = load('slang')

const errors = []
const fail = (msg) => errors.push(msg)

function indexById(list, name) {
  const map = new Map()
  for (const item of list) {
    if (!item.id) fail(`${name}: entry without id`)
    if (map.has(item.id)) fail(`${name}: duplicate id "${item.id}"`)
    map.set(item.id, item)
  }
  return map
}

const artistById = indexById(artists, 'artists')
const trackById = indexById(tracks, 'tracks')
const labelById = indexById(labels, 'labels')
const regionById = indexById(regions, 'regions')
const languageById = indexById(languages, 'languages')
const genreById = indexById(genres, 'genres')
indexById(slang, 'slang')

const CONFIDENCE = new Set(['high', 'medium', 'low'])
const ROLES = new Set(['main', 'feature', 'producer'])
const PRECISION = new Set(['day', 'month', 'year'])
const TRACK_TYPES = new Set(['single', 'album', 'ep', 'mixtape', 'track', 'soundtrack', 'collection'])

for (const r of regions) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(r.color)) fail(`regions: "${r.id}" color must be #RRGGBB`)
}

for (const a of artists) {
  if (!regionById.has(a.region_id)) fail(`artists: "${a.id}" unknown region "${a.region_id}"`)
  for (const l of a.languages) if (!languageById.has(l)) fail(`artists: "${a.id}" unknown language "${l}"`)
  for (const l of a.label_ids) {
    const label = labelById.get(l)
    if (!label) fail(`artists: "${a.id}" unknown label "${l}"`)
    else if (!label.roster.includes(a.id)) fail(`labels: "${l}" roster is missing "${a.id}"`)
  }
  if (a.active_to !== null && a.active_to < a.active_from) fail(`artists: "${a.id}" active_to before active_from`)
  if (!CONFIDENCE.has(a.confidence)) fail(`artists: "${a.id}" bad confidence`)
}

for (const l of labels) {
  for (const id of l.roster) {
    const artist = artistById.get(id)
    if (!artist) fail(`labels: "${l.id}" roster has unknown artist "${id}"`)
    else if (!artist.label_ids.includes(l.id)) fail(`artists: "${id}" label_ids missing "${l.id}"`)
  }
}

for (const t of tracks) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.release_date) || Number.isNaN(Date.parse(t.release_date))) fail(`tracks: "${t.id}" bad release_date`)
  if (!PRECISION.has(t.date_precision)) fail(`tracks: "${t.id}" bad date_precision`)
  if (!TRACK_TYPES.has(t.type)) fail(`tracks: "${t.id}" bad type "${t.type}"`)
  if (t.label_id !== null && !labelById.has(t.label_id)) fail(`tracks: "${t.id}" unknown label "${t.label_id}"`)
  if (t.artist_ids.length === 0) fail(`tracks: "${t.id}" has no artists`)
  for (const a of t.artist_ids) {
    if (!artistById.has(a)) fail(`tracks: "${t.id}" unknown artist "${a}"`)
    if (!features.some((f) => f.track_id === t.id && f.artist_id === a && f.role === 'main')) {
      fail(`features: missing main credit for "${a}" on "${t.id}"`)
    }
  }
  for (const l of t.languages) if (!languageById.has(l)) fail(`tracks: "${t.id}" unknown language "${l}"`)
  if (!CONFIDENCE.has(t.confidence)) fail(`tracks: "${t.id}" bad confidence`)
  if (!Array.isArray(t.genres)) fail(`tracks: "${t.id}" genres must be an array`)
  else for (const g of t.genres) if (!genreById.has(g)) fail(`tracks: "${t.id}" unknown genre "${g}"`)
}

const seenCredits = new Set()
for (const f of features) {
  const key = `${f.track_id}|${f.artist_id}|${f.role}`
  if (seenCredits.has(key)) fail(`features: duplicate credit ${key}`)
  seenCredits.add(key)
  if (!trackById.has(f.track_id)) fail(`features: unknown track "${f.track_id}"`)
  if (!artistById.has(f.artist_id)) fail(`features: unknown artist "${f.artist_id}"`)
  if (!ROLES.has(f.role)) fail(`features: bad role "${f.role}"`)
  if (f.role === 'main' && !trackById.get(f.track_id)?.artist_ids.includes(f.artist_id)) {
    fail(`features: "${f.artist_id}" is main on "${f.track_id}" but not in its artist_ids`)
  }
}

for (const g of genres) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(g.color)) fail(`genres: "${g.id}" color must be #RRGGBB`)
  if (!tracks.some((t) => t.genres?.includes(g.id))) fail(`genres: "${g.id}" has no tagged releases`)
}

const SLANG_CATEGORIES = new Set(['craft', 'culture', 'street', 'industry'])
for (const s of slang) {
  if (!SLANG_CATEGORIES.has(s.category)) fail(`slang: "${s.id}" bad category "${s.category}"`)
  for (const a of s.related_artist_ids ?? []) if (!artistById.has(a)) fail(`slang: "${s.id}" unknown artist "${a}"`)
  for (const t of s.related_track_ids ?? []) if (!trackById.has(t)) fail(`slang: "${s.id}" unknown track "${t}"`)
}

// House style: no em dashes anywhere in the dataset.
for (const name of ['artists', 'tracks', 'labels', 'regions', 'languages', 'features', 'genres', 'slang']) {
  const raw = fs.readFileSync(path.join(dataDir, `${name}.json`), 'utf8')
  if (raw.includes(String.fromCharCode(0x2014))) fail(`${name}: contains an em dash`)
}

for (const a of artists) {
  if (!features.some((f) => f.artist_id === a.id)) fail(`artists: "${a.id}" has no credits`)
}

if (errors.length) {
  console.error(`Dataset validation failed with ${errors.length} problem(s):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

console.log(
  `Dataset OK: ${artists.length} artists, ${tracks.length} releases, ${labels.length} labels, ` +
    `${regions.length} regions, ${features.length} credits, ${genres.length} genres, ${slang.length} slang terms.`,
)
