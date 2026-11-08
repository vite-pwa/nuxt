import type { Nuxt } from '@nuxt/schema'
import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { SWType } from '@vite-pwa/workbox-build/types'
import type { Plugin } from 'vite'
import type { ViteLegacyNuxtPWAContext, ViteNuxtPWAContext } from './internal-types.ts'
import { /* addDevServerHandler, */addVitePlugin } from '@nuxt/kit'
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
  if (nuxt.options.dev && ctx.resolvedOptions.devOptions!.enabled) {
    const prefix = `${ctx.base}__skip_vite/`
    let buildAssetsDir = nuxt.options.app.buildAssetsDir ?? '_nuxt/'
    if (buildAssetsDir[0] === '/') {
      buildAssetsDir = buildAssetsDir.slice(1)
    }
    if (buildAssetsDir[buildAssetsDir.length - 1] === '/') {
      buildAssetsDir = buildAssetsDir.slice(0, buildAssetsDir.length - 1)
    }
    buildAssetsDir = `${ctx.base}${buildAssetsDir}`
    // we don't know sw deps names, only sw names
    // unplugin-pwa dev middleware receiving /_nuxt/workbox-classic-xxxx.js.map
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
      nuxt.hook('vite:serverCreated', async (viteServer, { isServer }) => {
        if (isServer) {
          return
        }

        // @ts-expect-error just ignore
        const emptyHandle = (_req, _res, next) => {
          next()
        }

        if (ctx.resolvedOptions.swType === 'classic-and-module') {
          viteServer.middlewares.stack.push({
            route: `${ctx.base}${swNames.classic}`,
            handle: emptyHandle,
          })
          viteServer.middlewares.stack.push({
            route: `${ctx.base}${swNames.classic}.map`,
            handle: emptyHandle,
          })
          viteServer.middlewares.stack.push({
            route: `${ctx.base}${swNames.module}`,
            handle: emptyHandle,
          })
          viteServer.middlewares.stack.push({
            route: `${ctx.base}${swNames.module}.map`,
            handle: emptyHandle,
          })
          // }
        }
        else {
          viteServer.middlewares.stack.push({
            route: `${ctx.base}${swNames.name}`,
            handle: emptyHandle,
          })
          viteServer.middlewares.stack.push({
            route: `${ctx.base}${swNames.name}.map`,
            handle: emptyHandle,
          })
        }
      })
    }
  }

  const devOptions = ctx.resolvedOptions.devOptions

  if (devOptions?.enabled && devOptions?.inspector === 'vite-devtools') {
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
