import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { useFilters } from '../../hooks/useFilters'
import { FilterPanel } from './FilterPanel'

export function MobileFilterSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { results, clear } = useFilters()

  useEffect(() => {
    if (!open) return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prev
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-3xl border-t border-line bg-surface"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose()
            }}
          >
            <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-faint" aria-hidden />
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <h2 className="font-display text-3xl uppercase">Filters</h2>
              <button type="button" onClick={clear} className="kicker">
                Reset
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6" onPointerDownCapture={(e) => e.stopPropagation()}>
              <FilterPanel />
            </div>
            <div className="border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={onClose} className="w-full rounded-full bg-ink py-3.5 font-mono text-xs uppercase tracking-[0.16em] text-bg">
                Show {results.length} releases
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
