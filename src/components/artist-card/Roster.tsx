import { useMemo, useState } from 'react'
import { useDhhData } from '../../hooks/useDhhData'
import { SectionHeading } from '../layout/SectionHeading'
import { ArtistCard } from './ArtistCard'

export function Roster() {
  const data = useDhhData()
  const [region, setRegion] = useState<string | null>(null)
  const artists = useMemo(
    () =>
      data.artists
        .filter((a) => !region || a.region_id === region)
        .sort((a, b) => a.active_from - b.active_from || a.name.localeCompare(b.name)),
    [data.artists, region],
  )

  return (
    <section id="roster" className="mx-auto max-w-[1600px] px-4 py-24 sm:px-8">
      <SectionHeading kicker={`${data.artists.length} artists, producers and crews`} title="The Roster">
        Ordered by when they first hit the scene. Tap anyone to open their full catalog and career arc.
      </SectionHeading>
      <div className="no-scrollbar -mx-4 mb-8 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          type="button"
          onClick={() => setRegion(null)}
          className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.12em] ${!region ? 'border-ink bg-ink text-bg' : 'border-line text-muted'}`}
        >
          All scenes
        </button>
        {data.regions.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRegion(region === r.id ? null : r.id)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.12em]"
            style={region === r.id ? { background: r.color, borderColor: r.color, color: '#0a0a0b' } : { borderColor: 'var(--color-line)', color: 'var(--color-muted)' }}
          >
            <span className="size-1.5 rounded-full" style={{ background: region === r.id ? '#0a0a0b' : r.color }} />
            {r.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {artists.map((a, i) => (
          <ArtistCard key={a.id} artist={a} index={i} />
        ))}
      </div>
    </section>
  )
}
