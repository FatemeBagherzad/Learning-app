import { useMemo } from 'react'
import CodeBlock from './CodeBlock'
import type { Section, Sheet } from '../types'

type Props = {
  sheet: Sheet
  query: string
  closed: Record<string, true>
  onToggle: (title: string) => void
}

function Mark({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + query.length)}</mark>
      <Mark text={text.slice(i + query.length)} query={query} />
    </>
  )
}

function filter(sections: Section[], query: string): Section[] {
  const q = query.trim().toLowerCase()
  if (!q) return sections
  const out: Section[] = []
  for (const s of sections) {
    const headMatch =
      s.title.toLowerCase().includes(q) || (s.blurb ?? '').toLowerCase().includes(q)
    const snippets = headMatch
      ? s.snippets
      : s.snippets.filter(
          (n) => n.code.toLowerCase().includes(q) || (n.note ?? '').toLowerCase().includes(q),
        )
    if (snippets.length) out.push({ ...s, snippets })
  }
  return out
}

/** Card colours, cycled per section — same set as the OPS learning app. */
const TONES = ['blue', 'green', 'violet', 'orange', 'sky', 'red', 'yellow'] as const

export default function SheetView({ sheet, query, closed, onToggle }: Props) {
  const sections = useMemo(() => filter(sheet.sections, query), [sheet, query])
  const searching = query.trim().length > 0
  // Tone follows the section's place in the full sheet, so a section keeps its
  // colour while you search.
  const toneOf = (title: string) =>
    TONES[sheet.sections.findIndex((s) => s.title === title) % TONES.length]

  if (!sections.length) {
    return <p className="empty">Nothing in {sheet.label} matches “{query.trim()}”.</p>
  }

  return (
    <div className="sheet wrap">
      <div className="sheet-head">
        <span>
          {sections.length} {sections.length === 1 ? 'section' : 'sections'}
          {searching ? ` matching “${query.trim()}”` : ''}
        </span>
      </div>
      <div className="cols">
        {sections.map((s) => {
          const open = searching || !closed[s.title]
          return (
            <section className="card" data-open={open} data-tone={toneOf(s.title)} key={s.title}>
              <button
                className="card-head"
                onClick={() => onToggle(s.title)}
                aria-expanded={open}
              >
                <h2>
                  <Mark text={s.title} query={searching ? query.trim() : ''} />
                </h2>
                <svg
                  className="chev"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {open && (
                <div className="card-body">
                  {s.blurb && (
                    <p className="blurb">
                      <Mark text={s.blurb} query={searching ? query.trim() : ''} />
                    </p>
                  )}
                  {s.snippets.map((n, i) => (
                    <div className="snippet" key={i}>
                      {n.note && (
                        <p className="note">
                          <Mark text={n.note} query={searching ? query.trim() : ''} />
                        </p>
                      )}
                      <CodeBlock code={n.code} lang={n.lang ?? sheet.lang} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
