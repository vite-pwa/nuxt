import type { Nuxt, NuxtHooks } from '@nuxt/schema'
import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { Bundler } from '@unplugin-pwa/core/context-types'
import type { NuxtPWAContext } from '@vite-pwa/nuxt-core/context-types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import path from 'node:path'
import { normalizePath } from '@unplugin-pwa/core/helpers'
import { defu } from 'defu'
import { initPwaAssetsGenerator } from './init-pwa-assets-generator.ts'
import { prepareNitroRoutes } from './prepare-nitro-routes.ts'
import { prepareResolvedPwaOptions } from './prepare-resolved-pwa-options.ts'
import { registerPwaIconsTypes } from './register-pwa-icons-types.ts'

export function nitroInitHook<
  B extends Bundler,
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
  NPWAC extends NuxtPWAContext<B, UserStrategy, T>,
>(
  ctx: NPWAC,
  nuxt: Nuxt,
): NuxtHooks['nitro:init'] {
  return async (nitro) => {
    ctx.resolvedOptions.includeManifestIcons = false
    ctx.resolvedOptions.includeManifestScreenshots = false
    ctx.resolvedOptions.includeManifestShortcutIcons = false

    ctx.publicDir = nuxt.options.dir.public
    ctx.rootDir = nuxt.options.rootDir
    if (nuxt.options.dev) {
      ctx.devEnvironment = true
      const internalDevOptions = ctx.dev.options!
      internalDevOptions.tempFolder = path.resolve(nuxt.options.buildDir, 'pwa-dev/.dev-dist')
      ctx.outDir = internalDevOptions.tempFolder
    }
    else {
      ctx.outDir = normalizePath(nitro.options.output.publicDir)
    }

    ctx.resolvedOptions.outDir = ctx.outDir
    ctx.strategy = ctx.resolvedOptions.strategy!
    ctx.resolvedOptions.base ??= ctx.base
    ctx.resolvedOptions.buildBase ??= ctx.base
    ctx.resolvedOptions.scope ??= ctx.base

    await prepareResolvedPwaOptions<B, UserStrategy, T, NPWAC>(ctx, nuxt, ctx.outDir)
    await ctx.nuxt.preparePwaConfiguration?.()
    await initPwaAssetsGenerator(ctx, nuxt)
    await registerPwaIconsTypes<B, UserStrategy, T, NPWAC>(ctx, nuxt)
    await prepareNitroRoutes<B, UserStrategy, T, NPWAC>(ctx, nuxt)

    const routeRules = ctx.nuxt.nitroPWAOptions.routeRules
    if (Object.keys(routeRules).length > 0) {
      for (const [route, rules] of Object.entries(routeRules)) {
        nitro.options.routeRules[route] = defu(nitro.options.routeRules[route], rules)
      }
      // Nitro 3 compiles route rules into its router, which has to be rebuilt after changes
      ;(nitro as { routing?: { sync: () => void } }).routing?.sync()
    }
  }
}
