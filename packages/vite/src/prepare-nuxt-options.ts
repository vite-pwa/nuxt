import type { Nuxt } from '@nuxt/schema'
import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { SWType } from '@vite-pwa/workbox-build/types'
import type { Connect, Plugin } from 'vite'
import type { ViteLegacyNuxtPWAContext, ViteNuxtPWAContext } from './internal-types.ts'
import { addVitePlugin } from '@nuxt/kit'
import { DevPlugin } from '@unplugin-pwa/vite/plugins/dev'
import { DevMiddlewarePlugin } from '@unplugin-pwa/vite/plugins/dev-middleware'
import { DevAssetsMiddlewarePlugin } from '@unplugin-pwa/vite/plugins/dev-pwa-assets-middleware'
import { InfoPlugin } from '@unplugin-pwa/vite/plugins/info'
import { InspectorPlugin } from '@unplugin-pwa/vite/plugins/inspector'
import { MainPlugin } from '@unplugin-pwa/vite/plugins/main'
import { AssetsPlugin } from '@unplugin-pwa/vite/plugins/pwa-assets'
import { VirtualModulesPlugin } from '@unplugin-pwa/vite/plugins/virtual-modules'
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
