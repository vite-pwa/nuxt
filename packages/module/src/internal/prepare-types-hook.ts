import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { Bundler } from '@unplugin-pwa/core/context-types'
import type { NuxtPWAContext } from '@vite-pwa/nuxt-core/context-types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import { getMajor } from 'verkit'

export function prepareTypesHook<
  B extends Bundler,
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
  NPWAC extends NuxtPWAContext<B, UserStrategy, T>,
>(
  ctx: NPWAC,
): import('@nuxt/schema').NuxtHooks['prepare:types'] {
  return (context) => {
    const { references } = context
    references.push({ types: '@vite-pwa/nuxt/configuration' })
    references.push({ types: '@unplugin-pwa/core/vue' })
    references.push({ types: '@unplugin-pwa/core/info' })
    references.push({ types: '@unplugin-pwa/core/pwa-assets' })
    // check registerPwaIconsTypes
    references.push({ path: 'types/pwa-augments.d.ts' })
    if (getMajor(ctx.nuxt.nuxtVersion) >= 4) {
      context.nodeReferences.push({ types: '@vite-pwa/nuxt/configuration' })
      context.nodeReferences.push({ types: '@unplugin-pwa/core/vue' })
      context.nodeReferences.push({ types: '@unplugin-pwa/core/info' })
      context.nodeReferences.push({ types: '@unplugin-pwa/core/pwa-assets' })
      // check registerPwaIconsTypes
      context.nodeReferences.push({ path: 'types/pwa-augments.d.ts' })
    }
  }
}
