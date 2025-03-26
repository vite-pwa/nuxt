import type { HookResult } from '@nuxt/schema'
import type { PwaModuleOptions } from './types'
import { defineNuxtModule } from '@nuxt/kit'
import { version } from '../package.json'
import { doSetup } from './utils/module'

export * from './types'

export interface ModuleOptions extends PwaModuleOptions {}

export interface ModuleRuntimeHooks {
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

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'pwa',
    configKey: 'pwa',
    compatibility: {
      nuxt: '>=3.6.5',
      bridge: false,
    },
    version,
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
    await doSetup(options, nuxt)
  },
})
