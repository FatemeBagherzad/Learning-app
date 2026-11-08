import type { Sheet } from '../types'

const javascript: Sheet = {
  id: 'javascript',
  label: 'JavaScript',
  lang: 'javascript',
  accent: '#d9a111',
  sections: [
    {
      title: 'Variables & types',
      blurb: 'Use const by default, let when it must change. Never var.',
      snippets: [
        {
          code: `const name = 'Ada'       // can't be reassigned
let count = 0            // can
count += 1

// 7 primitives + object
typeof 'hi'        // 'string'
typeof 42          // 'number'
typeof 9007199254740993n // 'bigint'
typeof true        // 'boolean'
typeof undefined   // 'undefined'
typeof Symbol()    // 'symbol'
typeof null        // 'object'  (famous bug)
typeof [1, 2]      // 'object'  -> Array.isArray([1,2])`,
        },
        {
          note: 'Equality: always ===',
          code: `0 == '0'    // true   loose, coerces
0 === '0'   // false  strict, use this
NaN === NaN // false  -> Number.isNaN(x)
Object.is(NaN, NaN) // true`,
        },
        {
          note: 'Falsy values (everything else is truthy)',
          code: `false, 0, -0, 0n, '', null, undefined, NaN

// '0', [], {} are all TRUTHY`,
        },
      ],
    },
    {
      title: 'Strings',
      snippets: [
        {
          code: `const s = '  Hello, World  '
s.trim()
s.toUpperCase(); s.toLowerCase()
s.includes('World')      // true
s.startsWith('  He')
s.indexOf('o')           // 5  (-1 if absent)
s.slice(2, 7)            // substring
s.replace('World', 'JS') // first match
s.replaceAll('l', 'L')
s.trim().split(', ')     // ['Hello', 'World']
['a', 'b'].join('-')     // 'a-b'
'ab'.repeat(3)           // 'ababab'
'5'.padStart(3, '0')     // '005'
s.at(-1)                 // last char`,
        },
        {
          note: 'Template literals',
          code: `const greet = \`Hi \${name}, you are \${age} years old\`
const multi = \`line one
line two\`
\`sum: \${1 + 2}\`         // any expression`,
        },
      ],
    },
    {
      title: 'Numbers & math',
      snippets: [
        {
          code: `7 / 2            // 3.5  (no integer division)
Math.floor(7 / 2) // 3
7 % 2            // 1
2 ** 10          // 1024

Number('42'); parseInt('42px', 10); parseFloat('3.5')
(3.14159).toFixed(2)      // '3.14'  (a string!)
Number.isInteger(4)
Number.isNaN(x)

Math.round(2.5); Math.abs(-3); Math.max(1, 9); Math.min(...nums)
Math.random()                               // 0..1
Math.floor(Math.random() * 6) + 1           // 1..6`,
        },
      ],
    },
    {
      title: 'Arrays — the essentials',
      snippets: [
        {
          note: 'Mutating (changes the original)',
          code: `const a = [3, 1, 2]
a.push(4)        // add to end     -> new length
a.pop()          // remove last    -> item
a.unshift(0)     // add to front
a.shift()        // remove first
a.splice(1, 2)            // remove 2 items at index 1
a.splice(1, 0, 'x')       // insert without removing
a.sort((x, y) => x - y)   // numeric sort (in place!)
a.reverse()`,
        },
        {
          note: 'Non-mutating (return a new array)',
          code: `a.slice(1, 3)           // copy of a range
a.concat([4, 5])
[...a, 4]               // spread copy + add
a.flat(); a.flat(2)
[...a].sort()           // sort a copy
a.toSorted()            // newer engines`,
        },
        {
          note: 'Transform & search — your daily bread',
          code: `nums.map(n => n * 2)                 // same length, new values
nums.filter(n => n % 2 === 0)        // subset
nums.find(n => n > 2)                // first match or undefined
nums.findIndex(n => n > 2)           // -1 if none
nums.some(n => n > 2)                // boolean
nums.every(n => n > 0)
nums.includes(3)
nums.reduce((sum, n) => sum + n, 0)  // fold to one value
nums.forEach((n, i) => console.log(i, n))

// chain them
const total = users
  .filter(u => u.active)
  .map(u => u.score)
  .reduce((a, b) => a + b, 0)`,
        },
        {
          note: 'Create & group',
          code: `Array.from({ length: 5 }, (_, i) => i)   // [0,1,2,3,4]
Array(3).fill(0)
[...'abc']                               // ['a','b','c']
Object.groupBy(users, u => u.role)       // newest engines
new Set(items)                           // dedupe
[...new Set(items)]`,
        },
      ],
    },
    {
      title: 'Objects',
      snippets: [
        {
          code: `const user = { name: 'Ada', age: 36 }
user.name; user['name']
user.email = 'a@b.c'
delete user.email
'name' in user           // true
user.phone?.number       // optional chaining, no crash

Object.keys(user); Object.values(user); Object.entries(user)
for (const [k, v] of Object.entries(user)) console.log(k, v)`,
        },
        {
          note: 'Copy & merge (shallow)',
          code: `const copy = { ...user }
const merged = { ...defaults, ...overrides }   // right wins
Object.assign({}, a, b)
const deep = structuredClone(obj)              // real deep copy
JSON.parse(JSON.stringify(obj))                // old deep-copy trick`,
        },
        {
          note: 'Shorthand & computed keys',
          code: `const name = 'Ada', age = 36
const u = { name, age }           // { name: 'Ada', age: 36 }
const key = 'role'
const o = { [key]: 'admin' }      // { role: 'admin' }
const o2 = { greet() { return 'hi' } }`,
        },
      ],
    },
    {
      title: 'Destructuring & spread',
      snippets: [
        {
          code: `const { name, age: years = 0, ...rest } = user
const [first, second = 0, ...others] = nums
const { a: { b } } = nested            // nested

function draw({ x = 0, y = 0 } = {}) { ... }   // named params

const [a, b] = [b, a]                  // swap
const combined = [...arr1, ...arr2]
fn(...args)                            // spread as arguments`,
        },
      ],
    },
    {
      title: 'Functions',
      snippets: [
        {
          code: `function add(a, b = 0) { return a + b }
const addArrow = (a, b = 0) => a + b          // implicit return
const square = n => n * n                     // single param
const obj = () => ({ ok: true })              // return object: wrap in ()

const rest = (...nums) => nums.length         // rest args`,
        },
        {
          note: 'Arrow vs function: this',
          code: `// arrow keeps the surrounding "this" — use it in callbacks
button.addEventListener('click', () => this.save())

// method shorthand when you DO want dynamic this
const counter = {
  n: 0,
  inc() { this.n++ },
}`,
        },
        {
          note: 'Closures & default patterns',
          code: `function counter() {
  let n = 0
  return () => ++n          // remembers n
}
const next = counter(); next(); next()   // 1, 2

const once = (fn) => { let done = false; return (...a) => {
  if (!done) { done = true; return fn(...a) }
}}`,
        },
      ],
    },
    {
      title: 'Control flow',
      snippets: [
        {
          code: `if (score > 90) { grade = 'A' }
else if (score > 80) { grade = 'B' }
else { grade = 'C' }

const grade2 = score > 90 ? 'A' : 'B'       // ternary

switch (kind) {
  case 'dog':
  case 'cat': feed(); break               // break or it falls through
  default: wait()
}`,
        },
        {
          note: 'Loops',
          code: `for (let i = 0; i < 5; i++) { ... }
for (const item of items) { ... }      // values  (arrays, strings, Sets)
for (const key in obj) { ... }         // keys    (objects)
while (queue.length) { ... }
do { ... } while (cond)

// break / continue work in all of them
// labelled break for nested loops:
outer: for (...) { for (...) { break outer } }`,
        },
        {
          note: 'Nullish & logical shortcuts',
          code: `const port = input ?? 3000      // only null/undefined fall through
const port2 = input || 3000     // also replaces 0 and ''
value && doIt()                 // run if truthy
config.retries ??= 3            // assign if nullish`,
        },
      ],
    },
    {
      title: 'Classes',
      snippets: [
        {
          code: `class Animal {
  static kingdom = 'Animalia'     // on the class
  #secret = 'private'             // true private field

  constructor(name) { this.name = name }

  speak() { return \`\${this.name} makes a sound\` }

  get label() { return this.name.toUpperCase() }
  set label(v) { this.name = v.toLowerCase() }

  static create(name) { return new Animal(name) }
}

class Dog extends Animal {
  constructor(name) { super(name); this.legs = 4 }
  speak() { return \`\${super.speak()} — woof\` }
}

const d = new Dog('Rex')
d instanceof Animal      // true`,
        },
      ],
    },
    {
      title: 'Promises & async/await',
      snippets: [
        {
          code: `async function load(id) {
  try {
    const res = await fetch(\`/api/items/\${id}\`)
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
    const data = await res.json()
    return data
  } catch (err) {
    console.error(err)
    return null
  } finally {
    stopSpinner()
  }
}`,
        },
        {
          note: 'Running several at once',
          code: `const [a, b] = await Promise.all([loadA(), loadB()])   // all or throw
const results = await Promise.allSettled(tasks)        // never throws
const winner = await Promise.race(tasks)               // first to settle
const first = await Promise.any(tasks)                 // first success`,
        },
        {
          note: 'Then-chains & making promises',
          code: `fetch(url)
  .then(r => r.json())
  .then(data => render(data))
  .catch(err => show(err))
  .finally(() => hide())

const wait = ms => new Promise(res => setTimeout(res, ms))
await wait(500)

Promise.resolve(1); Promise.reject(new Error('no'))`,
        },
        {
          note: 'await inside loops',
          code: `for (const id of ids) {
  await load(id)                 // sequential, slow but ordered
}

await Promise.all(ids.map(load))  // parallel, much faster`,
        },
      ],
    },
    {
      title: 'Map, Set & JSON',
      snippets: [
        {
          note: 'Map — any key type, keeps insertion order',
          code: `const m = new Map([['a', 1]])
m.set('b', 2).set(objKey, 3)
m.get('a'); m.has('b'); m.delete('a'); m.size
for (const [k, v] of m) { ... }
Object.fromEntries(m); new Map(Object.entries(obj))`,
        },
        {
          note: 'Set — unique values',
          code: `const s = new Set([1, 1, 2])   // {1, 2}
s.add(3); s.has(2); s.delete(1); s.size
[...s]                          // back to array`,
        },
        {
          note: 'JSON & localStorage',
          code: `const text = JSON.stringify(obj, null, 2)
const obj2 = JSON.parse(text)

localStorage.setItem('key', JSON.stringify(state))
const saved = JSON.parse(localStorage.getItem('key') ?? 'null')
localStorage.removeItem('key')`,
        },
      ],
    },
    {
      title: 'Modules',
      snippets: [
        {
          code: `// utils.js
export const PI = 3.14
export function add(a, b) { return a + b }
export default class Thing {}

// main.js
import Thing, { add, PI as pi } from './utils.js'
import * as utils from './utils.js'
const mod = await import('./lazy.js')      // dynamic`,
        },
      ],
    },
    {
      title: 'DOM basics',
      snippets: [
        {
          code: `const el = document.querySelector('#app')
const all = document.querySelectorAll('.item')    // NodeList
el.textContent = 'hi'
el.innerHTML = '<b>careful</b>'
el.classList.add('on'); el.classList.toggle('on', isOn)
el.dataset.id                                      // data-id attr
el.setAttribute('aria-hidden', 'true')
el.style.color = 'red'

const div = document.createElement('div')
el.append(div); div.remove()`,
        },
        {
          note: 'Events',
          code: `btn.addEventListener('click', (e) => {
  e.preventDefault()
  e.stopPropagation()
})

// delegation: one listener for many children
list.addEventListener('click', (e) => {
  const item = e.target.closest('li')
  if (item) select(item.dataset.id)
})

input.addEventListener('input', e => console.log(e.target.value))
document.addEventListener('keydown', e => { if (e.key === 'Escape') close() })`,
        },
      ],
    },
    {
      title: 'Errors',
      snippets: [
        {
          code: `try {
  risky()
} catch (err) {
  if (err instanceof TypeError) { ... }
  console.error(err.message, err.stack)
} finally {
  cleanup()
}

throw new Error('something broke')
throw new Error('wrapped', { cause: err })

class ApiError extends Error {
  constructor(status) { super(\`HTTP \${status}\`); this.name = 'ApiError'; this.status = status }
}`,
        },
      ],
    },
    {
      title: 'Timers, iterators, generators',
      snippets: [
        {
          code: `const t = setTimeout(fn, 1000); clearTimeout(t)
const i = setInterval(fn, 1000); clearInterval(i)
requestAnimationFrame(draw)
queueMicrotask(fn)`,
        },
        {
          note: 'Generators & async iteration',
          code: `function* ids() { let n = 0; while (true) yield n++ }
const gen = ids(); gen.next().value      // 0

for await (const chunk of stream) { ... }`,
        },
        {
          note: 'Debounce — handy for search inputs',
          code: `const debounce = (fn, ms = 300) => {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}`,
        },
      ],
    },
  ],
}

export default javascript
