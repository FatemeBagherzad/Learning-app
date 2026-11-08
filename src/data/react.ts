import type { Sheet } from '../types'

const react: Sheet = {
  id: 'react',
  label: 'React',
  lang: 'typescript',
  accent: '#0891b2',
  sections: [
    {
      title: 'A component',
      blurb: 'A component is a function that returns JSX. Name it with a Capital letter.',
      snippets: [
        {
          code: `function Welcome({ name }) {
  return <h1>Hello {name}</h1>
}

// use it
<Welcome name="Ada" />

export default function App() {
  return (
    <div className="app">
      <Welcome name="Ada" />
      <Welcome name="Grace" />
    </div>
  )
}`,
        },
        {
          note: 'With TypeScript props',
          code: `type Props = {
  name: string
  count?: number                 // optional
  onPick: (id: string) => void   // callback prop
  children?: React.ReactNode     // whatever is nested inside
}

export default function Card({ name, count = 0, onPick, children }: Props) {
  return <button onClick={() => onPick(name)}>{name} {count}{children}</button>
}`,
        },
      ],
    },
    {
      title: 'JSX rules',
      snippets: [
        {
          code: `// 1. one parent element — use a fragment if you have none
return (
  <>
    <h1>Title</h1>
    <p>Text</p>
  </>
)

// 2. className, not class.  htmlFor, not for
<div className="card" />

// 3. JS goes in braces
<p>{user.name} is {2026 - user.born} years old</p>

// 4. close every tag
<img src={url} alt="" />
<br />

// 5. style is an object, in camelCase
<div style={{ marginTop: 8, backgroundColor: 'red' }} />`,
        },
      ],
    },
    {
      title: 'useState',
      blurb: 'State is memory that survives re-renders. Changing it re-renders the component.',
      snippets: [
        {
          code: `import { useState } from 'react'

const [count, setCount] = useState(0)        // [value, setter]
const [user, setUser] = useState(null)
const [items, setItems] = useState([])
const [open, setOpen] = useState<boolean>(false)   // TS

setCount(5)                 // set a value
setCount(c => c + 1)        // based on the previous value — always safer`,
        },
        {
          note: 'Never mutate state — make a new value',
          code: `// arrays
setItems([...items, newItem])                    // add
setItems(items.filter(i => i.id !== id))         // remove
setItems(items.map(i => i.id === id ? { ...i, done: true } : i))  // update one

// objects
setUser({ ...user, name: 'Ada' })

// WRONG: React won't notice these
items.push(newItem)
user.name = 'Ada'`,
        },
        {
          note: 'State is per component instance, and updates are batched',
          code: `function Counter() {
  const [n, setN] = useState(0)
  // both run before one re-render; use the function form to stack them
  const addTwo = () => { setN(x => x + 1); setN(x => x + 1) }
  return <button onClick={addTwo}>{n}</button>
}`,
        },
      ],
    },
    {
      title: 'useEffect',
      blurb: 'For talking to the outside world: fetching, timers, subscriptions. Not for maths.',
      snippets: [
        {
          code: `import { useEffect } from 'react'

useEffect(() => {
  document.title = \`\${count} new\`
}, [count])          // runs after render when count changed

useEffect(() => { ... }, [])     // once, after the first render
useEffect(() => { ... })         // after EVERY render (rarely what you want)`,
        },
        {
          note: 'Clean up whatever you start',
          code: `useEffect(() => {
  const id = setInterval(tick, 1000)
  return () => clearInterval(id)        // on unmount / before next run
}, [])

useEffect(() => {
  const onKey = (e) => e.key === 'Escape' && close()
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}, [])`,
        },
        {
          note: 'Fetching, with the request cancelled if it changes',
          code: `useEffect(() => {
  const ctrl = new AbortController()
  setLoading(true)
  fetch(\`/api/users/\${id}\`, { signal: ctrl.signal })
    .then(r => r.json())
    .then(setUser)
    .catch(e => { if (e.name !== 'AbortError') setError(e) })
    .finally(() => setLoading(false))
  return () => ctrl.abort()
}, [id])`,
        },
        {
          note: 'You often do NOT need an effect',
          code: `// NO — extra render, extra state
const [full, setFull] = useState('')
useEffect(() => setFull(first + ' ' + last), [first, last])

// YES — just calculate it while rendering
const full = first + ' ' + last`,
        },
      ],
    },
    {
      title: 'Events & forms',
      snippets: [
        {
          code: `<button onClick={handleClick}>Go</button>
<button onClick={() => remove(item.id)}>Delete</button>   // pass an argument
<input onChange={e => setText(e.target.value)} />
<form onSubmit={handleSubmit}>

function handleSubmit(e) {
  e.preventDefault()        // stop the page reloading
  save(text)
}`,
        },
        {
          note: 'Controlled input: state is the single source of truth',
          code: `const [text, setText] = useState('')

<input value={text} onChange={e => setText(e.target.value)} />
<textarea value={bio} onChange={e => setBio(e.target.value)} />
<input type="checkbox" checked={done} onChange={e => setDone(e.target.checked)} />
<select value={role} onChange={e => setRole(e.target.value)}>
  <option value="admin">Admin</option>
</select>`,
        },
        {
          note: 'A whole form in one state object',
          code: `const [form, setForm] = useState({ name: '', email: '' })

const update = (e) =>
  setForm(f => ({ ...f, [e.target.name]: e.target.value }))

<input name="name" value={form.name} onChange={update} />
<input name="email" value={form.email} onChange={update} />`,
        },
      ],
    },
    {
      title: 'Conditional rendering',
      snippets: [
        {
          code: `{isLoggedIn && <Dashboard />}                  // show or nothing
{isLoggedIn ? <Dashboard /> : <Login />}       // either / or
{error && <p className="error">{error}</p>}

// careful: 0 renders as "0"
{items.length > 0 && <List />}     // not {items.length && <List />}

// early return for the big cases
if (loading) return <Spinner />
if (error) return <Error msg={error} />
return <List items={items} />`,
        },
      ],
    },
    {
      title: 'Lists & keys',
      snippets: [
        {
          code: `<ul>
  {users.map(user => (
    <li key={user.id}>{user.name}</li>
  ))}
</ul>

// key must be stable and unique among siblings — an id, not the array index
// (index is fine only for a list that never reorders, filters or deletes)

{users.length === 0 && <p>Nothing here yet.</p>}`,
        },
      ],
    },
    {
      title: 'useRef',
      blurb: 'A box that survives re-renders and does NOT re-render when you change it.',
      snippets: [
        {
          code: `import { useRef } from 'react'

// 1. reach a DOM node
const inputRef = useRef(null)
<input ref={inputRef} />
inputRef.current.focus()

// 2. remember a value between renders (timers, previous value, flags)
const timer = useRef()
timer.current = setTimeout(...)
clearTimeout(timer.current)`,
        },
      ],
    },
    {
      title: 'useMemo & useCallback',
      blurb: 'Caching. Reach for them when something is genuinely slow, not by default.',
      snippets: [
        {
          code: `// remember a VALUE
const sorted = useMemo(
  () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
  [items],
)

// remember a FUNCTION (so a memoised child doesn't re-render)
const onSelect = useCallback((id) => setSelected(id), [])

const Row = React.memo(function Row({ item, onSelect }) { ... })`,
        },
      ],
    },
    {
      title: 'Context',
      blurb: 'Pass data to deep children without threading props through every level.',
      snippets: [
        {
          code: `// theme.jsx
import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext('light')

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

// anywhere below the provider
const { theme, setTheme } = useTheme()`,
        },
      ],
    },
    {
      title: 'useReducer',
      blurb: 'When the next state depends on the old one in several different ways.',
      snippets: [
        {
          code: `function reducer(state, action) {
  switch (action.type) {
    case 'add':    return { ...state, items: [...state.items, action.item] }
    case 'remove': return { ...state, items: state.items.filter(i => i.id !== action.id) }
    case 'reset':  return initial
    default:       return state
  }
}

const [state, dispatch] = useReducer(reducer, initial)
dispatch({ type: 'add', item })`,
        },
      ],
    },
    {
      title: 'Custom hooks',
      blurb: 'Any function starting with "use" that calls other hooks. Reuse logic, not markup.',
      snippets: [
        {
          code: `function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial }
    catch { return initial }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

// use it like useState
const [name, setName] = useLocalStorage('name', '')`,
        },
        {
          note: 'Rules of hooks',
          code: `// 1. only call hooks at the top level — never inside if / for / callbacks
// 2. only call them from components or other hooks
// 3. the order of hook calls must be the same on every render

if (ready) { const [x] = useState(0) }   // WRONG
const [x] = useState(0); if (ready) ...  // right`,
        },
      ],
    },
    {
      title: 'Composition',
      snippets: [
        {
          code: `// children: anything nested inside the tag
function Panel({ title, children }) {
  return <section><h2>{title}</h2>{children}</section>
}

<Panel title="Settings">
  <Toggle />
</Panel>

// slots: pass elements as props
<Layout sidebar={<Nav />} main={<Feed />} />

// pass the rest of the props through
function Button({ variant = 'primary', ...rest }) {
  return <button className={\`btn btn--\${variant}\`} {...rest} />
}`,
        },
      ],
    },
    {
      title: 'Data fetching pattern',
      snippets: [
        {
          code: `function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    fetch('/api/users')
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(data => { if (alive) setUsers(data) })
      .catch(err => { if (alive) setError(err.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  if (loading) return <p>Loading…</p>
  if (error) return <p>Error: {error}</p>
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}`,
        },
      ],
    },
    {
      title: 'Common mistakes',
      snippets: [
        {
          code: `<button onClick={remove()} />          // calls it on render!
<button onClick={() => remove()} />    // right

useEffect(() => { setCount(count + 1) })   // infinite loop (no dep array)

{items.map(i => <li>{i}</li>)}         // missing key

const [a, b] = useState(0)             // b is the SETTER, not a second value

// state is not updated immediately after you set it
setCount(count + 1)
console.log(count)       // still the old value — use the value you just computed`,
        },
      ],
    },
    {
      title: 'Project setup',
      snippets: [
        {
          note: 'New app with Vite',
          lang: 'shell',
          code: `npm create vite@latest my-app -- --template react
npm create vite@latest my-app -- --template react-ts   # with TypeScript
cd my-app && npm install && npm run dev`,
        },
        {
          note: 'A tidy structure',
          lang: 'shell',
          code: `src/
  components/    # one folder or file per component
  hooks/         # useSomething.js
  data/          # static content, constants
  styles/
  App.jsx
  main.jsx`,
        },
      ],
    },
  ],
}

export default react
