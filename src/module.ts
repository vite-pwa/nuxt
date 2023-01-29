import { addComponent, addPluginTemplate, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { VitePluginPWAAPI } from 'vite-plugin-pwa'
import { VitePWA } from 'vite-plugin-pwa'
import type { Plugin } from 'vite'
import type { ModuleOptions } from './types'
import { configurePWAOptions } from './config'

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
        write: options.writePlugin,
        options: {
          periodicSyncForUpdates: typeof client.periodicSyncForUpdates === 'number' ? client.periodicSyncForUpdates : 0,
          installPrompt: typeof client.installPrompt === 'undefined' || client.installPrompt === false
            ? undefined
            : client.installPrompt === true || client.installPrompt.trim() === ''
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
      references.push({ types: 'vite-plugin-pwa/client' })
    })

    // TODO: combine with configurePWAOptions?
    nuxt.hook('nitro:init', (nitro) => {
      options.outDir = nitro.options.output.publicDir
      options.injectManifest = options.injectManifest || {}
      options.injectManifest.globDirectory = nitro.options.output.publicDir
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

      configurePWAOptions(options, nuxt)
      const plugins = VitePWA(options)
      viteInlineConfig.plugins.push(plugins)
      if (isClient)
        vitePwaClientPlugin = plugins.find(p => p.name === 'vite-plugin-pwa') as Plugin
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
        nuxt.hook('close', async () => {
          // todo: cleanup dev-dist folder
        })
      }
    }
    else {
      if (options.registerWebManifestInRouteRules) {
        nuxt.hook('nitro:config', async (nitroConfig) => {
          nitroConfig.routeRules = nitroConfig.routeRules || {}
          nitroConfig.routeRules[`${nuxt.options.app.baseURL}${options.manifestFilename ?? 'manifest.webmanifest'}`] = {
            headers: {
              'Content-Type': 'application/manifest+json',
            },
          }
        })
      }
      nuxt.hook('nitro:init', (nitro) => {
        nitro.hooks.hook('rollup:before', async () => {
          await resolveVitePluginPWAAPI()?.generateSW()
        })
      })
    }
  },
})
