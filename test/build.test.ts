import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const build = process.env.TEST_BUILD === 'true'

describe(`test-${build ? 'build' : 'generate'}`, () => {
  it('service worker is generated: ', () => {
    const swName = build
      ? './playground/.output/public/sw.js'
      : './playground/dist/sw.js'
    const webManifest = build
      ? './playground/.output/public/manifest.webmanifest'
      : './playground/dist/manifest.webmanifest'
    expect(existsSync(swName), `${swName} doesn't exist`).toBeTruthy()
    expect(existsSync(webManifest), `${webManifest} doesn't exist`).toBeTruthy()
    const swContent = readFileSync(swName, 'utf-8')
    let match: RegExpMatchArray | null
    match = swContent.match(/define\(\["\.\/(workbox-\w+)"/)
    expect(match && match.length === 2, `workbox-***.js entry not found in ${swName}`).toBeTruthy()
    const workboxName = `./playground/${build ? '.output/public' : 'dist'}/${match?.[1]}.js`
    expect(existsSync(workboxName), `${workboxName} doesn't exist`).toBeTruthy()
    match = swContent.match(/url:\s*"manifest\.webmanifest"/)
    expect(match && match.length === 1, 'missing manifest.webmanifest in sw precache manifest').toBeTruthy()
    match = swContent.match(/url:\s*"\/"/)
    expect(match && match.length === 1, 'missing entry point route (/) in sw precache manifest').toBeTruthy()
    match = swContent.match(/url:\s*"about"/)
    expect(match && match.length === 1, 'missing about route (/about) in sw precache manifest').toBeTruthy()
    if (build) {
      match = swContent.match(/url:\s*"server\//)
      expect(match === null, 'found server/ entries in sw precache manifest').toBeTruthy()
    }
  })
})
