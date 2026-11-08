import type { Sheet } from '../types'
import ai from './ai'
import kubernetes from './kubernetes'
import docker from './docker'
import helm from './helm'
import python from './python'
import typescript from './typescript'
import javascript from './javascript'
import react from './react'
import sql from './sql'

/**
 * Add a tab: create ./<name>.ts the same way as python.ts,
 * import it here and drop it into this list. The order here is
 * the order of the tabs, and the tab strip scrolls, so there is
 * no limit on how many you add.
 */
export const sheets: Sheet[] = [
  ai,
  kubernetes,
  docker,
  helm,
  python,
  typescript,
  javascript,
  react,
  sql,
]
