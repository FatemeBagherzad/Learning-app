import type { Sheet } from '../types'

const typescript: Sheet = {
  id: 'typescript',
  label: 'TypeScript',
  lang: 'typescript',
  accent: '#2f74c0',
  sections: [
    {
      title: 'Basic types',
      blurb: 'Annotate only what inference cannot work out — let TS do the rest.',
      snippets: [
        {
          code: `let name: string = 'Ada'
let count = 0                 // inferred as number — no annotation needed
let active: boolean
let nothing: null
let missing: undefined
let big: bigint = 10n
let id: symbol = Symbol('id')

let anything: any            // turns checking off — avoid
let safe: unknown            // must narrow before use
function fail(): never { throw new Error('x') }
function log(): void {}`,
        },
        {
          note: 'Arrays, tuples, objects',
          code: `let nums: number[] = [1, 2]
let words: Array<string> = ['a']
let matrix: number[][] = [[1], [2]]
let pair: [string, number] = ['a', 1]          // tuple, fixed shape
let named: [x: number, y: number] = [1, 2]
let withRest: [string, ...number[]] = ['a', 1, 2]

let user: { name: string; age?: number } = { name: 'Ada' }
let dict: Record<string, number> = { a: 1 }
let readonlyNums: readonly number[] = [1, 2]`,
        },
      ],
    },
    {
      title: 'type vs interface',
      blurb: 'interface for object shapes you may extend; type for everything else.',
      snippets: [
        {
          code: `interface User {
  id: number
  name: string
  email?: string          // optional
  readonly createdAt: Date
}

interface Admin extends User {
  role: 'admin' | 'owner'
}

type Point = { x: number; y: number }
type Id = string | number                 // only type can do unions
type Handler = (e: Event) => void
type Pair = [Point, Point]

type Both = Point & { z: number }         // intersection`,
        },
        {
          note: 'Index signatures & nesting',
          code: `interface Config {
  [key: string]: string | number        // any extra keys
}

interface Response {
  data: { items: User[]; total: number }
  meta?: Record<string, unknown>
}`,
        },
      ],
    },
    {
      title: 'Unions, literals & narrowing',
      snippets: [
        {
          code: `type Status = 'idle' | 'loading' | 'done'     // literal union
let s: Status = 'idle'                        // 'oops' is an error

type MaybeUser = User | null

function render(value: string | number) {
  if (typeof value === 'string') return value.trim()   // narrowed to string
  return value.toFixed(2)                              // narrowed to number
}`,
        },
        {
          note: 'Discriminated union — the TS workhorse',
          code: `type Result =
  | { kind: 'ok'; data: User }
  | { kind: 'error'; message: string }

function handle(r: Result) {
  switch (r.kind) {
    case 'ok': return r.data.name        // only here does .data exist
    case 'error': return r.message
  }
}`,
        },
        {
          note: 'Other narrowing tools',
          code: `if (value === null) return
if ('email' in user) { ... }
if (Array.isArray(x)) { ... }
if (err instanceof Error) { ... }
value?.length ?? 0

const el = document.querySelector('#app')!    // non-null assertion (be sure!)`,
        },
      ],
    },
    {
      title: 'Functions',
      snippets: [
        {
          code: `function add(a: number, b = 0): number { return a + b }
const mul = (a: number, b: number): number => a * b
function join(...parts: string[]): string { return parts.join('/') }
function find(id: number): User | undefined { ... }

type Fn = (a: string, b?: number) => boolean
const f: Fn = (a, b) => a.length === b          // params inferred from Fn

async function load(): Promise<User[]> { ... }`,
        },
        {
          note: 'Overloads & this',
          code: `function parse(v: string): number
function parse(v: number): string
function parse(v: string | number): string | number {
  return typeof v === 'string' ? Number(v) : String(v)
}`,
        },
      ],
    },
    {
      title: 'Generics',
      blurb: 'A type parameter: "whatever comes in is what comes back".',
      snippets: [
        {
          code: `function first<T>(items: T[]): T | undefined { return items[0] }
first([1, 2])          // number | undefined
first(['a'])           // string | undefined

const identity = <T,>(v: T): T => v

interface Box<T> { value: T }
const b: Box<string> = { value: 'hi' }

type ApiResult<T> = { data: T; error: string | null }`,
        },
        {
          note: 'Constraints & defaults',
          code: `function len<T extends { length: number }>(v: T) { return v.length }
len('abc'); len([1, 2])            // ok;  len(3) is an error

function prop<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}
prop(user, 'name')                 // string, fully typed

interface List<T = string> { items: T[] }   // default type arg`,
        },
      ],
    },
    {
      title: 'Utility types',
      blurb: 'Built in — reach for these before hand-writing a new type.',
      snippets: [
        {
          code: `Partial<User>            // every field optional
Required<User>           // every field required
Readonly<User>           // no reassignment
Pick<User, 'id' | 'name'>
Omit<User, 'email'>
Record<string, User>     // { [key: string]: User }
Exclude<Status, 'idle'>  // 'loading' | 'done'
Extract<Status, 'idle' | 'x'>   // 'idle'
NonNullable<string | null>      // string
ReturnType<typeof add>          // number
Parameters<typeof add>          // [number, number?]
Awaited<Promise<User>>          // User
InstanceType<typeof Date>       // Date`,
        },
        {
          note: 'Everyday combos',
          code: `type Draft = Omit<User, 'id' | 'createdAt'>
type Update = Partial<Pick<User, 'name' | 'email'>>
type Lookup = Record<User['id'], User>`,
        },
      ],
    },
    {
      title: 'keyof, typeof & indexed access',
      snippets: [
        {
          code: `type UserKey = keyof User            // 'id' | 'name' | 'email' | 'createdAt'
type NameType = User['name']         // string
type Values = User[keyof User]       // union of all value types

const config = { host: 'localhost', port: 5173 } as const
type Config = typeof config          // { readonly host: 'localhost'; readonly port: 5173 }
type Host = Config['host']           // 'localhost'

const ROLES = ['admin', 'user'] as const
type Role = (typeof ROLES)[number]   // 'admin' | 'user'`,
        },
      ],
    },
    {
      title: 'Mapped & conditional types',
      snippets: [
        {
          note: 'Mapped: transform every key',
          code: `type Nullable<T> = { [K in keyof T]: T[K] | null }
type Flags<T> = { [K in keyof T]: boolean }
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K]
}
type Mutable<T> = { -readonly [K in keyof T]-?: T[K] }   // strip modifiers`,
        },
        {
          note: 'Conditional: types with an if',
          code: `type IsString<T> = T extends string ? true : false
type Unwrap<T> = T extends Promise<infer U> ? U : T
type Element<T> = T extends (infer U)[] ? U : never

Unwrap<Promise<number>>   // number
Element<string[]>         // string`,
        },
        {
          note: 'Template literal types',
          code: `type Event = \`on\${'Click' | 'Focus'}\`   // 'onClick' | 'onFocus'
type Px = \`\${number}px\``,
        },
      ],
    },
    {
      title: 'Type guards & assertions',
      snippets: [
        {
          code: `function isUser(v: unknown): v is User {
  return typeof v === 'object' && v !== null && 'id' in v
}
if (isUser(data)) data.name     // narrowed

function assertDefined<T>(v: T | undefined): asserts v is T {
  if (v === undefined) throw new Error('missing')
}`,
        },
        {
          note: 'as, satisfies, const',
          code: `const el = document.querySelector('#app') as HTMLDivElement
const n = value as unknown as number        // double assertion, last resort

const theme = { bg: '#000', fg: '#fff' } satisfies Record<string, string>
// satisfies checks the shape but keeps the exact literal types

const tuple = [1, 'a'] as const             // readonly [1, 'a']`,
        },
        {
          note: 'Exhaustiveness check',
          code: `function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle': return Math.PI * shape.r ** 2
    case 'square': return shape.size ** 2
    default: {
      const _never: never = shape      // errors if a case is missing
      return _never
    }
  }
}`,
        },
      ],
    },
    {
      title: 'Classes',
      snippets: [
        {
          code: `class Repo<T extends { id: number }> {
  private items = new Map<number, T>()
  protected hits = 0
  readonly name: string

  constructor(name: string) { this.name = name }

  // shorthand: parameter properties
  // constructor(public name: string, private db: Db) {}

  get(id: number): T | undefined { return this.items.get(id) }
  add(item: T): this { this.items.set(item.id, item); return this }
}

abstract class Shape {
  abstract area(): number
  describe(): string { return \`area \${this.area()}\` }
}

interface Serializable { toJSON(): string }
class Doc extends Shape implements Serializable { ... }`,
        },
      ],
    },
    {
      title: 'Modules & imports',
      snippets: [
        {
          code: `export interface User { id: number }
export type { User as PublicUser }
export const VERSION = '1.0'
export default class Client {}

import Client, { VERSION } from './client'
import type { User } from './types'        // erased at compile time
import * as utils from './utils'

declare module '*.svg' {                   // typing non-TS imports
  const src: string
  export default src
}

declare global {
  interface Window { myApp?: { ready: boolean } }
}`,
        },
      ],
    },
    {
      title: 'React + TypeScript',
      blurb: 'The patterns you need in this very app.',
      snippets: [
        {
          code: `type Props = {
  title: string
  count?: number
  items: string[]
  onSelect: (id: string) => void
  children?: React.ReactNode
}

export default function List({ title, count = 0, onSelect }: Props) {
  return <button onClick={() => onSelect('a')}>{title} {count}</button>
}`,
        },
        {
          note: 'Hooks',
          code: `const [open, setOpen] = useState(false)              // inferred boolean
const [user, setUser] = useState<User | null>(null)  // annotate when it starts empty
const ref = useRef<HTMLInputElement>(null)
const timer = useRef<number | undefined>(undefined)

const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)
const onClick = (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()

useEffect(() => {
  const id = setInterval(tick, 1000)
  return () => clearInterval(id)        // cleanup
}, [])`,
        },
      ],
    },
    {
      title: 'tsconfig & tooling',
      snippets: [
        {
          note: 'Start a typed Vite + React app',
          lang: 'shell',
          code: `npm create vite@latest my-app -- --template react-ts
cd my-app && npm install
npm run dev
npx tsc --noEmit        # type-check without building`,
        },
        {
          note: 'The settings that matter',
          code: `{
  "compilerOptions": {
    "strict": true,                 // turn this on and leave it on
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "noUncheckedIndexedAccess": true,   // arr[0] becomes T | undefined
    "noUnusedLocals": true,
    "noEmit": true
  },
  "include": ["src"]
}`,
        },
        {
          note: 'Escape hatches when you are stuck',
          code: `// @ts-expect-error  explain why — errors if the line becomes valid
// @ts-ignore        silences anything, prefer the one above
const x = legacy as any            // last resort, add a TODO`,
        },
      ],
    },
  ],
}

export default typescript
