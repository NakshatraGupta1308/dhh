import { useMemo, useState, type ReactNode } from 'react'
import { useDhhData } from '../../hooks/useDhhData'
import { useFilters } from '../../hooks/useFilters'
import { filterTracks, type FilterKey } from '../../lib/filters'

interface Option {
  id: string
  label: string
  color?: string
  hint?: string
}

function Group({
  title,
  filterKey,
  options,
  facet,
  children,
}: {
  title: string
  filterKey: FilterKey
  options: Option[]
  facet: (key: FilterKey, id: string) => number
  children?: ReactNode
}) {
  const { filters, toggle, set } = useFilters()
  const selected = filters[filterKey]
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 flex w-full items-center justify-between">
        <span className="kicker !text-ink">{title}</span>
        {selected.length > 0 && (
          <button type="button" className="kicker hover:text-ink" onClick={() => set(filterKey, [])}>
            Clear
          </button>
        )}
      </legend>
      {children}
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o.id)
          const n = facet(filterKey, o.id)
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(filterKey, o.id)}
              disabled={!on && n === 0}
              title={o.hint}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-30 ${
                on ? 'border-ink bg-ink text-bg' : 'border-line text-ink/85 hover:border-muted'
              }`}
            >
              {o.color && <span className="size-2 rounded-full" style={{ background: o.color }} aria-hidden />}
              {o.label}
              <span className={`font-mono text-[0.65rem] ${on ? 'text-bg/60' : 'text-muted'}`}>{n}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/** All four filter groups. Used by the desktop drop-down and the mobile sheet. */
export function FilterPanel({ columns = false }: { columns?: boolean }) {
  const data = useDhhData()
  const { filters } = useFilters()
  const [query, setQuery] = useState('')

  // Facet counts: how many releases each option would show, given the other active categories.
  const facet = useMemo(() => {
    const cache = new Map<string, number>()
    return (key: FilterKey, id: string) => {
      const k = `${key}:${id}`
      let n = cache.get(k)
      if (n === undefined) {
        n = filterTracks(data, { ...filters, [key]: [id] }).length
        cache.set(k, n)
      }
      return n
    }
  }, [data, filters])

  const regionOptions = data.regions.map((r) => ({ id: r.id, label: r.name, color: r.color }))
  const languageOptions = data.languages.filter((l) => data.tracks.some((t) => t.languages.includes(l.id))).map((l) => ({ id: l.id, label: l.name }))
  const labelOptions = data.labels.map((l) => ({
    id: l.id,
    label: l.name,
    hint: l.kind === 'collective' ? 'Collective: matches releases by its members' : undefined,
  }))
  const q = query.trim().toLowerCase()
  const artistOptions = data.artists
    .filter((a) => !q || a.name.toLowerCase().includes(q) || a.aliases.some((al) => al.toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => ({ id: a.id, label: a.name, color: data.regionById.get(a.region_id)?.color }))

  return (
    <div className={columns ? 'grid gap-8 lg:grid-cols-[1fr_1fr_1.2fr_1.6fr]' : 'space-y-8'}>
      <Group title="Scene" filterKey="regions" options={regionOptions} facet={facet} />
      <Group title="Language" filterKey="languages" options={languageOptions} facet={facet} />
      <Group title="Label / Crew" filterKey="labels" options={labelOptions} facet={facet} />
      <Group title="Artist" filterKey="artists" options={artistOptions} facet={facet}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search artists or aliases"
          className="mb-3 w-full rounded-full border border-line bg-bg px-4 py-2 text-sm placeholder:text-faint focus:border-ink focus:outline-none"
        />
      </Group>
    </div>
  )
}
