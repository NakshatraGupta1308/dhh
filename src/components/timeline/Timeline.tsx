import { DESKTOP_QUERY, useMediaQuery } from '../../hooks/useMediaQuery'
import { HorizontalTimeline } from './HorizontalTimeline'
import { VerticalTimeline } from './VerticalTimeline'

/** Picks a layout per device class instead of shrinking the desktop view. */
export function Timeline() {
  const desktop = useMediaQuery(DESKTOP_QUERY)
  return desktop ? <HorizontalTimeline /> : <VerticalTimeline />
}
