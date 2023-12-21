import process from 'node:process'
import { expect, test } from '@playwright/test'

const build = process.env.TEST_BUILD === 'true'
const allowlist = process.env.ALLOW_LIST === 'true'

test('The service worker is registered and cache storage is present', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('/')

  const swURL = await page.evaluate(async () => {
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_resolve, reject) => setTimeout(() => reject(new Error('Service worker registration failed: time out')), 10000)),
    ])
    // @ts-expect-error TS18046: 'registration' is of type 'unknown'.
    return registration.active?.scriptURL
  })
  const swName = 'sw.js'
  expect(swURL).toBe(`http://localhost:4173/${swName}`)

  const cacheContents = await page.evaluate(async () => {
    const cacheState: Record<string, Array<string>> = {}
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName)
      cacheState[cacheName] = (await cache.keys()).map(req => req.url)
    }
    return cacheState
  })

  expect(Object.keys(cacheContents).length).toEqual(1)

  const key = 'workbox-precache-v2-http://localhost:4173/'

  expect(Object.keys(cacheContents)[0]).toEqual(key)

  const urls = cacheContents[key].map(url => url.slice('http://localhost:4173/'.length))

  /*
    'http://localhost:4173/about?__WB_REVISION__=38251751d310c9b683a1426c22c135a2',
    'http://localhost:4173/?__WB_REVISION__=073370aa3804305a787b01180cd6b8aa',
    'http://localhost:4173/manifest.webmanifest?__WB_REVISION__=27df2fa4f35d014b42361148a2207da3'
    */
  expect(urls.some(url => url.startsWith('manifest.webmanifest?__WB_REVISION__='))).toEqual(true)
  expect(urls.some(url => url.startsWith('?__WB_REVISION__='))).toEqual(true)
  expect(urls.some(url => url.startsWith('about?__WB_REVISION__='))).toEqual(true)
  // dontCacheBustURLsMatching: any asset in _nuxt folder shouldn't have a revision (?__WB_REVISION__=)
  expect(urls.some(url => url.startsWith('_nuxt/') && url.endsWith('.css'))).toEqual(true)
  expect(urls.some(url => url.startsWith('_nuxt/') && url.endsWith('.js'))).toEqual(true)
  expect(urls.some(url => url.includes('_payload.json?__WB_REVISION__='))).toEqual(true)
  expect(urls.some(url => url.startsWith('_nuxt/builds/') && url.includes('.json'))).toEqual(true)
  expect(urls.some(url => url.includes('_nuxt/builds/latest.json?__WB_REVISION__='))).toEqual(true)
  // test missing page
  if (allowlist) {
    if (build) {
      // TODO: test runtime caching
    }
    else {
      await page.goto('/missing')
      const url = await page.evaluate(async () => {
        await new Promise(resolve => setTimeout(resolve, 3000))
        return location.href
      })
      expect(url).toBe('http://localhost:4173/missing')
      await expect(page.getByText('404')).toBeVisible()
      await expect(page.getByText('Page not found: /missing')).toBeVisible()
    }
  }
})
