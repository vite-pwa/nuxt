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

export { definePwaConfig } from '@vite-pwa/nuxt-core/config'

export type ModuleOptions = PwaOptions<VitePWAStrategy, SWType>

/**
 * @deprecated Use `ModuleOptions` instead.
 */
export type PwaModuleOptions = ModuleOptions

export interface PwaModuleHooks {
  'pwa:beforeBuildServiceWorker': BeforeBuildServiceWorkerHook
}

export type ModuleHooks = PwaModuleHooks

export type BeforeBuildServiceWorkerHook<
  S extends Strategy = 'generate-sw',
  T extends SWType = 'classic',
> = (options: ResolvedVitePWAOptions<S, T>) => HookResult

export interface ServiceWorkerRuntimeHooksOptions {
  url: string
  registration?: ServiceWorkerRegistration
}

export interface ServiceWorkerRegistrationErrorOptions {
  error?: unknown
}

export interface PWAModuleRuntimeHooks {
  /**
   * Emitted before service worker registration to allow use `TrustedScriptURL`
   * @param withTrustedScriptUrl The callback to change the configuration.
   */
  'service-worker:before-register': (
    withTrustedScriptUrl: (trustedScriptUrl?: TrustedScriptURL | PWATrustedScriptURL) => void,
  ) => HookResult
  /**
   * Emitted when the service worker is registered
   * @param data The url and the optional service worker registration object
   */
  'service-worker:registered': (data: ServiceWorkerRuntimeHooksOptions) => HookResult
  /**
   * Emitted when the service worker registration fails
   * @param data The optional error object
   */
  'service-worker:registration-failed': (data: ServiceWorkerRegistrationErrorOptions) => HookResult
  /**
   * Emitted when the service worker is activated
   * @param data The url and the service worker registration object
   */
  'service-worker:activated': (data: ServiceWorkerRuntimeHooksOptions) => HookResult
}

export type ModuleRuntimeHooks = PWAModuleRuntimeHooks

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@vite-pwa/nuxt',
    configKey: 'pwa',
    compatibility: {
      nuxt: '>=3.9.0',
    },
  },
  defaults: nuxt => ({
    base: nuxt.options.app.baseURL,
    scope: nuxt.options.app.baseURL,
    injectRegister: false,
    includeManifestIcons: false,
    writePlugin: false,
    client: {
      registerPlugin: true,
      installPrompt: false,
      periodicSyncForUpdates: 0,
    },
  }),
  async setup(options, nuxt) {
    const [{ createNuxtPwaContext }, { prepareModule }] = await Promise.all([
      import('./create-nuxt-pwa-context.ts'),
      import('./prepare-module.ts'),
    ])
    const ctx = await createNuxtPwaContext(
      options,
      nuxt,
      createResolver(import.meta.url),
    )
    if (ctx) {
      await prepareModule(ctx, nuxt)
    }
  },
})
