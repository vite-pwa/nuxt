import type { Nuxt } from '@nuxt/schema'
import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { PwaOptions } from '@vite-pwa/nuxt-core/types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import type { ViteNuxtPWAContext } from './internal-types.ts'
import { createCustomVitePWAContext } from '@unplugin-pwa/vite/vite-context'
import { prepareNuxtOptions } from './prepare-nuxt-options.ts'

export function createViteNuxtPwaContext<
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
>(
  nuxtVersion: string,
  buildAssetsDir: string,
  options: PwaOptions<UserStrategy, T>,
  nuxt: Nuxt,
  moduleResolver: ReturnType<typeof import('@nuxt/kit')['createResolver']>,
): ViteNuxtPWAContext<UserStrategy, T> {
  const {
    experimental,
    registerWebManifestInRouteRules,
    writePlugin,
    client = {},
    ...pwaOptions
  } = options

  const useClient = Object.assign(
    {},
    {
      registerPlugin: true,
      installPrompt: false,
      periodicSyncForUpdates: 0,
    },
    client,
  )

  const ctx = Object.assign(
    createCustomVitePWAContext<
      UserStrategy,
      T,
      'vite'
    >(
      'vite',
      true,
      pwaOptions,
    ),
    {
      nuxt: {
        prepareNuxtOptions: () => prepareNuxtOptions(ctx, nuxt),
        nuxtVersion,
        nitroPWAOptions: {
          publicAssets: [],
          routeRules: {},
        },
        buildAssetsDir,
        client: useClient,
        experimental,
        registerWebManifestInRouteRules,
        writePlugin,
        publicDirs: [],
        moduleResolver,
      },
    },
  ) as ViteNuxtPWAContext<UserStrategy, T>

  return ctx
}
