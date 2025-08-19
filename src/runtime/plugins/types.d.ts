import type { Ref } from 'vue'
import type { UnwrapNestedRefs } from 'vue'

/**
 * Result of the native PWA installation prompt.
 */
export interface UserChoice {
  /**
   * The user's selection on the install prompt.
   */
  outcome: 'accepted' | 'dismissed'
  /**
   * Platform identifier provided by the browser for where the prompt was shown
   * (for example, 'web' or a store-specific value). The exact values are
   * browser-dependent and not standardized.
   */
  platform: string
}

/**
 * Browser event fired before showing the native PWA install prompt.
 *
 * This event allows delaying the native prompt and showing a custom UI first.
 */
export type BeforeInstallPromptEvent = Event & {
  /**
   * Triggers the browser's native install prompt.
   */
  prompt: () => void
  /**
   * Resolves with the user's selection once they interact with the prompt.
   */
  userChoice: Promise<UserChoice>
}

/**
 * Reactive PWA state and helpers injected into Nuxt as `$pwa`.
 */
export interface PwaInjection {
  /**
   * @deprecated Use `isPWAInstalled` instead. Legacy boolean computed from
   * browser heuristics to detect if the app is installed.
   */
  isInstalled: boolean
  /**
   * Whether the app is currently installed as a PWA.
   * This value updates as installation state changes (e.g. display-mode changes).
   */
  isPWAInstalled: Ref<boolean>
  /**
   * When `true`, your UI should show a custom install prompt. This flag is set
   * after the `beforeinstallprompt` event is captured and cleared when the user
   * proceeds or cancels.
   */
  showInstallPrompt: Ref<boolean>
  /**
   * Cancels the custom install flow and hides future prompts by setting an
   * opt-out flag (stored in `localStorage` when configured via `installPrompt`).
   */
  cancelInstall: () => void
  /**
   * Shows the native install prompt if available and returns the user's choice.
   * Returns `undefined` when the prompt is not available or not currently shown.
   */
  install: () => Promise<UserChoice | undefined>
  /**
   * Whether the service worker has reached the `activated` state.
   */
  swActivated: Ref<boolean>
  /**
   * Indicates that registering the service worker failed.
   */
  registrationError: Ref<boolean>
  /**
   * Becomes `true` when the app is ready to work offline (precache completed).
   * This flag is activated only once, when the service worker is registered and activated for first time.
   */
  offlineReady: Ref<boolean>
  /**
   * Becomes `true` when a new service worker is waiting to activate and a
   * refresh is recommended to apply updates.
   */
  needRefresh: Ref<boolean>
  /**
   * Applies the waiting service worker. When `reloadPage` is `true`, reloads
   * the page after activating the new service worker.
   */
  updateServiceWorker: (reloadPage?: boolean | undefined) => Promise<void>
  /**
   * Dismisses update/install notifications by resetting `offlineReady` and
   * `needRefresh` to `false`.
   */
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
   * @deprecated Directly access the registration in your own plugin via the
   * runtime client hooks instead.
   */
  getSWRegistration: () => ServiceWorkerRegistration | undefined
}

declare module '#app' {
  interface NuxtApp {
    /**
     * Reactive PWA state and controls provided by @vite-pwa/nuxt.
     *
     * Example:
     * ```ts
     * const { $pwa } = useNuxtApp()
     * if ($pwa?.needRefresh) await $pwa.updateServiceWorker(true)
     * ```
     */
    $pwa?: UnwrapNestedRefs<PwaInjection>
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    /**
     * Reactive PWA state and controls provided by @vite-pwa/nuxt.
     *
     * Example:
     * ```ts
     * const { $pwa } = useNuxtApp()
     * if ($pwa?.needRefresh) await $pwa.updateServiceWorker(true)
     * ```
     */
    $pwa?: UnwrapNestedRefs<PwaInjection>
  }
}

export {}
