import type { Region } from '../../types'

export function SceneTag({ region, className = '' }: { region: Region | undefined; className?: string }) {
  if (!region) return null
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] ${className}`}>
      <span className="size-2 rounded-full" style={{ background: region.color }} aria-hidden />
      {region.name}
    </span>
  )
}
