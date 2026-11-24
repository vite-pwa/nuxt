import process from 'node:process'
import { expect, test } from '@playwright/test'

test('The service worker is registered and cache storage is present', async ({ page }) => {
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
})

test('The install prompt is handled using the client options from pwa.config.ts', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  const prevented = await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true })
    window.dispatchEvent(event)
    return event.defaultPrevented
  })
  expect(prevented).toBe(true)
  await page.evaluate(() => (document.querySelector('#__nuxt') as any).__vue_app__.config.globalProperties.$pwa.cancelInstall())
  expect(await page.evaluate(() => localStorage.getItem('vite-pwa:hide-install'))).toBe('true')
  expect(await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true })
    window.dispatchEvent(event)
    return event.defaultPrevented
  })).toBe(false)
})

test('An install prompt captured before the client loads remains available', async ({ page }) => {
  let releaseScripts!: () => void
  const scriptsReady = new Promise<void>(resolve => releaseScripts = resolve)
  await page.route(/\/_nuxt\/.*\.js(?:\?.*)?$/, async (route) => {
    await scriptsReady
    await route.continue()
  })
  await page.goto('/', { waitUntil: 'commit' })
  await page.waitForFunction(() => '__vitePwaInstallPrompt' in window)

  expect(await page.evaluate(() => {
    window.dispatchEvent(new Event('beforeinstallprompt', { cancelable: true }))
    window.dispatchEvent(new Event('appinstalled'))
    return (window as any).__vitePwaInstallPrompt.event
  })).toBeUndefined()
  const prevented = await page.evaluate(() => {
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: () => { (window as any).installPromptCalled = true },
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    })
    window.dispatchEvent(event)
    return event.defaultPrevented
  })
  expect(prevented).toBe(true)
  releaseScripts()
  await page.waitForLoadState('load')
  await expect.poll(() => page.evaluate(() => (document.querySelector('#__nuxt') as any)?.__vue_app__?.config.globalProperties.$pwa?.showInstallPrompt)).toBe(true)

  const choice = await page.evaluate(() => (document.querySelector('#__nuxt') as any).__vue_app__.config.globalProperties.$pwa.install())
  expect(choice).toEqual({ outcome: 'accepted', platform: 'web' })
  expect(await page.evaluate(() => (window as any).installPromptCalled)).toBe(true)
  expect(await page.evaluate(() => (document.querySelector('#__nuxt') as any).__vue_app__.config.globalProperties.$pwa.showInstallPrompt)).toBe(false)
})

test('The install prompt opt-out is respected before and after the client loads', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('vite-pwa:hide-install', 'true'))
  let releaseScripts!: () => void
  const scriptsReady = new Promise<void>(resolve => releaseScripts = resolve)
  await page.route(/\/_nuxt\/.*\.js(?:\?.*)?$/, async (route) => {
    await scriptsReady
    await route.continue()
  })
  await page.goto('/', { waitUntil: 'commit' })
  await page.waitForFunction(() => !!document.querySelector('script[data-hid="vite-pwa-install-prompt"]'))
  expect(await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true })
    window.dispatchEvent(event)
    return event.defaultPrevented
  })).toBe(false)
  releaseScripts()
  await page.waitForLoadState('load')
  const prevented = await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true })
    window.dispatchEvent(event)
    return event.defaultPrevented
  })
  expect(prevented).toBe(false)
  expect(await page.evaluate(() => (document.querySelector('#__nuxt') as any).__vue_app__.config.globalProperties.$pwa.showInstallPrompt)).toBe(false)
})

test('The service worker route rules are applied', async ({ request }) => {
  test.skip(process.env.TEST_BUILD !== 'true', 'route rules are only applied by the Nitro server')
  const response = await request.get('/sw.js')
  expect(response.headers()['cache-control']).toBe('public, max-age=0, must-revalidate')
  // the playground enables `experimental.inlineRouteRules`, whose rebuild of the route rules must keep the module's rules
  const about = await request.get('/about')
  expect(about.headers()['x-inline-route-rule']).toBe('true')
})
