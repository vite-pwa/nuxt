import { join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { addComponent, addPluginTemplate, createResolver, defineNuxtModule, extendWebpackConfig } from '@nuxt/kit'
import type { VitePluginPWAAPI } from 'vite-plugin-pwa'
import { VitePWA } from 'vite-plugin-pwa'
import type { Plugin } from 'vite'
import type { ModuleOptions } from './types'
import { configurePWAOptions } from './config'
import { regeneratePWA, writeWebManifest } from './utils'

export * from './types'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'pwa',
    configKey: 'pwa',
  },
  defaults: nuxt => ({
    base: nuxt.options.app.baseURL,
    scope: nuxt.options.app.baseURL,
    injectRegister: false,
    includeManifestIcons: false,
    registerPlugin: true,
    writePlugin: false,
    client: {
      registerPlugin: true,
      installPrompt: false,
      periodicSyncForUpdates: 0,
    },
  }),
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    let vitePwaClientPlugin: Plugin | undefined
    const resolveVitePluginPWAAPI = (): VitePluginPWAAPI | undefined => {
      return vitePwaClientPlugin?.api
    }

    const client = options.client ?? { registerPlugin: true, installPrompt: false, periodicSyncForUpdates: 0 }
    if (client.registerPlugin) {
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
    }

    await addComponent({
      name: 'VitePwaManifest',
      filePath: resolver.resolve('./runtime/VitePwaManifest'),
    })

    nuxt.hook('prepare:types', ({ references }) => {
      references.push({ types: 'vite-plugin-pwa/vue' })
      references.push({ types: 'vite-plugin-pwa/info' })
    })

    const manifestDir = join(nuxt.options.buildDir, 'manifests')
    nuxt.options.nitro.publicAssets = nuxt.options.nitro.publicAssets || []
    nuxt.options.nitro.publicAssets.push({
      dir: manifestDir,
      maxAge: 0,
    })

    nuxt.hook('nitro:init', (nitro) => {
      configurePWAOptions(options, nuxt, nitro.options)
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
              await writeWebManifest(manifestDir, options.manifestFilename || 'manifest.webmanifest', api)
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
      nuxt.hook('nitro:init', (nitro) => {
        nitro.hooks.hook('rollup:before', async () => {
          await regeneratePWA(
            options.outDir!,
            resolveVitePluginPWAAPI(),
          )
        })
      })
      if (nuxt.options._generate) {
        nuxt.hook('close', async () => {
          await regeneratePWA(
            options.outDir!,
            resolveVitePluginPWAAPI(),
          )
        })
      }
    }
  },
})
