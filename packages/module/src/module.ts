import type { HookResult } from '@nuxt/schema'
import type {
  ResolvedVitePWAOptions,
  VitePWAStrategy,
} from '@unplugin-pwa/core'
import type { PWATrustedScriptURL, TrustedScriptURL } from '@unplugin-pwa/core/types'
import type { PwaOptions } from '@vite-pwa/nuxt-core/types'
import type { Strategy } from '@vite-pwa/workbox-build/config/types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import { createResolver, defineNuxtModule } from '@nuxt/kit'

export type ModuleOptions = PwaOptions<VitePWAStrategy, SWType>

export interface PwaModuleHooks {
  'pwa:beforeBuildServiceWorker': BeforeBuildServiceWorkerHook
}

export type ModuleHooks = PwaModuleHooks

export type BeforeBuildServiceWorkerHook<
  S extends Strategy = 'generate-sw',
  T extends SWType = 'classic',
> = (options: ResolvedVitePWAOptions<S, T>) => HookResult

export interface PWAModuleRuntimeHooks {
  /**
   * Emitted before service worker registration to allow use `TrustedScriptURL`
   * @param url The url.
   * @param swType The current service worker type.
   * @param withTrustedScriptUrl The callback to change the configuration.
   */
  'service-worker:before-register': (
    withTrustedScriptUrl: (trustedScriptUrl?: TrustedScriptURL | PWATrustedScriptURL) => void,
  ) => HookResult
  /**
   * Emitted when the service worker is registered
   * @param data The url and the optional service worker registration object
   */
  'service-worker:registered': (data: {
    url: string
    registration?: ServiceWorkerRegistration
  }) => HookResult
  /**
   * Emitted when the service worker registration fails
   * @param data The optional error object
   */
  'service-worker:registration-failed': (data: {
    error?: unknown
  }) => HookResult
  /**
   * Emitted when the service worker is activated
   * @param data The url and the service worker registration object
   */
  'service-worker:activated': (data: {
    url: string
    registration: ServiceWorkerRegistration
  }) => HookResult
}

export type ModuleRuntimeHooks = PWAModuleRuntimeHooks

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@vite-pwa/nuxt',
    configKey: 'pwa',
    compatibility: {
      nuxt: '>=3.9.0',
      // eslint-disable-next-line ts/ban-ts-comment
      // @ts-ignore property removed in Nuxt 4
      bridge: false,
    },
  },
  defaults: nuxt => ({
    base: nuxt.options.app.baseURL,
    scope: nuxt.options.app.baseURL,
    injectRegister: false,
    includeManifestIcons: false,
    registerPlugin: true,
    writePlugin: false,
    client: {
      registerPlugin: true,
      installPrompt: false,
      periodicSyncForUpdates: 0,
    },
  }),
  async setup(options, nuxt) {
    const [createNuxtPwaContext, prepareModule] = await Promise.all([
      import('./create-nuxt-pwa-context').then(({
        createNuxtPwaContext,
      }) => createNuxtPwaContext),
      import('./prepare-module').then(({
        prepareModule,
      }) => prepareModule),
    ])
    await createNuxtPwaContext(
      options,
      nuxt,
      createResolver(import.meta.url),
    ).then(config => prepareModule(
      config,
      nuxt,
    ))
  },
})
