import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

let cachedRules = ''

export async function loadDndRules(): Promise<string> {
  if (cachedRules) {
    return cachedRules
  }

  const currentDir = dirname(fileURLToPath(import.meta.url))
  const skillPath = resolve(currentDir, '../../../../skills/dnd-5e-dm/references/rules.md')
  cachedRules = await readFile(skillPath, 'utf8')
  return cachedRules
}
