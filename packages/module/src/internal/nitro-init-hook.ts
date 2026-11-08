import type { Nuxt } from '@nuxt/schema'
import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { Bundler } from '@unplugin-pwa/core/context-types'
import type { NuxtPWAContext } from '@vite-pwa/nuxt-core/context-types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  normalizePath,
} from '@unplugin-pwa/core/helpers'
import { loadPwaConfiguration } from '@vite-pwa/nuxt-core'
import { initPwaAssetsGenerator } from './init-pwa-assets-generator'
import { prepareNitroRoutes } from './prepare-nitro-routes'
import { prepareResolvedPwaOptions } from './prepare-resolved-pwa-options'
import { registerPwaIconsTypes } from './register-pwa-icons-types'

export function nitroInitHook<
  B extends Bundler,
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
  NPWAC extends NuxtPWAContext<B, UserStrategy, T>,
>(
  ctx: NPWAC,
  nuxt: Nuxt,
): import('@nuxt/schema').NuxtHooks['nitro:init'] {
  return async (nitro) => {
    const publicDirs = new Set<string>()
    const resolver = ctx.nuxt.moduleResolver
    for (const layer of nuxt.options._layers) {
      publicDirs.add(normalizePath(resolver.resolve(layer.config.rootDir, layer.config.dir?.public || 'public')))
    }

    ctx.nuxt.publicDirs = [...publicDirs].filter(dir => existsSync(dir))

    await loadPwaConfiguration<B, UserStrategy, T, NPWAC>(ctx, nuxt)
    const externalPWAPath = ctx.resolvedOptions.path
    if (externalPWAPath) {
      nuxt.options.watch.push(externalPWAPath)
    }

    ctx.resolvedOptions.includeManifestIcons = false
    ctx.resolvedOptions.includeManifest = false
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
      ctx.outDir = normalizePath(nitro.options.output.publicDir ?? path.resolve(nuxt.options.rootDir, './.output/public'))
    }

    ctx.resolvedOptions.outDir = ctx.outDir
    ctx.strategy = ctx.resolvedOptions.strategy!
    ctx.resolvedOptions.base ??= ctx.base
    ctx.resolvedOptions.buildBase ??= ctx.base
    ctx.resolvedOptions.scope ??= ctx.base

    // apply nuxt pwa default options
    await prepareResolvedPwaOptions<B, UserStrategy, T, NPWAC>(ctx, nuxt, ctx.outDir)

    // add custom bundler options
    await ctx.nuxt.preparePwaConfiguration?.()

    // prepare pwa assets generator
    await initPwaAssetsGenerator(ctx, nuxt)

    // add pwa icons plugin and types
    await registerPwaIconsTypes<B, UserStrategy, T, NPWAC>(ctx, nuxt)

    // add nitro routes to the context
    await prepareNitroRoutes<B, UserStrategy, T, NPWAC>(ctx, nuxt)

    // update routeRules
    const routeRules = ctx.nuxt.nitroPWAOptions.routeRules
    if (Object.entries(routeRules).length > 0) {
      await nitro.updateConfig({
        routeRules: {
          ...nitro.options.routeRules,
          ...ctx.nuxt.nitroPWAOptions.routeRules,
        },
      })
    }
  }
}
