import process from 'node:process'
import { expect, test } from '@playwright/test'

const build = process.env.TEST_BUILD === 'true'
const allowlist = process.env.ALLOW_LIST === 'true'

test('Test offline', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  page.on('console', (msg) => {
    if (msg.type() === 'error')
      // eslint-disable-next-line no-console
      console.log(`Error text: "${msg.text()}"`)
  })
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

  await new Promise(resolve => setTimeout(resolve, 3000))

  // TODO: PW seems to be not working properly

  await context.setOffline(true)

  // test missing page
  if (allowlist) {
    if (build) {
      // TODO: test runtime caching
    }
    else {
      await page.goto('/missing')
      await page.reload({ waitUntil: 'load' })
      const url = await page.evaluate(() => location.href)
      expect(url).toBe('http://localhost:4173/404')
      await expect(page.getByText('404')).toBeVisible()
      await expect(page.getByText('Page not found: /404')).toBeVisible()
    }
  }
})
