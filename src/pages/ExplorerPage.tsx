import { Roster } from '../components/artist-card/Roster'
import { Footer } from '../components/layout/Footer'
import { Hero } from '../components/layout/Hero'
import { Scenes } from '../components/layout/Scenes'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Timeline } from '../components/timeline/Timeline'

export function ExplorerPage() {
  return (
    <div className="grain">
      <SiteHeader />
      <main>
        <Hero />
        <Timeline />
        <Scenes />
        <Roster />
      </main>
      <Footer />
    </div>
  )
}
