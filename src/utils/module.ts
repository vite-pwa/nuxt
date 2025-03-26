import type { Nuxt } from '@nuxt/schema'
import type { Plugin } from 'vite'
import type { VitePluginPWAAPI } from 'vite-plugin-pwa'
import type { PwaModuleOptions } from '../types'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import {
  addComponent,
  addDevServerHandler,
  addPlugin,
  createResolver,
  extendWebpackConfig,
  getNuxtVersion,
} from '@nuxt/kit'
import { VitePWA } from 'vite-plugin-pwa'
import { configurePWAOptions } from './config'
import { addPWAIconsPluginTemplate } from './pwa-icons-helper'
import { registerPwaIconsTypes } from './pwa-icons-types'
import { regeneratePWA, writeWebManifest } from './utils'

export async function doSetup(options: PwaModuleOptions, nuxt: Nuxt) {
  const resolver = createResolver(import.meta.url)
  const nuxtVersion = (getNuxtVersion(nuxt) as string).split('.').map(v => Number.parseInt(v))
  const nuxt3_8 = nuxtVersion.length > 1 && (nuxtVersion[0] > 3 || (nuxtVersion[0] === 3 && nuxtVersion[1] >= 8))

  let vitePwaClientPlugin: Plugin | undefined
  const resolveVitePluginPWAAPI = (): VitePluginPWAAPI | undefined => {
    return vitePwaClientPlugin?.api
  }

  const client = options.client ?? {
    registerPlugin: true,
    installPrompt: false,
    periodicSyncForUpdates: 0,
  }
  /* if (client.registerPlugin) {
    addPluginTemplate({
      src: resolver.resolve('../templates/pwa.client.ts'),
      write: nuxt.options.dev || options.writePlugin,
      options: {
        periodicSyncForUpdates: typeof client.periodicSyncForUpdates === 'number' ? client.periodicSyncForUpdates : 0,
        installPrompt: (typeof client.installPrompt === 'undefined' || client.installPrompt === false)
          ? undefined
          : (client.installPrompt === true || client.installPrompt.trim() === '')
              ? 'vite-pwa:hide-install'
              : client.installPrompt.trim(),
      },
    })
  } */

  const runtimeDir = resolver.resolve('../runtime')

  if (!nuxt.options.ssr)
    nuxt.options.build.transpile.push(runtimeDir)

  if (client.registerPlugin) {
    addPlugin({
      src: resolver.resolve(runtimeDir, 'plugins/pwa.client'),
      mode: 'client',
    })
  }

  const pwaAssetsEnabled = !!options.pwaAssets && options.pwaAssets.disabled !== true

  addPWAIconsPluginTemplate(pwaAssetsEnabled)

  await Promise.all([
    addComponent({
      name: 'VitePwaManifest',
      filePath: resolver.resolve(runtimeDir, 'components/VitePwaManifest'),
    }),
    addComponent({
      name: 'NuxtPwaManifest',
      filePath: resolver.resolve(runtimeDir, 'components/VitePwaManifest'),
    }),
    addComponent({
      name: 'NuxtPwaAssets',
      filePath: resolver.resolve(runtimeDir, 'components/NuxtPwaAssets'),
    }),
    addComponent({
      name: 'PwaAppleImage',
      filePath: resolver.resolve(runtimeDir, 'components/PwaAppleImage.vue'),
    }),
    addComponent({
      name: 'PwaAppleSplashScreenImage',
      filePath: resolver.resolve(runtimeDir, 'components/PwaAppleSplashScreenImage.vue'),
    }),
    addComponent({
      name: 'PwaFaviconImage',
      filePath: resolver.resolve(runtimeDir, 'components/PwaFaviconImage.vue'),
    }),
    addComponent({
      name: 'PwaMaskableImage',
      filePath: resolver.resolve(runtimeDir, 'components/PwaMaskableImage.vue'),
    }),
    addComponent({
      name: 'PwaTransparentImage',
      filePath: resolver.resolve(runtimeDir, 'components/PwaTransparentImage.vue'),
    }),
  ])

  nuxt.hook('prepare:types', ({ references }) => {
    references.push({ path: resolver.resolve(runtimeDir, 'plugins/types') })
    references.push({ types: '@vite-pwa/nuxt/configuration' })
    references.push({ types: 'vite-plugin-pwa/vue' })
    references.push({ types: 'vite-plugin-pwa/info' })
    references.push({ types: 'vite-plugin-pwa/pwa-assets' })
  })

  const pwaAssets = await registerPwaIconsTypes(options, nuxt, resolver, runtimeDir)

  const manifestDir = join(nuxt.options.buildDir, 'manifests')
  nuxt.options.nitro.publicAssets = nuxt.options.nitro.publicAssets || []
  nuxt.options.nitro.publicAssets.push({
    dir: manifestDir,
    maxAge: 0,
  })

  nuxt.hook('nitro:init', (nitro) => {
    configurePWAOptions(nuxt3_8, options, nuxt, nitro.options)
  })

  nuxt.hook('vite:extend', ({ config }) => {
    const plugin = config.plugins?.find(p => p && typeof p === 'object' && 'name' in p && p.name === 'vite-plugin-pwa')
    if (plugin)
      throw new Error('Remove vite-plugin-pwa plugin from Vite Plugins entry in Nuxt config file!')
  })

  nuxt.hook('vite:extendConfig', async (viteInlineConfig, { isClient }) => {
    viteInlineConfig.plugins = viteInlineConfig.plugins || []
    const plugin = viteInlineConfig.plugins.find(p => p && typeof p === 'object' && 'name' in p && p.name === 'vite-plugin-pwa')
    if (plugin)
      throw new Error('Remove vite-plugin-pwa plugin from Vite Plugins entry in Nuxt config file!')

    if (options.manifest && isClient) {
      viteInlineConfig.plugins.push({
        name: 'vite-pwa-nuxt:webmanifest:build',
        apply: 'build',
        async writeBundle(_options, bundle) {
          if (options.disable || !bundle)
            return

          const api = resolveVitePluginPWAAPI()
          if (api) {
            await mkdir(manifestDir, { recursive: true })
            await writeWebManifest(manifestDir, options.manifestFilename || 'manifest.webmanifest', api, pwaAssets)
          }
        },
      })
    }

    if (isClient) {
      viteInlineConfig.plugins = viteInlineConfig.plugins || []
      const configuration = 'virtual:nuxt-pwa-configuration'
      const resolvedConfiguration = `\0${configuration}`
      viteInlineConfig.plugins.push({
        name: 'vite-pwa-nuxt:configuration',
        enforce: 'pre',
        resolveId(id) {
          if (id === configuration)
            return resolvedConfiguration
        },
        load(id) {
          if (id === resolvedConfiguration) {
            const display = typeof options.manifest !== 'boolean' ? options.manifest?.display ?? 'standalone' : 'standalone'
            const installPrompt = (typeof client.installPrompt === 'undefined' || client.installPrompt === false)
              ? undefined
              : (client.installPrompt === true || client.installPrompt.trim() === '')
                  ? 'vite-pwa:hide-install'
                  : client.installPrompt.trim()
            return `export const enabled = ${client.registerPlugin}
export const display = '${display}'
export const installPrompt = ${JSON.stringify(installPrompt)}
export const periodicSyncForUpdates = ${typeof client.periodicSyncForUpdates === 'number' ? client.periodicSyncForUpdates : 0}
`
          }
        },
      })
    }

    // remove vite plugin pwa build plugin
    const plugins = [...VitePWA(options).filter(p => p.name !== 'vite-plugin-pwa:build')]
    viteInlineConfig.plugins.push(plugins)
    if (isClient)
      vitePwaClientPlugin = plugins.find(p => p.name === 'vite-plugin-pwa') as Plugin
  })

  extendWebpackConfig(() => {
    throw new Error('Webpack is not supported: @vite-pwa/nuxt module can only be used with Vite!')
  })

  if (nuxt.options.dev) {
    const webManifest = `${nuxt.options.app.baseURL}${options.devOptions?.webManifestUrl ?? options.manifestFilename ?? 'manifest.webmanifest'}`
    const devSw = `${nuxt.options.app.baseURL}dev-sw.js?dev-sw`
    const workbox = `${nuxt.options.app.baseURL}workbox-`
    // @ts-expect-error just ignore
    const emptyHandle = (_req, _res, next) => {
      next()
    }
    nuxt.hook('vite:serverCreated', (viteServer, { isServer }) => {
      if (isServer)
        return

      viteServer.middlewares.stack.push({ route: webManifest, handle: emptyHandle })
      viteServer.middlewares.stack.push({ route: devSw, handle: emptyHandle })
      if (options.pwaAssets) {
        viteServer.middlewares.stack.push({
          route: '',
          // @ts-expect-error just ignore
          handle: async (req, res, next) => {
            const url = req.url
            if (!url)
              return next()

            if (!/\.(?:ico|png|svg|webp)$/.test(url))
              return next()

            const pwaAssetsGenerator = await resolveVitePluginPWAAPI()?.pwaAssetsGenerator()
            if (!pwaAssetsGenerator)
              return next()

            const icon = await pwaAssetsGenerator.findIconAsset(url)
            if (!icon)
              return next()

            if (icon.age > 0) {
              const ifModifiedSince = req.headers['if-modified-since'] ?? req.headers['If-Modified-Since']
              const useIfModifiedSince = ifModifiedSince ? Array.isArray(ifModifiedSince) ? ifModifiedSince[0] : ifModifiedSince : undefined
              if (useIfModifiedSince && new Date(icon.lastModified).getTime() / 1000 >= new Date(useIfModifiedSince).getTime() / 1000) {
                res.statusCode = 304
                res.end()
                return
              }
            }

            const buffer = await icon.buffer
            res.setHeader('Age', icon.age / 1000)
            res.setHeader('Content-Type', icon.mimeType)
            res.setHeader('Content-Length', buffer.length)
            res.setHeader('Last-Modified', new Date(icon.lastModified).toUTCString())
            res.statusCode = 200
            res.end(buffer)
          },
        })
      }
    })

    if (!options.strategies || options.strategies === 'generateSW') {
      nuxt.hook('vite:serverCreated', (viteServer, { isServer }) => {
        if (isServer)
          return

        viteServer.middlewares.stack.push({ route: workbox, handle: emptyHandle })
      })
      if (options.devOptions?.suppressWarnings) {
        const suppressWarnings = `${nuxt.options.app.baseURL}suppress-warnings.js`
        nuxt.hook('vite:serverCreated', (viteServer, { isServer }) => {
          if (isServer)
            return

          viteServer.middlewares.stack.push({ route: suppressWarnings, handle: emptyHandle })
        })
      }
      const { sourcemap = nuxt.options.sourcemap.client === true } = options.workbox ?? {}
      if (sourcemap) {
        const swMap = `${nuxt.options.app.baseURL}${options.filename ?? 'sw.js'}.map`
        const resolvedSwMapFile = join(nuxt.options.buildDir, 'dev-sw-dist', swMap)
        const worboxMap = `${nuxt.options.app.baseURL}workbox-`
        addDevServerHandler({
          route: '',
          handler: await import('h3').then(({ defineLazyEventHandler }) => defineLazyEventHandler(async () => {
            const { dev } = await import('./dev')
            return dev(
              swMap,
              resolvedSwMapFile,
              worboxMap,
              nuxt.options.buildDir,
              nuxt.options.app.baseURL,
            )
          })),
        })
      }
    }
  }
  else {
    if (!options.disable && options.registerWebManifestInRouteRules) {
      nuxt.hook('nitro:config', async (nitroConfig) => {
        nitroConfig.routeRules = nitroConfig.routeRules || {}
        let swName = options.filename || 'sw.js'
        if (options.strategies === 'injectManifest' && swName.endsWith('.ts'))
          swName = swName.replace(/\.ts$/, '.js')

        nitroConfig.routeRules[`${nuxt.options.app.baseURL}${swName}`] = {
          headers: {
            'Cache-Control': 'public, max-age=0, must-revalidate',
          },
        }
        // if provided by the user, we don't know web manifest name
        if (options.manifest) {
          nitroConfig.routeRules[`${nuxt.options.app.baseURL}${options.manifestFilename ?? 'manifest.webmanifest'}`] = {
            headers: {
              'Content-Type': 'application/manifest+json',
              'Cache-Control': 'public, max-age=0, must-revalidate',
            },
          }
        }
      })
    }
    if (nuxt3_8) {
      nuxt.hook('nitro:build:public-assets', async () => {
        await regeneratePWA(
          options.outDir!,
          pwaAssets,
          resolveVitePluginPWAAPI(),
        )
      })
    }
    else {
      nuxt.hook('nitro:init', (nitro) => {
        nitro.hooks.hook('rollup:before', async () => {
          await regeneratePWA(
            options.outDir!,
            pwaAssets,
            resolveVitePluginPWAAPI(),
          )
        })
      })
      if (nuxt.options._generate) {
        nuxt.hook('close', async () => {
          await regeneratePWA(
            options.outDir!,
            pwaAssets,
            resolveVitePluginPWAAPI(),
          )
        })
      }
    }
  }
}
