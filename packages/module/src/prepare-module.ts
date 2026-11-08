import type { Nuxt } from '@nuxt/schema'
import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { Bundler } from '@unplugin-pwa/core/context-types'
import type { NuxtPWAContext } from '@vite-pwa/nuxt-core/context-types'
import type { PwaOptions } from '@vite-pwa/nuxt-core/types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import { existsSync } from 'node:fs'
import {
  addComponent,
  addImports,
  addPlugin,
} from '@nuxt/kit'
import { resolveDefaultConfig } from '@unplugin-pwa/core/config'
import { normalizePath } from '@unplugin-pwa/core/helpers'
import { loadPwaConfiguration } from '@vite-pwa/nuxt-core'
import { buildPwaAssets } from './build-pwa-assets.ts'
import { buildBeforeHook } from './internal/build-before-hook.ts'
import { devtoolsCustomTabsHook } from './internal/devtools-custom-tabs.ts'
import { nitroConfigHook } from './internal/nitro-config-hook.ts'
import { nitroInitHook } from './internal/nitro-init-hook.ts'
import { prepareTypesHook } from './internal/prepare-types-hook.ts'
import { serverDevHandlerHook } from './internal/server-dev-handler-hook.ts'

export async function prepareModule<
  B extends Bundler,
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
  NPC extends NuxtPWAContext<B, UserStrategy, T>,
>(
  ctx: NPC,
  nuxt: Nuxt,
) {
  const resolver = ctx.nuxt.moduleResolver

  const consumerOptions = ctx.consumerOptions
  if (consumerOptions.path) {
    consumerOptions.path = await resolver.resolvePath(
      consumerOptions.path,
      {
        cwd: nuxt.options.rootDir,
        alias: nuxt.options.alias,
      },
    )
  }
  else {
    for (const dir of [nuxt.options.srcDir, nuxt.options.rootDir]) {
      const resolvedPath = resolveDefaultConfig(dir)
      if (resolvedPath) {
        consumerOptions.path = normalizePath(resolvedPath)
        break
      }
    }
  }

  ctx.externalConfigurationLoader = true

  ctx.base ??= consumerOptions.base || '/'
  consumerOptions.base ??= ctx.base
  consumerOptions.scope ??= ctx.base

  const publicDirs = new Set<string>()
  for (const layer of nuxt.options._layers) {
    publicDirs.add(normalizePath(resolver.resolve(layer.config.rootDir, layer.config.dir?.public || 'public')))
  }
  ctx.nuxt.publicDirs = [...publicDirs].filter(dir => existsSync(dir))

  await loadPwaConfiguration<B, UserStrategy, T, NPC>(ctx, nuxt)
  if (ctx.resolvedOptions.path) {
    nuxt.options.watch.push(ctx.resolvedOptions.path)
    applyExternalNuxtOptions(ctx)
  }

  const runtimeDir = resolver.resolve('./runtime')
  nuxt.options.build.transpile.push(runtimeDir)
  nuxt.options.alias['#pwa'] = resolver.resolve(runtimeDir, 'composables')

  if (ctx.nuxt.client.registerPlugin) {
    addPlugin({
      src: resolver.resolve(runtimeDir, 'plugins/pwa.client'),
      mode: 'client',
    })
  }

  nuxt.hook('nitro:config', nitroConfigHook<B, UserStrategy, T, NPC>(ctx, nuxt))
  nuxt.hook('nitro:init', nitroInitHook<B, UserStrategy, T, NPC>(ctx, nuxt))
  nuxt.hook('prepare:types', prepareTypesHook<B, UserStrategy, T, NPC>(ctx))
  nuxt.hook('devtools:customTabs', devtoolsCustomTabsHook<B, UserStrategy, T, NPC>(ctx))

  for (const name of ['NuxtPwaAssets', 'NuxtPwaManifest']) {
    addComponent({
      name,
      global: !nuxt.options.imports.autoImport,
      filePath: resolver.resolve(runtimeDir, `components/${name}`),
    })
  }

  addImports([
    'usePWA',
    'useTransparentPwaIcon',
    'useMaskablePwaIcon',
    'useFaviconPwaIcon',
    'useApplePwaIcon',
    'useAppleSplashScreenPwaIcon',
  ].map(name => ({
    name,
    from: resolver.resolve(runtimeDir, 'composables'),
  })))

  // the PWA inspector waits for `context:ready`, which requires the dev server to be ready
  nuxt.hook('server:devHandler', serverDevHandlerHook<B, UserStrategy, T, NPC>(ctx, nuxt))
  nuxt.hook('build:before', buildBeforeHook<B, UserStrategy, T, NPC>(ctx))

  if (!nuxt.options.dev) {
    nuxt.hook('nitro:build:public-assets', async () => {
      await buildPwaAssets<B, UserStrategy, T, NPC>(ctx, nuxt)
    })
  }
}

function applyExternalNuxtOptions(ctx: NuxtPWAContext<any, any, any>) {
  const {
    client,
    experimental,
    registerWebManifestInRouteRules,
    writePlugin,
  } = ctx.resolvedOptions as Partial<PwaOptions<any, any>>
  if (client) {
    Object.assign(ctx.nuxt.client, client)
  }
  if (experimental) {
    ctx.nuxt.experimental = experimental
  }
  if (registerWebManifestInRouteRules !== undefined) {
    ctx.nuxt.registerWebManifestInRouteRules = registerWebManifestInRouteRules
  }
  if (writePlugin !== undefined) {
    ctx.nuxt.writePlugin = writePlugin
  }
}
