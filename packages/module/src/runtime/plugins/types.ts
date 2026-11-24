import type { ShallowRef } from 'vue'

/**
 * Result of the native PWA installation prompt.
 */
export interface UserChoice {
  /**
   * The user's selection on the installation prompt.
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
   * Triggers the browser's native installation prompt.
   */
  prompt: () => void
  /**
   * Resolves with the user's selection once they interact with the prompt.
   */
  userChoice: Promise<UserChoice>
}

/**
 * PWA Install Prompt state and helpers exposed on `$pwa`.
 */
export interface PwaInstallPromptInjection {
  /**
   * Whether the app is currently installed as a PWA.
   * This value updates as installation state changes (e.g. display-mode changes).
   * Undefined on the server and until client hydration completes.
   */
  isPWAInstalled: ShallowRef<boolean | undefined>
  /**
   * When `true`, your UI should show a custom installation prompt. This flag is set
   * after the `beforeinstallprompt` event is captured and cleared when the user
   * proceeds or cancels.
   */
  showInstallPrompt: ShallowRef<boolean>
  /**
   * Cancels the custom install flow and hides future prompts by setting an
   * opt-out flag (stored in `localStorage` when configured via `installPrompt`).
   */
  cancelInstall: () => void
  /**
   * Shows the native installation prompt if available and returns the user's choice.
   * Returns `undefined` when the prompt is not available or not currently shown.
   */
  install: () => Promise<UserChoice | undefined>
}

/**
 * Reactive PWA state and helpers injected into Nuxt as `$pwa`.
 */
export interface PwaInjection extends PwaInstallPromptInjection {
  /**
   * Whether the service worker has reached the `activated` state.
   */
  swActivated: ShallowRef<boolean>
  /**
   * Indicates that registering the service worker failed.
   */
  registrationError: ShallowRef<boolean>
  /**
   * Becomes `true` when the app is ready to work offline (precache completed).
   * This flag is activated only once, when the service worker is registered and activated for first time.
   */
  offlineReady: ShallowRef<boolean>
  /**
   * Becomes `true` when a new service worker is waiting to activate and a
   * refresh is recommended to apply updates.
   */
  needRefresh: ShallowRef<boolean>
  /**
   * Applies the waiting service worker. When `reloadPage` is `true`, reloads
   * the page after activating the new service worker.
   */
  updateServiceWorker: (reloadPage?: boolean | undefined) => Promise<void>
  /**
   * Dismisses service worker update/installed notifications by resetting `offlineReady` and
   * `needRefresh` to `false`.
   */
  cancelPrompt: () => Promise<void>
}
