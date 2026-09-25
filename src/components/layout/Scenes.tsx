import { motion } from 'motion/react'
import { useDhhData } from '../../hooks/useDhhData'
import { useFilters } from '../../hooks/useFilters'
import { SectionHeading } from './SectionHeading'

export function Scenes() {
  const data = useDhhData()
  const { set, clear } = useFilters()

  const focus = (regionId: string) => {
    clear()
    set('regions', [regionId])
    document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="scenes" className="mx-auto max-w-[1600px] px-4 py-24 sm:px-8">
      <SectionHeading kicker={`${data.regions.length} scenes, one colour each`} title="The Scenes">
        Every city and state gets its own colour, used everywhere it appears. Pick a scene to replay the timeline through its lens.
      </SectionHeading>
      <div className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {data.regions.map((r, i) => {
          const artists = data.artists.filter((a) => a.region_id === r.id)
          const releases = data.tracks.filter((t) => t.artist_ids.some((id) => data.artistById.get(id)?.region_id === r.id)).length
          return (
            <motion.button
              key={r.id}
              type="button"
              onClick={() => focus(r.id)}
              className="group relative flex min-h-64 flex-col justify-between overflow-hidden bg-surface p-6 text-left"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.6 }}
              whileHover="hover"
            >
              <motion.span
                aria-hidden
                className="absolute inset-0 origin-left"
                style={{ background: r.color }}
                initial={{ scaleX: 0 }}
                variants={{ hover: { scaleX: 1 } }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
              <div className="relative flex items-center justify-between">
                <span className="size-3 rounded-full transition-colors group-hover:!bg-bg" style={{ background: r.color }} />
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted transition-colors group-hover:text-bg">
                  {artists.length} artist{artists.length === 1 ? '' : 's'} / {releases} release{releases === 1 ? '' : 's'}
                </span>
              </div>
              <div className="relative">
                <h3 className="font-display text-5xl uppercase leading-none transition-colors group-hover:text-bg">{r.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted transition-colors group-hover:text-bg/80">{r.description}</p>
                <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-[0.14em] opacity-0 transition-opacity group-hover:text-bg group-hover:opacity-100">
                  Replay this scene on the timeline →
                </p>
              </div>
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
