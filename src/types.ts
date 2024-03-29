import type { VitePWAOptions } from 'vite-plugin-pwa'

export interface ClientOptions {
  /**
   * Exposes the plugin: defaults to true.
   */
  registerPlugin?: boolean
  /**
   * Registers a periodic sync for updates interval: value in seconds.
   */
  periodicSyncForUpdates?: number
  /**
   * Will prevent showing native PWA install prompt: defaults to false.
   *
   * When set to true or no empty string, the native PWA install prompt will be prevented.
   *
   * When set to a string, it will be used as the key in `localStorage` to prevent show the PWA install prompt widget.
   *
   * When set to true, the key used will be `vite-pwa:hide-install`.
   */
  installPrompt?: boolean | string
}

export interface PwaModuleOptions extends Partial<VitePWAOptions> {
  registerWebManifestInRouteRules?: boolean
  /**
   * Writes the plugin to disk: defaults to false (debug).
   */
  writePlugin?: boolean
  /**
   * Options for plugin.
   */
  client?: ClientOptions
}
