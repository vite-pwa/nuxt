import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { Bundler, PWAPluginContext } from '@unplugin-pwa/core/context-types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import type { PWAPluginContextOptions } from './shared-types.ts'

export interface NuxtPWAContext<
  B extends Bundler,
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
> extends PWAPluginContext<B, UserStrategy, T> {
  nuxt: PWAPluginContextOptions
}
