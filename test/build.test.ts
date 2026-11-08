import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'
import { describe, expect, it } from 'vitest'

const build = process.env.TEST_BUILD === 'true'
const publicDir = './examples/playground-v3/.output/public'

function urlEntries(swContent: string, url: RegExp) {
  return swContent.match(new RegExp(`url:\\s*["'\`]${url.source}["'\`]`, 'g')) ?? []
}

describe(`test-${build ? 'build' : 'generate'}`, () => {
  it('service worker is generated: ', () => {
    const swName = `${publicDir}/sw.js`
    const webManifest = `${publicDir}/manifest.webmanifest`
    expect(existsSync(swName), `${swName} doesn't exist`).toBeTruthy()
    expect(existsSync(webManifest), `${webManifest} doesn't exist`).toBeTruthy()
    const swContent = readFileSync(swName, 'utf-8')
    const workbox = swContent.match(/importScripts\(["'`]\.\/(workbox-\w+\.js)["'`]\)/)
    expect(workbox, `workbox-***.js import not found in ${swName}`).toBeTruthy()
    const workboxName = `${publicDir}/${workbox![1]}`
    expect(existsSync(workboxName), `${workboxName} doesn't exist`).toBeTruthy()
    expect(swContent, 'found bare imports in sw.js').not.toMatch(/\bimport\s*[{"'*]|@vite-pwa\/workbox-swkit/)
    expect(urlEntries(swContent, /manifest\.webmanifest/), 'missing manifest.webmanifest in sw precache manifest').toHaveLength(1)
    expect(urlEntries(swContent, /\//), 'missing entry point route (/) in sw precache manifest').toHaveLength(1)
    expect(urlEntries(swContent, /about/), 'missing about route (/about) in sw precache manifest').toHaveLength(1)
    expect(urlEntries(swContent, /robots\.txt/), 'missing robots.txt added by pwa:beforeBuildServiceWorker in sw precache manifest').toHaveLength(1)
    expect(urlEntries(swContent, /_nuxt\/[^"'`]*\.(?:css|js)/).length, 'missing _nuxt/**.(css|js) in sw precache manifest').toBeGreaterThan(0)
    expect(urlEntries(swContent, /(?:about\/)?_payload\.json/), 'missing _payload.json and about/_payload.json entries in sw precache manifest').toHaveLength(2)
    expect(urlEntries(swContent, /_nuxt\/builds\/[^"'`]*\.json/).length, 'missing App Manifest json entries in sw precache manifest').toBeGreaterThan(0)
    if (build) {
      expect(urlEntries(swContent, /server\/[^"'`]*/), 'found server/ entries in sw precache manifest').toHaveLength(0)
    }
  })
})
