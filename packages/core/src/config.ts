import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { SWType } from '@vite-pwa/workbox-build/types'
import type { PwaOptions } from './types.ts'

export type NuxtExternalPWAOptions<
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
> = Omit<PwaOptions<UserStrategy, T>, 'cwd' | 'path' | 'mergeOptions' | 'builder'>

export function definePwaConfig<
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
>(
  config: Partial<NuxtExternalPWAOptions<UserStrategy, T>>,
): Partial<NuxtExternalPWAOptions<UserStrategy, T>> {
  return config
}
