import type { Ref } from 'vue'
import type { UnwrapNestedRefs } from 'vue'

export interface UserChoice {
  outcome: 'accepted' | 'dismissed'
  platform: string
}

export type BeforeInstallPromptEvent = Event & {
  prompt: () => void
  userChoice: Promise<UserChoice>
}

export interface PwaInjection {
  /**
   * @deprecated use `isPWAInstalled` instead
   */
  isInstalled: boolean
  isPWAInstalled: Ref<boolean>
  showInstallPrompt: Ref<boolean>
  cancelInstall: () => void
  install: () => Promise<UserChoice | undefined>
  swActivated: Ref<boolean>
  registrationError: Ref<boolean>
  offlineReady: Ref<boolean>
  needRefresh: Ref<boolean>
  updateServiceWorker: (reloadPage?: boolean | undefined) => Promise<void>
  cancelPrompt: () => Promise<void>
  /**
   * From version 0.10.8 it is deprecated, use a plugin instead with the new Nuxt Runtime Client Hooks:
   * ```ts
   * // plugins/pwa.client.ts
   * export default defineNuxtPlugin((nuxtApp) => {
   *   nuxtApp.hook('service-worker:registered', ({ url, registration }) => {
   *     // eslint-disable-next-line no-console
   *     console.log(`service worker registered at ${url}`, registration)
   *   })
   *   nuxtApp.hook('service-worker:registration-failed', ({ error }) => {
   *     console.error(`service worker registration failed`, error)
   *   })
   *   nuxtApp.hook('service-worker:activated', ({ url, registration }) => {
   *     // eslint-disable-next-line no-console
   *     console.log(`service worker activated at ${url}`, registration)
   *   })
   * })
   * ```
   *
   * @deprecated
   */
  getSWRegistration: () => ServiceWorkerRegistration | undefined
}

declare module '#app' {
  interface NuxtApp {
    $pwa?: UnwrapNestedRefs<PwaInjection>
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $pwa?: UnwrapNestedRefs<PwaInjection>
  }
}

export {}
