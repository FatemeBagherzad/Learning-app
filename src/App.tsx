import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import TabBar from './components/TabBar'
import SheetView from './components/SheetView'
import { sheets } from './data'
import { load, save } from './storage'

type Theme = 'dark' | 'light'
type ClosedMap = Record<string, Record<string, true>>

const K_TAB = 'activeTab'
const K_SCROLL = 'scroll'
const K_THEME = 'theme'
const K_CLOSED = 'closed'

function initialTab(): string {
  const saved = load<string>(K_TAB, '')
  return sheets.some((s) => s.id === saved) ? saved : sheets[0].id
}

function initialTheme(): Theme {
  const saved = load<Theme | ''>(K_THEME, '')
  if (saved === 'dark' || saved === 'light') return saved
  const prefersLight =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: light)').matches === true
  return prefersLight ? 'light' : 'dark'
}

export default function App() {
  const [activeId, setActiveId] = useState(initialTab)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [query, setQuery] = useState('')
  const [closed, setClosed] = useState<ClosedMap>(() => load<ClosedMap>(K_CLOSED, {}))
  const [showTop, setShowTop] = useState(false)

  const sheet = sheets.find((s) => s.id === activeId) ?? sheets[0]

  /* ---- theme ---- */
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#f6f7fa' : '#0f1115')
    save(K_THEME, theme)
  }, [theme])

  /* ---- remember the open tab ---- */
  useEffect(() => {
    save(K_TAB, activeId)
  }, [activeId])

  /* ---- remember how far down each sheet you were ---- */
  const scrolls = useRef<Record<string, number>>(load<Record<string, number>>(K_SCROLL, {}))
  const writeTimer = useRef<number | undefined>(undefined)
  /** Guards against saving position 0 before the sheet has been put back where it was. */
  const restoredFor = useRef<string | null>(null)

  // Put the sheet back where you left it — before the first paint, so there is no jump.
  useLayoutEffect(() => {
    const y = scrolls.current[activeId] ?? 0
    window.scrollTo(0, y)
    restoredFor.current = activeId
  }, [activeId])

  const rememberScroll = useCallback((id: string) => {
    if (restoredFor.current !== id) return
    scrolls.current[id] = window.scrollY
    window.clearTimeout(writeTimer.current)
    writeTimer.current = window.setTimeout(() => save(K_SCROLL, scrolls.current), 250)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      rememberScroll(activeId)
      setShowTop(window.scrollY > 700)
    }
    const onLeave = () => {
      if (restoredFor.current !== activeId) return
      scrolls.current[activeId] = window.scrollY
      save(K_SCROLL, scrolls.current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', onLeave)
    document.addEventListener('visibilitychange', onLeave)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', onLeave)
      document.removeEventListener('visibilitychange', onLeave)
      onLeave()
    }
  }, [activeId, rememberScroll])

  const selectTab = (id: string) => {
    if (id === activeId) return
    scrolls.current[activeId] = window.scrollY
    save(K_SCROLL, scrolls.current)
    setQuery('')
    setActiveId(id)
  }

  /* ---- remember collapsed sections ---- */
  const toggleSection = (title: string) => {
    setClosed((prev) => {
      const forSheet = { ...(prev[sheet.id] ?? {}) }
      if (forSheet[title]) delete forSheet[title]
      else forSheet[title] = true
      const next = { ...prev, [sheet.id]: forSheet }
      save(K_CLOSED, next)
      return next
    })
  }

  return (
    <>
      <header className="wrap hero">
        <span className="dot" style={{ background: sheet.accent }} />
        <h1>Cheat Sheets</h1>
        <span className="spacer" />
        <button
          className="icon-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title="Theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      <div className="bar">
        <TabBar sheets={sheets} activeId={activeId} onSelect={selectTab} />
        <div className="search-row">
          <label className="search">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${sheet.label}…`}
              type="search"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
            />
            {query && (
              <button className="clear" onClick={() => setQuery('')} aria-label="Clear search">
                ✕
              </button>
            )}
          </label>
        </div>
      </div>

      <main>
        <SheetView
          sheet={sheet}
          query={query}
          closed={closed[sheet.id] ?? {}}
          onToggle={toggleSection}
        />
      </main>

      <p className="foot">Tap a heading to fold it · your tab, place and folds are remembered</p>

      {showTop && (
        <button
          className="to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </>
  )
}
