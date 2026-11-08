import type { Lang } from './types'

export type Kind = 'com' | 'str' | 'num' | 'kw' | 'bul' | 'fn' | 'op' | 'dec' | 'txt'
export type Token = { text: string; kind: Kind }

const KEYWORDS: Record<Lang, string[]> = {
  python: [
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif',
    'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda',
    'match', 'case', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with',
    'yield', 'None', 'True', 'False', 'self', 'cls',
  ],
  javascript: [
    'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'delete',
    'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'get', 'if', 'import',
    'in', 'instanceof', 'let', 'new', 'of', 'return', 'set', 'static', 'super', 'switch', 'this',
    'throw', 'try', 'typeof', 'var', 'void', 'while', 'yield', 'null', 'undefined', 'true', 'false',
  ],
  typescript: [
    'abstract', 'any', 'as', 'asserts', 'async', 'await', 'break', 'case', 'catch', 'class', 'const',
    'continue', 'declare', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'finally',
    'for', 'from', 'function', 'get', 'if', 'implements', 'import', 'in', 'infer', 'instanceof',
    'interface', 'is', 'keyof', 'let', 'namespace', 'never', 'new', 'of', 'private', 'protected',
    'public', 'readonly', 'return', 'satisfies', 'set', 'static', 'super', 'switch', 'this', 'throw',
    'try', 'type', 'typeof', 'unknown', 'var', 'void', 'while', 'yield',
    'null', 'undefined', 'true', 'false',
  ],
  shell: ['cd', 'export', 'if', 'then', 'fi', 'for', 'do', 'done', 'source'],
}

const BUILTINS: Record<Lang, string[]> = {
  python: [
    'abs', 'all', 'any', 'bool', 'dict', 'enumerate', 'filter', 'float', 'frozenset', 'getattr',
    'hasattr', 'input', 'int', 'isinstance', 'iter', 'len', 'list', 'map', 'max', 'min', 'next',
    'open', 'print', 'range', 'repr', 'reversed', 'round', 'set', 'setattr', 'sorted', 'str', 'sum',
    'super', 'tuple', 'type', 'zip', 'Exception', 'ValueError', 'TypeError', 'KeyError',
  ],
  javascript: [
    'Array', 'Boolean', 'console', 'Date', 'document', 'Error', 'JSON', 'Map', 'Math', 'Number',
    'Object', 'Promise', 'Set', 'String', 'Symbol', 'window', 'fetch', 'localStorage',
    'structuredClone', 'queueMicrotask', 'AbortController',
  ],
  typescript: [
    'Array', 'Awaited', 'Boolean', 'Exclude', 'Extract', 'Omit', 'Partial', 'Pick', 'Promise',
    'Readonly', 'Record', 'Required', 'ReturnType', 'Parameters', 'NonNullable', 'InstanceType',
    'Map', 'Set', 'Object', 'String', 'Number', 'console', 'JSON', 'string', 'number', 'boolean',
    'object', 'symbol', 'bigint',
  ],
  shell: ['npm', 'npx', 'node', 'pip', 'python', 'uv', 'git'],
}

type Rule = { kind: Kind; re: RegExp }

const NUMBER: Rule = {
  kind: 'num',
  re: /0[xXbBoO][0-9a-fA-F_]+|\d[\d_]*(\.\d[\d_]*)?([eE][+-]?\d+)?/y,
}

function rulesFor(lang: Lang): Rule[] {
  if (lang === 'python') {
    return [
      { kind: 'com', re: /#[^\n]*/y },
      {
        kind: 'str',
        re: /[rbfuRBFU]{0,2}(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/y,
      },
      { kind: 'dec', re: /@[A-Za-z_][\w.]*/y },
      NUMBER,
      { kind: 'fn', re: /[A-Za-z_]\w*(?=\s*\()/y },
      { kind: 'txt', re: /[A-Za-z_]\w*/y },
      { kind: 'op', re: /[+\-*/%=<>!&|^~:?]+/y },
    ]
  }
  if (lang === 'shell') {
    return [
      { kind: 'com', re: /#[^\n]*/y },
      { kind: 'str', re: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/y },
      NUMBER,
      { kind: 'txt', re: /[A-Za-z_][\w.-]*/y },
      { kind: 'op', re: /[+\-*/%=<>!&|^~:?]+/y },
    ]
  }
  return [
    { kind: 'com', re: /\/\/[^\n]*|\/\*[\s\S]*?\*\//y },
    { kind: 'str', re: /`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y },
    { kind: 'dec', re: /@[A-Za-z_][\w.]*/y },
    NUMBER,
    { kind: 'fn', re: /[A-Za-z_$][\w$]*(?=\s*[(<])/y },
    { kind: 'txt', re: /[A-Za-z_$][\w$]*/y },
    { kind: 'op', re: /=>|[+\-*/%=<>!&|^~:?]+/y },
  ]
}

/** Dependency-free tokenizer. Good enough for cheat-sheet snippets; it is not a parser. */
export function tokenize(code: string, lang: Lang): Token[] {
  const rules = rulesFor(lang)
  const keywords = new Set(KEYWORDS[lang])
  const builtins = new Set(BUILTINS[lang])
  const out: Token[] = []
  let plain = ''

  const flush = () => {
    if (plain) {
      const last = out[out.length - 1]
      if (last && last.kind === 'txt') last.text += plain
      else out.push({ text: plain, kind: 'txt' })
      plain = ''
    }
  }
  const push = (text: string, kind: Kind) => {
    flush()
    const last = out[out.length - 1]
    if (last && last.kind === kind) last.text += text
    else out.push({ text, kind })
  }

  let i = 0
  while (i < code.length) {
    let hit = false
    for (const rule of rules) {
      rule.re.lastIndex = i
      const m = rule.re.exec(code)
      if (m && m[0].length > 0) {
        let kind = rule.kind
        if (kind === 'txt' || kind === 'fn') {
          if (keywords.has(m[0])) kind = 'kw'
          else if (builtins.has(m[0])) kind = 'bul'
        }
        push(m[0], kind)
        i += m[0].length
        hit = true
        break
      }
    }
    if (!hit) {
      plain += code[i]
      i += 1
    }
  }
  flush()
  return out
}
