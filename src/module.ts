import { join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import {
  addComponent,
  addPlugin,
  createResolver,
  defineNuxtModule,
  extendWebpackConfig,
  getNuxtVersion,
} from '@nuxt/kit'
import type { VitePluginPWAAPI } from 'vite-plugin-pwa'
import { VitePWA } from 'vite-plugin-pwa'
import type { Plugin } from 'vite'
import { version } from '../package.json'
import type { PwaModuleOptions } from './types'
import { configurePWAOptions } from './config'
import { regeneratePWA, writeWebManifest } from './utils'

export * from './types'

export default defineNuxtModule<PwaModuleOptions>({
  meta: {
    name: 'pwa',
    configKey: 'pwa',
    compatibility: {
      nuxt: '^3.6.5',
      bridge: false,
    },
    version,
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
    const nuxtVersion = (getNuxtVersion(nuxt) as string).split('.').map(v => Number.parseInt(v))
    const nuxt3_8 = nuxtVersion.length > 1 && (nuxtVersion[0] > 3 || (nuxtVersion[0] === 3 && nuxtVersion[1] >= 8))

    let vitePwaClientPlugin: Plugin | undefined
    const resolveVitePluginPWAAPI = (): VitePluginPWAAPI | undefined => {
      return vitePwaClientPlugin?.api
    }

    const client = options.client ?? { registerPlugin: true, installPrompt: false, periodicSyncForUpdates: 0 }
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

    const runtimeDir = resolver.resolve('./runtime')

    if (!nuxt.options.ssr)
      nuxt.options.build.transpile.push(runtimeDir)

    if (client.registerPlugin) {
      addPlugin({
        src: resolver.resolve(runtimeDir, 'plugins/pwa.client'),
        mode: 'client',
      })
    }

    await Promise.all([
      addComponent({
        name: 'VitePwaManifest',
        filePath: resolver.resolve(runtimeDir, 'components/VitePwaManifest'),
      }),
      addComponent({
        name: 'NuxtPwaManifest',
        filePath: resolver.resolve(runtimeDir, 'components/VitePwaManifest'),
      }),
    ])

    nuxt.hook('prepare:types', ({ references }) => {
      references.push({ path: resolver.resolve(runtimeDir, 'plugins/types') })
      references.push({ types: '@vite-pwa/nuxt/configuration' })
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
              await writeWebManifest(manifestDir, options.manifestFilename || 'manifest.webmanifest', api)
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
              const installPrompt = (typeof client.installPrompt === 'undefined' || client.installPrompt === false)
                ? undefined
                : (client.installPrompt === true || client.installPrompt.trim() === '')
                    ? 'vite-pwa:hide-install'
                    : client.installPrompt.trim()
              return `export const enabled = ${client.registerPlugin}
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
      if (nuxt3_8) {
        nuxt.hook('nitro:build:public-assets', async () => {
          await regeneratePWA(
            options.outDir!,
            resolveVitePluginPWAAPI(),
          )
        })
      }
      else {
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
    }
  },
})

export interface ModuleOptions extends PwaModuleOptions {}

declare module '@nuxt/schema' {
  interface NuxtConfig {
    ['pwa']?: Partial<ModuleOptions>
  }
  interface NuxtOptions {
    ['pwa']?: ModuleOptions
  }
}
