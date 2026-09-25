import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { ArtistDetail } from '../components/artist-card/ArtistDetail'
import { Footer } from '../components/layout/Footer'
import { SiteHeader } from '../components/layout/SiteHeader'
import { BeatBars } from '../components/producers/BeatBars'
import { ProducerRow } from '../components/producers/ProducerRow'
import { useDhhData } from '../hooks/useDhhData'
import { producerProfiles } from '../lib/artistStats'

const EASE = [0.22, 1, 0.36, 1] as const

export function ProducersPage() {
  const data = useDhhData()
  const profiles = useMemo(() => producerProfiles(data), [data])
  const [region, setRegion] = useState<string | null>(null)
  const shown = region ? profiles.filter((p) => p.artist.region_id === region) : profiles
  const regionsWithProducers = data.regions.filter((r) => profiles.some((p) => p.artist.region_id === r.id))

  const productionCredits = profiles.reduce((n, p) => n + p.productions.length, 0)
  const served = new Set(profiles.flatMap((p) => p.collaborators.map((c) => c.artist.id))).size

  return (
    <div className="grain">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden pt-24">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] opacity-15 [mask-image:linear-gradient(to_top,black_40%,transparent)]">
            <BeatBars colors={data.regions.map((r) => r.color)} bars={64} />
          </div>
          <div className="relative mx-auto max-w-[1600px] px-4 pb-16 sm:px-8">
            <motion.p className="kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <span className="text-accent">●</span> Behind the beats
            </motion.p>
            <h1 className="mt-4 font-display text-[clamp(4rem,19vw,17rem)] uppercase leading-[0.82]" aria-label="The Producers">
              {['The', 'Producers'].map((word, w) => (
                <span key={word} className="flex overflow-hidden pb-[0.04em]" aria-hidden>
                  <motion.span
                    className={w === 1 ? 'text-outline' : ''}
                    initial={{ y: '105%' }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.25 + w * 0.15, duration: 0.9, ease: EASE }}
                  >
                    {word}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.div
              className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8, ease: EASE }}
            >
              <p className="max-w-xl text-lg leading-relaxed text-muted">
                The people who build the sound before a single bar is written.{' '}
                <span className="text-ink">Every hit they produced in the archive, and every artist they have worked with.</span>
              </p>
              <div className="grid grid-cols-3 gap-4 border-t border-line pt-5">
                {[
                  [profiles.length, 'Producers'],
                  [productionCredits, 'Production credits'],
                  [served, 'Artists worked with'],
                ].map(([n, label]) => (
                  <div key={label}>
                    <div className="font-display text-4xl leading-none sm:text-5xl">{n}</div>
                    <div className="kicker mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 pb-24 sm:px-8">
          <div className="no-scrollbar -mx-4 mb-6 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <button
              type="button"
              onClick={() => setRegion(null)}
              className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.12em] ${!region ? 'border-ink bg-ink text-bg' : 'border-line text-muted'}`}
            >
              All scenes
            </button>
            {regionsWithProducers.map((r) => (
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
          {shown.map((p, i) => (
            <ProducerRow key={p.artist.id} profile={p} index={i} />
          ))}
        </section>
      </main>
      <Footer />
      <ArtistDetail />
    </div>
  )
}
