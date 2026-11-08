export type Lang = 'python' | 'typescript' | 'javascript' | 'sql' | 'yaml' | 'shell'

/** One code example plus an optional one-line explanation. */
export type Snippet = {
  code: string
  note?: string
  /** Overrides the sheet language (e.g. a shell line inside the Python sheet). */
  lang?: Lang
}

export type Section = {
  title: string
  blurb?: string
  snippets: Snippet[]
}

export type Sheet = {
  /** Stable key used for remembering the open tab + scroll position. Don't rename. */
  id: string
  label: string
  lang: Lang
  /** Tab accent colour, any CSS colour. */
  accent: string
  sections: Section[]
}
