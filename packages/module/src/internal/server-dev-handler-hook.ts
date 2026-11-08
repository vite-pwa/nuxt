import type { Nuxt } from '@nuxt/schema'
import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { Bundler } from '@unplugin-pwa/core/context-types'
import type { NuxtPWAContext } from '@vite-pwa/nuxt-core/context-types'
import type { SWType } from '@vite-pwa/workbox-build/types'

export function serverDevHandlerHook<
  B extends Bundler,
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
  NPWAC extends NuxtPWAContext<B, UserStrategy, T>,
>(
  ctx: NPWAC,
  nuxt: Nuxt,
): import('@nuxt/schema').NuxtHooks['server:devHandler'] {
  return async () => {
    const devOptions = ctx.resolvedOptions.devOptions

    if (nuxt.options.dev && devOptions && devOptions.inspector) {
      await ctx.hooks.callHook('context:ready')
    }
  }
}
