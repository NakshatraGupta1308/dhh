import { useDhhData } from '../../hooks/useDhhData'
import { useView, type View } from '../../hooks/useView'

export function Footer() {
  const data = useDhhData()
  const { navigate } = useView()
  const unverified = data.tracks.filter((t) => t.confidence !== 'high').length
  const links: [string, View][] = [['Timeline', 'home'], ['Producers', 'producers'], ['Genres', 'genres'], ['Slang and terms', 'slang']]
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-16 sm:px-8 md:grid-cols-[2fr_1fr]">
        <div>
          <p className="font-display text-[clamp(3rem,9vw,7rem)] uppercase leading-[0.85]">
            Keep it <span className="text-outline [--outline:var(--color-accent)]">desi.</span>
          </p>
          <nav className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {links.map(([label, view]) => (
              <button key={view} type="button" onClick={() => navigate(view)} className="kicker hover:text-ink">
                {label} →
              </button>
            ))}
          </nav>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted">
            DHH Explorer is phase one of a bigger archive: lyrics and rhyme analysis, scene stats, recommendations and a collaboration graph are
            coming next, all built on this same dataset.
          </p>
        </div>
        <div className="space-y-3 text-sm text-muted">
          <p className="kicker !text-ink">About the data</p>
          <p>
            Hand-seeded and still growing. {unverified} of {data.tracks.length} releases are flagged for a second source, and dates only show the
            precision we are confident about. Corrections and additions are welcome.
          </p>
          <p>Artwork is generated from each release's title and scene colour. Listening links open a search on the platform.</p>
        </div>
      </div>
    </footer>
  )
}
