import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { SiteHeader } from './SiteHeader'

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="grain">
      <SiteHeader />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

/** Big coloured page header shared by artist, scene and genre pages. */
export function PageHero({ color, kicker, title, children }: { color: string; kicker: ReactNode; title: string; children?: ReactNode }) {
  return (
    <header className="relative overflow-hidden pt-14" style={{ background: `linear-gradient(170deg, ${color}40, transparent 65%)` }}>
      <div className="mx-auto max-w-[1600px] px-4 pb-10 pt-12 sm:px-8">
        <div className="kicker relative z-10 flex flex-wrap items-center gap-x-3 gap-y-1">{kicker}</div>
        <h1 className="mt-3 break-words font-display text-[clamp(3.2rem,12vw,10rem)] uppercase leading-[0.85]">{title}</h1>
        {children}
      </div>
    </header>
  )
}

export function StatRow({ stats }: { stats: [number | string, string][] }) {
  return (
    <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-5">
      {stats.map(([value, label]) => (
        <div key={label}>
          <div className="font-display text-4xl leading-none">{value}</div>
          <div className="kicker mt-1">{label}</div>
        </div>
      ))}
    </div>
  )
}

export function NotFound({ what }: { what: string }) {
  return (
    <div className="mx-auto grid min-h-[70dvh] max-w-[1600px] place-items-center px-4 pt-14 text-center">
      <div>
        <p className="font-display text-7xl uppercase">Not found</p>
        <p className="mt-3 text-muted">That {what} is not in the archive yet. Try the search.</p>
      </div>
    </div>
  )
}
