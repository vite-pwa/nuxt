import type { Nuxt } from '@nuxt/schema'
import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type {
  Bundler,
} from '@unplugin-pwa/core/context-types'
import type { NuxtPWAContext } from '@vite-pwa/nuxt-core/context-types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import {
  addComponent,
  addImports,
  addPlugin,
} from '@nuxt/kit'
import { resolveDefaultConfig } from '@unplugin-pwa/core/config'
import { normalizePath } from '@vite-pwa/workbox-build/utils/resolve-sw-names'
import { isGreaterThanOrEqual } from 'verkit'
import { buildPwaAssets } from './build-pwa-assets'
import { buildBeforeHook } from './internal/build-before-hook'
import { devtoolsCustomTabsHook } from './internal/devtools-custom-tabs'
import { nitroConfigHook } from './internal/nitro-config-hook'
import { nitroInitHook } from './internal/nitro-init-hook'
import { prepareTypesHook } from './internal/prepare-types-hook'
import { serverDevHandlerHook } from './internal/server-dev-handler-hook'

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
  if (consumerOptions?.path) {
    // resolve nuxt aliases
    consumerOptions.path = await resolver.resolvePath(
      consumerOptions.path,
      {
        cwd: nuxt.options.rootDir,
        alias: nuxt.options.alias,
      },
    )
  }
  else {
    // check first for srcDir, then rootDir
    for (const path of [nuxt.options.srcDir, nuxt.options.rootDir]) {
      const resolvedPath = resolveDefaultConfig(path)
      if (resolvedPath) {
        consumerOptions.path = normalizePath(resolvedPath)
        break
      }
    }
  }

  ctx.externalConfigurationLoader = true

  ctx.base ??= ctx.consumerOptions.base || '/'
  ctx.consumerOptions.base ??= ctx.base
  ctx.consumerOptions.scope ??= ctx.base

  const runtimeDir = resolver.resolve('./runtime')
  nuxt.options.build.transpile.push(runtimeDir)

  nuxt.options.alias['#pwa'] = resolver.resolve(runtimeDir, 'composables')
  nuxt.options.build.transpile.push('#pwa')
  // nuxt.options.alias['#pwa-components'] = resolver.resolve(runtimeDir, 'components/index')
  // nuxt.options.build.transpile.push('#pwa-components')

  if (ctx.nuxt.client.registerPlugin) {
    addPlugin({
      src: resolver.resolve(runtimeDir, 'plugins/pwa.client'),
      mode: 'client',
    })
  }

  // hooks will run in this order
  // 1) configures nitroConfig at ctx.nuxt
  nuxt.hook('nitro:config', nitroConfigHook<B, UserStrategy, T, NPC>(ctx, nuxt))
  // 2) load configuration and prepare the PWA context: will configure pwa assets icons and runtime stuff
  nuxt.hook('nitro:init', nitroInitHook<B, UserStrategy, T, NPC>(ctx, nuxt))
  // 3) add PWA types and registers composables
  nuxt.hook('prepare:types', prepareTypesHook<B, UserStrategy, T, NPC>(ctx))
  // 4) prepare devtools tab: this hook runs between prepare:types and component:extend, cannot use build:before hook
  nuxt.hook('devtools:customTabs', devtoolsCustomTabsHook<B, UserStrategy, T, NPC>(ctx))
  // 5) add PWA components (components:extend)
  for (
    const name of [
      'NuxtPwaAssets',
      'NuxtPwaManifest',
      // 'PwaAppleImage',
      // 'PwaAppleSplashScreenImage',
      // 'PwaFaviconImage',
      // 'PwaMaskableImage',
      // 'PwaTransparentImage',
    ]
  ) {
    addComponent({
      name,
      global: !nuxt.options.imports.autoImport,
      filePath: resolver.resolve(runtimeDir, `components/${name}`),
    })
  }
  // 6) add PWA composables (imports:extend): this will be called twice, but nuxt will dedupe them
  addImports([
    'usePWA',
    'useTransparentPwaIcon',
    'useMaskablePwaIcon',
    'useFaviconPwaIcon',
    'useApplePwaIcon',
    'useAppleSplashScreenPwaIcon',
  ].map(key => ({
    name: key,
    as: key,
    from: resolver.resolve(runtimeDir, 'composables'),
  })))
  // 7) register nuxt hook to call PWA context:ready hook: cannot use build:done since builders hooks not
  //    being called and nuxt devtools should be ready after server:devHandler; unplugin-pwa devtools plugins
  //    awaiting at vite devtools setup PWA ready, this hook will call the PWA context:ready hook
  nuxt.hook('server:devHandler', serverDevHandlerHook<B, UserStrategy, T, NPC>(ctx, nuxt))
  // 8) add builders stuff: for example, when using vite, will add unplugin-pwa vite plugins and middlewares
  nuxt.hook('build:before', buildBeforeHook<B, UserStrategy, T, NPC>(ctx))

  // build SW when building/generating
  if (!nuxt.options.dev) {
    if (isGreaterThanOrEqual(ctx.nuxt.nuxtVersion, '3.8.0')) {
      // nuxt 5 should use nitro 'vite:before:compile' hook and maybe this hook is wrong
      // nuxt 5 has this new option experimental.nitroViteEnvironment to enable nitro/vite (v3)
      // maybe we even need a new hook at nitro v3
      nuxt.hook('nitro:build:public-assets', async () => {
        await buildPwaAssets<B, UserStrategy, T, NPC>(ctx)
      })
    }
    else {
      nuxt.hook('nitro:init', (nitro) => {
        nitro.hooks.hook('rollup:before', async () => {
          await buildPwaAssets<B, UserStrategy, T, NPC>(ctx)
        })
      })
      if (nuxt.options.nitro.static || (nuxt.options as any)._generate /* TODO: remove in future */) {
        nuxt.hook('close', async () => {
          await buildPwaAssets<B, UserStrategy, T, NPC>(ctx)
        })
      }
    }
  }
}
