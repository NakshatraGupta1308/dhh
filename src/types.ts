// Shared data model. Every later phase (lyrics, stats, recommendations,
// collaboration graph) extends these types instead of replacing them.

export type Confidence = 'high' | 'medium' | 'low'
export type DatePrecision = 'day' | 'month' | 'year'
export type ReleaseType = 'single' | 'album' | 'ep' | 'mixtape' | 'track' | 'soundtrack' | 'collection'
export type CreditRole = 'main' | 'feature' | 'producer'
export type ArtistKind = 'rapper' | 'group' | 'producer' | 'singer'
export type LabelKind = 'independent' | 'major' | 'collective'

export interface Region {
  id: string
  name: string
  description: string
  color: string
}

export interface Language {
  id: string
  name: string
}

export interface Artist {
  id: string
  name: string
  aliases: string[]
  kind: ArtistKind
  region_id: string
  languages: string[]
  active_from: number
  active_to: number | null
  label_ids: string[]
  image_url: string | null
  bio: string
  confidence: Confidence
}

export interface Track {
  id: string
  title: string
  artist_ids: string[]
  release_date: string
  date_precision: DatePrecision
  type: ReleaseType
  label_id: string | null
  album_or_ep: string | null
  languages: string[]
  genres: string[]
  cover_art_url: string | null
  external_links: { spotify: string | null; youtube: string | null }
  lyrics: string | null
  confidence: Confidence
  note: string | null
}

export interface Label {
  id: string
  name: string
  kind: LabelKind
  founded_year: number | null
  roster: string[]
}

export interface Credit {
  track_id: string
  artist_id: string
  role: CreditRole
}

export interface Genre {
  id: string
  name: string
  aliases: string[]
  color: string
  tagline: string
  description: string
  sound: string[]
  origins: string
}

export type SlangCategory = 'craft' | 'culture' | 'street' | 'industry'

export interface SlangTerm {
  id: string
  term: string
  aliases: string[]
  category: SlangCategory
  meaning: string
  example: string
  related_artist_ids?: string[]
  related_track_ids?: string[]
}

/** A song that can be played in the Listening Room, embedded from YouTube. */
export interface ListeningSong {
  id: string
  title: string
  artist_ids: string[]
  feat_ids: string[]
  youtube_id: string
  year: number | null
  /** The archive release this song belongs to, when there is one. */
  track_id: string | null
  note: string | null
}

export interface ListeningRoom {
  /** Artists featured in the Listening Room, in display order. */
  artists: string[]
  songs: ListeningSong[]
}

export interface Dataset {
  artists: Artist[]
  tracks: Track[]
  labels: Label[]
  regions: Region[]
  languages: Language[]
  features: Credit[]
  genres: Genre[]
  slang: SlangTerm[]
  listening: ListeningRoom
}
