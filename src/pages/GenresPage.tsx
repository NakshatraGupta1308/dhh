import { motion } from 'motion/react'
import { PageShell } from '../components/layout/PageShell'
import { useDhhData } from '../hooks/useDhhData'
import { useView } from '../hooks/useView'

export function GenresPage() {
  const data = useDhhData()
  const { navigate } = useView()
  return (
    <PageShell>
      <section className="mx-auto max-w-[1600px] px-4 pb-24 pt-28 sm:px-8">
        <p className="kicker">◆ The sounds of DHH</p>
        <h1 className="mt-3 font-display text-[clamp(4rem,16vw,13rem)] uppercase leading-[0.82]">Genres</h1>
        <p className="mt-6 max-w-xl text-lg text-muted">Every lane the scene rides, from dusty boom bap to Punjabi chart bangers. Pick one to meet its pros and hear its records.</p>
        <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {data.genres.map((g, i) => {
            const n = data.tracks.filter((t) => t.genres.includes(g.id)).length
            return (
              <motion.button
                key={g.id}
                type="button"
                onClick={() => navigate('genre', { id: g.id })}
                className="group relative flex min-h-40 flex-col sm:min-h-60 justify-between overflow-hidden bg-surface p-6 text-left"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 4) * 0.06 }}
                whileHover="hover"
              >
                <motion.span
                  aria-hidden
                  className="absolute inset-0 origin-bottom"
                  style={{ background: g.color }}
                  initial={{ scaleY: 0 }}
                  variants={{ hover: { scaleY: 1 } }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                />
                <span className="relative font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted group-hover:text-bg">{n} releases</span>
                <span className="relative">
                  <span className="block font-display text-4xl uppercase leading-none group-hover:text-bg">{g.name}</span>
                  <span className="mt-2 block text-sm text-muted group-hover:text-bg/80">{g.tagline}</span>
                </span>
              </motion.button>
            )
          })}
        </div>
      </section>
    </PageShell>
  )
}
