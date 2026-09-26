import type { Hustle } from '../types'

export interface HustleRole {
  season: number
  year: number
  /** For example "Winner", "Judge" or "Squad boss (Raga Ragers)". */
  role: string
}

/** Every part an artist played on MTV Hustle, season by season. */
export function hustleRoles(hustle: Hustle, artistId: string): HustleRole[] {
  const roles: HustleRole[] = []
  for (const s of hustle.seasons) {
    const add = (role: string) => roles.push({ season: s.number, year: s.year, role })
    const c = s.contestants.find((p) => p.artist_id === artistId)
    if (c) add(c.result === 'Contestant' || c.result === 'Top 16' ? 'Contestant' : c.result)
    if (s.judges.some((p) => p.artist_id === artistId)) add('Judge')
    const boss = s.squad_bosses.find((p) => p.artist_id === artistId)
    if (boss) add(boss.squad ? `Squad boss (${boss.squad})` : 'Squad boss')
    if (s.hosts.some((p) => p.artist_id === artistId)) add('Host')
    if (s.guests.some((p) => p.artist_id === artistId)) add('Guest')
  }
  return roles
}
