# DHH Explorer

A fully interactive website for DHH nerds and newbies.

DHH Explorer is a designed, motion-first archive of the Desi Hip Hop scene. Phase 1 is a discography and timeline explorer: scroll or drag through two decades of releases, filter by scene, label, language or artist, and open any artist to see their full catalog and career arc.

## Running it

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (layout engine, filters, stats)
npm run build      # validates the dataset, typechecks and builds to dist/
npm run preview    # serve the production build
```

The build output in `dist/` is fully static and uses relative paths, so it can be dropped onto any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages).

### Deployment

Every push to `main` runs `.github/workflows/deploy.yml`, which tests, builds and deploys the site to GitHub Pages. In the repo settings, Pages needs its source set to **GitHub Actions**. The live site is at https://nakshatragupta1308.github.io/dhh/.

## What is in phase 1

- **Hero**: staggered display type, a spinning record whose label is split into every scene colour, counters and looping marquees of artists and scenes.
- **Timeline (desktop)**: a horizontal track driven by vertical scroll. You can also drag it (with momentum), use a trackpad sideways, use the arrow keys, or scrub the minimap at the bottom. The minimap bars are stacked by scene colour. Busy years get more room and empty years shrink, so the layout never overlaps. A giant outline year in the background follows where you are.
- **Timeline (mobile)**: a separate, touch-first design. It has a vertical spine that fills as you scroll, sticky year chips for jumping around, and a swipe-to-dismiss bottom sheet for filters.
- **Filters**: scene, language, label or crew, and artist (with alias search). Values within a group are OR-ed and groups are AND-ed. Every option shows how many releases it would return.
- **Search**: the header search (or Ctrl K, or `/`) covers artists, producers, scenes, genres, slang terms, releases and pages. Arrow keys and Enter work, and every result opens its own page.
- **Artist pages** (`?view=artist&id=divine`): stats, a career arc chart, the full discography grouped by year, collaborators, their sound (genres), scene and labels. Producers get a producer layout that leads with their productions and the artists they worked with. `&release=kohinoor` highlights one release, and old `?artist=` links still work.
- **Scene pages** (`?view=scene&id=delhi`): the artists and producers who run the scene, every release led by an artist from the scene (guest spots stay with the lead artist's scene), the scene's sound, connected scenes and labels, plus a button to replay the scene on the timeline.
- **Genre pages** (`?view=genre&id=boom-bap`, index at `?view=genres`): what the genre is, how it sounds, where it comes from, its pros ranked by releases, and every tagged song.
- **Slang page** (`?view=slang`): a glossary of DHH slang and terms, filterable by street slang, rap craft, culture and industry, linked to the artists and songs behind them.
- **Scenes and Roster**: region cards that replay the timeline filtered to that scene, and a grid of every artist.
- **Producers page** (`?view=producers`): every beatmaker in the archive, ranked by production credits. Each one shows their hits and every artist they have worked with. All of it is derived from `features.json`, so a new producer credit shows up automatically.

## Project structure

```
src/
  components/
    timeline/        Horizontal + vertical timelines, release cards, minimap
    artist-card/     Roster cards, artist detail view, career arc chart
    filters/         Filter bar, shared filter panel, mobile sheet
    layout/          Header, hero, scenes, section headings, footer
    producers/       Producers page rows and the equaliser motif
    search/          The search panel
    common/          Generated cover art, small shared bits
  data/              artists, tracks, labels, regions, languages, features (JSON)
                     repository.ts is the only place the UI learns where data comes from
  hooks/             Data, filter and selection providers, media and size hooks
  lib/               Pure logic: indexing, filtering, timeline layout, artist stats
  styles/            tokens.css (design tokens) and global.css
  pages/             Home, Producers, Artist, Scene, Genre, Genres and Slang pages, switched by a small
                     query-string router (hooks/useView.tsx) that needs no server rewrites
