import { useEffect, useRef } from 'react'
import type { Sheet } from '../types'

type Props = {
  sheets: Sheet[]
  activeId: string
  onSelect: (id: string) => void
}

/**
 * Horizontally scrollable tab strip — add as many sheets as you like, the strip
 * scrolls and always keeps the active tab in view.
 */
export default function TabBar({ sheets, activeId, onSelect }: Props) {
  const strip = useRef<HTMLDivElement>(null)
  const active = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const el = active.current
    const box = strip.current
    if (!el || !box) return
    const left = el.offsetLeft - (box.clientWidth - el.clientWidth) / 2
    box.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }, [activeId])

  return (
    <div className="tabs" role="tablist" aria-label="Languages" ref={strip}>
      {sheets.map((s) => {
        const selected = s.id === activeId
        return (
          <button
            key={s.id}
            ref={selected ? active : undefined}
            className="tab"
            role="tab"
            aria-selected={selected}
            style={{ ['--tab-accent' as string]: s.accent }}
            onClick={() => onSelect(s.id)}
          >
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
