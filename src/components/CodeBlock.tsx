import { useMemo, useRef, useState } from 'react'
import { tokenize } from '../highlight'
import type { Lang } from '../types'

type Props = { code: string; lang: Lang }

export default function CodeBlock({ code, lang }: Props) {
  const tokens = useMemo(() => tokenize(code, lang), [code, lang])
  const [done, setDone] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      return
    }
    setDone(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(false), 1200)
  }

  return (
    <div className="code-wrap">
      <pre>
        <code>
          {tokens.map((t, i) => (
            <span key={i} className={`t-${t.kind}`}>
              {t.text}
            </span>
          ))}
        </code>
      </pre>
      <button className="copy" data-done={done} onClick={copy} aria-label="Copy code">
        {done ? 'copied' : 'copy'}
      </button>
    </div>
  )
}