data-scripts/
  validate.mjs       Dataset integrity checks, run automatically before every build
```

## Data model

The model follows the project spec, so each later phase adds to it instead of migrating it.

| File | Fields |
| --- | --- |
| `artists.json` | id, name, aliases, kind, region_id, languages, active_from, active_to, label_ids, image_url, bio, confidence |
| `tracks.json` | id, title, artist_ids, release_date, date_precision, type, label_id, album_or_ep, languages, genres, cover_art_url, external_links, lyrics, confidence, note |
| `labels.json` | id, name, kind (independent, major, collective), founded_year, roster |
| `features.json` | track_id, artist_id, role (main, feature, producer) |
| `regions.json` | id, name, description, color |
| `languages.json` | id, name |
| `genres.json` | id, name, aliases, color, tagline, description, sound, origins |
| `slang.json` | id, term, aliases, category, meaning, example, related_artist_ids, related_track_ids |

A few notes:

- `features.json` is the many-to-many credits table. It powers the timeline credits, artist catalogs and the collaborator list today, and the collaboration graph in phase 5 with no schema change.
- `date_precision` is `day`, `month` or `year`. Dates are stored as full ISO dates, but the UI only shows the precision we actually know.
- `confidence` (`high`, `medium`, `low`) flags entries that still need a second source. Low confidence releases are labelled in the artist view.
- `lyrics`, `cover_art_url`, `image_url` and the Spotify and YouTube ids are nullable and ready for later phases. Until they are filled in, artwork is generated from the title and scene colour, and listening links open a platform search.
- The region `color` is used everywhere that scene appears.
- Genre tags on releases are editorial and many releases carry more than one. Genre pages rank their pros from these tags, so tagging a release updates the page automatically.

### Adding to the dataset

1. Add or edit entries in `src/data/*.json`.
2. Every artist on a track in `artist_ids` needs a matching `main` row in `features.json`. Guests and producers get `feature` or `producer` rows.
3. Label rosters and artist `label_ids` must mirror each other.
4. Run `npm run validate-data`. It checks ids, references, credits, rosters, date formats and house style, and the build refuses to run if anything is off.

The current seed is a hand-built first pass: 51 artists, 113 releases, 16 labels and crews, and 13 scenes. Treat anything marked `medium` or `low` as needing verification before a public launch. Haryana, the Northeast and more producers are the obvious gaps to fill next.

## Swapping the data source

Components never import JSON directly. They read from `useDhhData()`, which is fed by a `DhhRepository`:

```ts
export interface DhhRepository {
  loadDataset(): Promise<Dataset>
}
```

Phase 3 can pass an API-backed repository to `<DataProvider>` in `App.tsx`, and the UI layer stays untouched.

## Design system

All tokens live in `src/styles/tokens.css` and are exposed as Tailwind v4 utilities (`bg-surface`, `text-muted`, `font-display` and so on):

- **Type**: Anton for display, Inter for reading, Space Mono for metadata.
- **Colour**: a near-black base, a warm off-white ink, one red accent, plus one colour per scene from `regions.json`.
- **Motion**: a single snap easing curve, spring physics for layout changes, and `prefers-reduced-motion` respected across the hero, marquees and timeline.

## Stack

React 19, Vite, TypeScript, Tailwind CSS v4, Motion (for scroll, layout and gesture animation) and Vitest. The timeline layout is a small custom engine in `src/lib/timelineLayout.ts` rather than a chart library, because the timeline is the main design element and needs full control.

## Roadmap

1. **Phase 2**: lyrics and rhyme scheme analysis, handling code switching across Hindi, Punjabi, Haryanvi and English.
2. **Phase 3**: a scene stats dashboard with live streaming and video data. This is the point where the project moves to a real database.
3. **Phase 4**: rules-based recommendations ("if you like X, try Y") built on region, language, era and collaborators.
4. **Phase 5**: a collaboration network graph built directly from `features.json`.
