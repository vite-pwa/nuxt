import type { Nuxt, NuxtHooks } from '@nuxt/schema'
import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { Bundler } from '@unplugin-pwa/core/context-types'
import type { NuxtPWAContext } from '@vite-pwa/nuxt-core/context-types'
import type { SWType } from '@vite-pwa/workbox-build/types'

export function nitroConfigHook<
  B extends Bundler,
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
  NPC extends NuxtPWAContext<B, UserStrategy, T>,
>(
  ctx: NPC,
  nuxt: Nuxt,
): NuxtHooks['nitro:config'] {
  return (nitroConfig) => {
    if (nuxt.options.experimental.payloadExtraction) {
      ctx.nuxt.enableGlobPatterns = !!nuxt.options.nitro.static
        || !!nitroConfig.prerender?.routes?.length
        || Object.values(nitroConfig.routeRules ?? {}).some(r => r.prerender)
    }
  }
}
