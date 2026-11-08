import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { ExternalPWAOptions } from '@unplugin-pwa/vite/config/types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import type { PwaOptions } from './types.ts'

export type NuxtExternalPWAOptions<
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
> = ExternalPWAOptions<UserStrategy, T, PwaOptions<UserStrategy, T>>

export function definePwaConfig<
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
>(
  config: Partial<NuxtExternalPWAOptions<UserStrategy, T>>,
): Partial<NuxtExternalPWAOptions<UserStrategy, T>> {
  return config
}
