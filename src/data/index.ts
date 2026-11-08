import type { Sheet } from '../types'
import python from './python'
import typescript from './typescript'
import javascript from './javascript'

/**
 * Add a tab: create ./<name>.ts the same way as python.ts,
 * import it here and drop it into this list. The tab strip
 * scrolls, so there is no limit on how many you add.
 */
export const sheets: Sheet[] = [python, typescript, javascript]
