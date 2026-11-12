import type { Nuxt } from '@nuxt/schema'
import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { SWType } from '@vite-pwa/workbox-build/types'
import type { Connect, Plugin } from 'vite'
import type { ViteLegacyNuxtPWAContext, ViteNuxtPWAContext } from './internal-types.ts'
// import { readFileSync } from 'node:fs'
// import path from 'node:path'
import { addVitePlugin/* , resolveAlias */ } from '@nuxt/kit'
// import { exactRegex } from '@rolldown/pluginutils'
import { DevPlugin } from '@unplugin-pwa/vite/plugins/dev'
import { DevMiddlewarePlugin } from '@unplugin-pwa/vite/plugins/dev-middleware'
import { DevAssetsMiddlewarePlugin } from '@unplugin-pwa/vite/plugins/dev-pwa-assets-middleware'
import { InfoPlugin } from '@unplugin-pwa/vite/plugins/info'
import { InspectorPlugin } from '@unplugin-pwa/vite/plugins/inspector'
import { MainPlugin } from '@unplugin-pwa/vite/plugins/main'
import { AssetsPlugin } from '@unplugin-pwa/vite/plugins/pwa-assets'
import { VirtualModulesPlugin } from '@unplugin-pwa/vite/plugins/virtual-modules'
// import { getMajor } from 'verkit'
import { PwaRuntimeConfiguration } from './plugins/pwa-runtime-configuration.ts'

export async function prepareNuxtOptions<
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
>(
  ctx: ViteNuxtPWAContext<UserStrategy, T> | ViteLegacyNuxtPWAContext<UserStrategy, T>,
  nuxt: Nuxt,
) {
  const devOptions = ctx.resolvedOptions.devOptions

  if (nuxt.options.dev && devOptions?.enabled) {
    const prefix = `${ctx.base}__skip_vite/`
    const buildAssetsDir = `${ctx.base}${ctx.nuxt.buildAssetsDir.slice(0, -1)}`
    // the dev middleware receives service worker sourcemap requests for workbox chunks under the build assets dir
    ctx.dev.options.mapSWSourcemapFile = (url) => {
      if (!url.startsWith(buildAssetsDir)) {
        return undefined
      }
      return url.slice(buildAssetsDir.length)
    }
    ctx.normalizeDevServiceWorkerId = (
      hook,
      depType,
      id,
    ) => {
      const useId = id.startsWith(prefix)
        ? id.slice(prefix.length - 1)
        : id
      if (depType === 'sw') {
        return [
          useId.startsWith('/')
            ? useId.slice(1)
            : useId,
          useId,
        ]
      }

      if (hook === 'load') {
        return [useId, useId]
      }

      const assetId = useId.startsWith('./')
        ? useId.slice(1)
        : useId
      return [assetId, assetId]
    }

    const swNames = ctx.dev.options.swNames
    if (swNames.hasNames) {
      const swRoutes = ctx.resolvedOptions.swType === 'classic-and-module'
        ? [swNames.classic, swNames.module]
        : [swNames.name]
      // Nuxt only forwards dev requests to Vite when a Vite middleware is registered for the route
      nuxt.hook('vite:serverCreated', (viteServer, { isServer }) => {
        if (isServer) {
          return
        }

        const next: Connect.NextHandleFunction = (_req, _res, next) => next()
        for (const route of swRoutes) {
          viteServer.middlewares.use(`${ctx.base}${route}`, next)
          viteServer.middlewares.use(`${ctx.base}${route}.map`, next)
        }
      })
    }
  }

  if (devOptions?.enabled && devOptions.inspector === 'vite-devtools') {
    devOptions.inspector = 'standalone'
  }

  /* TODO: this doesn't work
  const major = getMajor(ctx.nuxt.nuxtVersion)

  if (major > 3 && nuxt.options.experimental.appManifest) {
    if (ctx.resolvedOptions.strategy === 'build-sw') {
      const consumerPlugins = ctx.resolvedOptions.buildSW?.plugins
      ctx.resolvedOptions.buildSW!.plugins = (swType) => {
        const plugins = consumerPlugins?.(swType) ?? []
        plugins.unshift({
          name: 'vite-pwa:nuxt:app-manifest',
          enforce: 'pre',
          resolveId: {
            filter: {
              id: exactRegex('#app-manifest'),
            },
            handler(id) {
              return id === '#app-manifest'
                ? id
                : undefined
            },
          },
          load: {
            filter: {
              id: exactRegex('#app-manifest'),
            },
            async handler(id) {
              if (id !== '#app-manifest') {
                return undefined
              }
              const latestPath = resolveAlias(
                '~~/.nuxt/manifest/latest.json',
                nuxt.options.alias,
              )
              const latest: {
                id: string
              } = JSON.parse(readFileSync(latestPath, 'utf-8'))
              const manifest = JSON.parse(readFileSync(
                path.resolve(path.dirname(latestPath), `meta/${latest.id}.json`),
                'utf-8',
              ))
              // TODO: removes this hack once Nuxt 5 or Nitro fixes this issue
              if (major > 4 && !manifest.preprendered) {
                const useRoutes = new Set<string>()
                const routes = nuxt.options.prerender?.routes
                if (routes) {
                  routes.forEach(route => useRoutes.add(route))
                }
                const routeRules = Array.from(Object.entries(
                  nuxt.options.routeRules ?? {},
                )).filter(([_, rule]) => rule.prerender && (rule.isr === false || typeof rule.isr === 'undefined'))
                if (routeRules.length) {
                  routeRules.forEach(([route]) => useRoutes.add(route))
                }
                manifest.preprendered = Array.from(useRoutes)
              }
              return `export default ${JSON.stringify(manifest)}`
            },
          },
        })
        return plugins
      }
    }
  }
*/
  addVitePlugin([
    MainPlugin(ctx),
    VirtualModulesPlugin(ctx),
    InfoPlugin(ctx),
    DevPlugin(ctx),
    DevMiddlewarePlugin(ctx),
    DevAssetsMiddlewarePlugin(ctx),
    AssetsPlugin(ctx),
    PwaRuntimeConfiguration(ctx),
    InspectorPlugin(ctx),
  ] as Plugin[])
}
