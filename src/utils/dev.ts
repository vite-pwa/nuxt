import fs from 'node:fs'
import { join } from 'node:path'
import { eventHandler } from 'h3'

export function dev(
  swMap: string,
  resolvedSwMapFile: string,
  worboxMap: string,
  buildDir: string,
  baseURL: string,
) {
  return eventHandler(async (event) => {
    const url = event.path
    if (!url)
      return

    const file = url === swMap
      ? resolvedSwMapFile
      : url.startsWith(worboxMap) && url.endsWith('.js.map')
        ? join(
            buildDir,
            'dev-sw-dist',
            url.slice(baseURL.length),
          )
        : undefined

    if (file) {
      try {
        await waitFor(() => fs.existsSync(file))
        const map = fs.readFileSync(file, 'utf-8')
        event.headers.set('Content-Type', 'application/json')
        event.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
        event.headers.set('Content-Length', `${map.length}`)
        event.node.res.end(map)
      }
      catch {
      }
    }
  })
}

async function waitFor(method: () => boolean, retries = 5): Promise<void> {
  if (method())
    return

  if (retries === 0)
    throw new Error('Timeout in waitFor')

  await new Promise(resolve => setTimeout(resolve, 300))

  return waitFor(method, retries - 1)
}
